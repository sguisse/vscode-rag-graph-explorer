import * as vscode from 'vscode';
import { AbstractServiceAdapter } from '../../core/AbstractServiceAdapter';
import { CodebaseData, mapToCodebaseData } from '../../../../shared/services/graph-rag-explorer';
import { IGraphRagExplorerServicePort } from '../../../../shared/services/graph-rag-explorer/port-out/grag-explorer-service.port';
import { logInfo } from '../../utils/utils-log';
import { INeo4jServicePort } from '../../../../shared/services/neo4j';
import { serviceRegistry } from '../../core/ServiceRegistry';
import { ServiceEnum } from '../../../../shared/config/service-enum.gen';

export class GraphRagExplorerAdapter extends AbstractServiceAdapter implements IGraphRagExplorerServicePort, vscode.Disposable {
  private neo4jService!: INeo4jServicePort;

  constructor() {
    super();
  }

  getNeo4jService(): INeo4jServicePort {
    if (!this.neo4jService) {
      this.neo4jService = serviceRegistry.get(ServiceEnum.NEO4J);
    }
    return this.neo4jService;
  }


  public async getPathsChangeImpacts(paths: string[], upstreamDepth: number, downstreamDepth: number): Promise<CodebaseData> {
    // Convert paths and maxDepth to a format suitable for Neo4j query parameters
    const params = { targetPath: paths[0], upstreamDepth, downstreamDepth };

    logInfo(`Fetching change impacts for params: ${JSON.stringify(params)}`);

    const records: any = await this.getNeo4jService().executeCypher(`
// 1. Upstream and Downstream Traversal
CALL () {
  MATCH (target:File)
  WHERE target.absolute_path = $targetPath
     OR target.fileName = $targetPath
     OR apoc.convert.toMap(target)['absoluteFileName'] = $targetPath
     OR $targetPath ENDS WITH replace(coalesce(apoc.convert.toMap(target)['absoluteFileName'], target.fileName, target.absolute_path, ""), "./", "")
  CALL apoc.path.expandConfig(target, {
    relationshipFilter: "<DEPENDS_ON",
    labelFilter: "+File",
    minLevel: 0,
    maxLevel: $upstreamDepth,
    uniqueness: "NODE_GLOBAL"
  }) YIELD path
  RETURN path

  UNION

  MATCH (target:File)
  WHERE target.absolute_path = $targetPath
     OR target.fileName = $targetPath
     OR apoc.convert.toMap(target)['absoluteFileName'] = $targetPath
     OR $targetPath ENDS WITH replace(coalesce(apoc.convert.toMap(target)['absoluteFileName'], target.fileName, target.absolute_path, ""), "./", "")
  CALL apoc.path.expandConfig(target, {
    relationshipFilter: "DEPENDS_ON>",
    labelFilter: "+File",
    minLevel: 0,
    maxLevel: $downstreamDepth,
    uniqueness: "NODE_GLOBAL"
  }) YIELD path
  RETURN path
}

// 2. Extraction and Deduplication
WITH collect(path) AS allPaths
UNWIND allPaths AS p
UNWIND nodes(p) AS sfNode

WITH collect(DISTINCT sfNode) AS impactedFiles,
     [pathItem IN allPaths | relationships(pathItem)] AS relArrays

WITH impactedFiles,
     [r IN apoc.coll.flatten(relArrays) WHERE r IS NOT NULL] AS traversedRels

// 3. Aggregation of Types/Classes/Interfaces/Functions and Members
UNWIND impactedFiles AS sf

WITH sf, traversedRels,
     [(sf)<-[:WITH_SOURCE]-(tJava:Type) WHERE NOT tJava.name CONTAINS '$' | tJava] AS javaTypes,
     [(sf)-[rTS]->(tTS) WHERE type(rTS) IN ['DECLARES', 'EXPORTS'] AND ANY(lbl IN labels(tTS) WHERE lbl IN ['Class', 'Interface', 'TypeAlias', 'Enum']) AND NOT tTS.name CONTAINS '$' | tTS] AS tsTypes

WITH sf,
     coalesce(head(javaTypes), head(tsTypes), sf) AS t,
     traversedRels

// Extract labels, annotations, methods/functions (with summary fallback), and fields
WITH sf, t, traversedRels,
     [lbl IN labels(t) WHERE NOT lbl IN ['All']] AS nodeLabels,
     [(t)-[:ANNOTATED_BY]->()-[:OF_TYPE]->(ann:Type) WHERE ann.name IS NOT NULL | ann.name] AS annotationNames,

     apoc.coll.toSet(
       [(parent)-[rM]->(m) WHERE parent IN [t, sf] AND type(rM) IN ['DECLARES', 'EXPORTS'] AND (m:Method OR m:Function) AND NOT m.name STARTS WITH 'lambda$' | {
         id: coalesce(m.entity_id, apoc.convert.toMap(m)['globalFqn'], elementId(m)),
         name: m.name,
         visibility: coalesce(m.visibility, "public"),
         signature: coalesce(m.signature, m.name),
         summary: coalesce(m.summary, apoc.convert.toMap(m)['summary']),
         code_analysis: coalesce(m.code_analysis, apoc.convert.toMap(m)['code_analysis']),
         firstLineNumber: coalesce(m.firstLineNumber, apoc.convert.toMap(m)['firstLineNumber']),
         lastLineNumber: coalesce(m.lastLineNumber, apoc.convert.toMap(m)['lastLineNumber']),
         effectiveLineCount: coalesce(m.effectiveLineCount, apoc.convert.toMap(m)['effectiveLineCount']),
         cyclomaticComplexity: coalesce(m.cyclomaticComplexity, apoc.convert.toMap(m)['cyclomaticComplexity'])
       }]
     ) AS methodsData,

     apoc.coll.toSet(
       [(parent)-[:DECLARES]->(f) WHERE parent IN [t, sf] AND (f:Field OR f:Property) | {
         name: f.name,
         visibility: coalesce(f.visibility, "public"),
         type: coalesce(HEAD([(f)-[:OF_TYPE]->(fType:Type) | coalesce(fType.fqn, apoc.convert.toMap(fType)['globalFqn'], fType.name)]),
                        apoc.convert.toMap(f)['type'],
                        apoc.convert.toMap(f)['typeAnnotation'],
                        "unknown"
         )
       }]
     ) AS fieldsData

WITH sf, t, traversedRels, methodsData, fieldsData,
     apoc.coll.toSet([x IN (nodeLabels + annotationNames) WHERE x IS NOT NULL AND x <> '']) AS mergedTypeLabels

// 4. Projection with File, Type, and Method Summaries
WITH sf,
     coalesce(sf.absolute_path, apoc.convert.toMap(sf)['absoluteFileName'], sf.fileName) AS filePath,
     t,
     mergedTypeLabels,
     methodsData,
     fieldsData,
     traversedRels

RETURN coalesce(sf.entity_id, apoc.convert.toMap(sf)['globalFqn'], elementId(sf)) AS fileId,
       sf.fileName AS fileName,
       replace(
         split(filePath, "/")[-1],
         "." + split(filePath, ".")[-1],
         ""
       ) AS name,
       filePath AS path,
       coalesce(sf.summary, apoc.convert.toMap(sf)['summary']) AS fileSummary,
       coalesce(t.summary, apoc.convert.toMap(t)['summary']) AS typeSummary,
       mergedTypeLabels AS typeLabels,
       coalesce(t.fqn, apoc.convert.toMap(t)['globalFqn'], apoc.convert.toMap(t)['localFqn'], t.name, sf.fileName) AS fqn,
       methodsData,
       [item IN fieldsData WHERE item.name IS NOT NULL] AS fieldsData,
       [r IN traversedRels | {
         id: elementId(r),
         source: coalesce(startNode(r).entity_id, apoc.convert.toMap(startNode(r))['globalFqn'], elementId(startNode(r))),
         target: coalesce(endNode(r).entity_id, apoc.convert.toMap(endNode(r))['globalFqn'], elementId(endNode(r))),
         type: type(r)
       }] AS relsData

    `
    , params);

    logInfo(`Change impacts fetched successfully for params: ${JSON.stringify(params)}`);

    // Transform the result into the CodebaseData structure
    const codebaseData: CodebaseData = mapToCodebaseData(records);
    return codebaseData;
  }

  public dispose() {
  }
}
