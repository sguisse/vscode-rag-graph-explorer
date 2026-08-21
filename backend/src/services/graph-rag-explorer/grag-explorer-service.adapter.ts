import * as vscode from 'vscode';
import { AbstractServiceAdapter } from '../../core/AbstractServiceAdapter';
import { CodebaseData, mapToCodebaseData } from '../../../../shared/services/graph-rag-explorer';
import { IGraphRagExplorerServicePort } from '../../../../shared/services/graph-rag-explorer/domain/port-out/grag-explorer-service.port';
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
// 1. Upstream and Downstream Traversal (Works for Java :SourceFile and TS :Module as both have label :File)
CALL () {
  MATCH (target:File)
  WHERE target.absolute_path = $targetPath
     OR target.absoluteFileName = $targetPath
     OR target.fileName = $targetPath
     OR $targetPath ENDS WITH replace(coalesce(target.absoluteFileName, target.fileName, target.absolute_path, ""), "./", "")
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
     OR target.absoluteFileName = $targetPath
     OR target.fileName = $targetPath
     OR $targetPath ENDS WITH replace(coalesce(target.absoluteFileName, target.fileName, target.absolute_path, ""), "./", "")
  CALL apoc.path.expandConfig(target, {
    relationshipFilter: "DEPENDS_ON>",
    labelFilter: "+File",
    minLevel: 0,
    maxLevel: $downstreamDepth,
    uniqueness: "NODE_GLOBAL"
  }) YIELD path
  RETURN path
}

// 2. Extraction and deduplication (Flatten relationships without dropping isolated files)
WITH collect(path) AS allPaths
UNWIND allPaths AS p
UNWIND nodes(p) AS sfNode

WITH collect(DISTINCT sfNode) AS impactedFiles,
     [pathItem IN allPaths | relationships(pathItem)] AS relArrays

WITH impactedFiles,
     [r IN apoc.coll.flatten(relArrays) WHERE r IS NOT NULL] AS traversedRels

// 3. Aggregation of Types/Classes/Interfaces/Functions and Members (Java & TS)
UNWIND impactedFiles AS sf

// Pattern comprehensions replace OPTIONAL MATCH + collect() to eliminate null-aggregation warnings
WITH sf, traversedRels,
     [(sf)<-[:WITH_SOURCE|HAS_SOURCE_FILE]-(tJava:Type) WHERE NOT tJava.name CONTAINS '$' | tJava] AS javaTypes,
     [(sf)-[:DECLARES|EXPORTS]->(tTS) WHERE (tTS:Class OR tTS:Interface OR tTS:TypeAlias OR tTS:Enum) AND NOT tTS.name CONTAINS '$' | tTS] AS tsTypes

// Pick a single primary top-level type per file (Java Type -> TS Structure -> File Node fallback)
WITH sf,
     coalesce(head(javaTypes), head(tsTypes), sf) AS t,
     traversedRels

// Extract labels, annotations, methods/functions, and fields/properties
WITH sf, t, traversedRels,
     [lbl IN labels(t) WHERE NOT lbl IN ['All']] AS nodeLabels,
     [(t)-[:ANNOTATED_BY]->()-[:OF_TYPE]->(ann:Type) WHERE ann.name IS NOT NULL | ann.name] AS annotationNames,

     apoc.coll.toSet(
       [(parent)-[:DECLARES|EXPORTS]->(m) WHERE parent IN [t, sf] AND (m:Method OR m:Function) AND NOT m.name STARTS WITH 'lambda$' | {
         id: coalesce(m.entity_id, m.globalFqn, elementId(m)),
         name: m.name,
         visibility: coalesce(m.visibility, "public"),
         signature: coalesce(m.signature, m.name),
         summary: apoc.convert.toMap(m)['summary']
       }]
     ) AS methodsData,

     apoc.coll.toSet(
       [(parent)-[:DECLARES]->(f) WHERE parent IN [t, sf] AND (f:Field OR f:Property) | {
         name: f.name,
         visibility: coalesce(f.visibility, "public"),
         type: coalesce(
           HEAD([(f)-[:OF_TYPE]->(fType:Type) | coalesce(fType.fqn, fType.globalFqn, fType.name)]),
           apoc.convert.toMap(f)['type'],
           apoc.convert.toMap(f)['typeAnnotation'],
           "unknown"
         )
       }]
     ) AS fieldsData

WITH sf, t, traversedRels, methodsData, fieldsData,
     apoc.coll.toSet([x IN (nodeLabels + annotationNames) WHERE x IS NOT NULL AND x <> '']) AS mergedTypeLabels

// Case-insensitive filter ensuring mergedTypeLabels contains "SERVICE" --> Use for dev tests only
// WHERE ANY(lbl IN mergedTypeLabels WHERE toUpper(lbl) = 'SERVICE')

// 4. Projection aligned to RawNeo4jRecord interface
WITH sf,
     coalesce(sf.absolute_path, sf.absoluteFileName, sf.fileName) AS filePath,
     t,
     mergedTypeLabels,
     methodsData,
     fieldsData,
     traversedRels

RETURN coalesce(sf.entity_id, sf.globalFqn, elementId(sf)) AS fileId,
       sf.fileName AS fileName,
       replace(
         split(filePath, "/")[-1],
         "." + split(filePath, ".")[-1],
         ""
       ) AS name,
       filePath AS path,
       mergedTypeLabels AS typeLabels,
       coalesce(t.fqn, t.globalFqn, t.localFqn, t.name, sf.fileName) AS fqn,
       methodsData,
       [item IN fieldsData WHERE item.name IS NOT NULL] AS fieldsData,
       [r IN traversedRels | {
         id: elementId(r),
         source: coalesce(startNode(r).entity_id, startNode(r).globalFqn, elementId(startNode(r))),
         target: coalesce(endNode(r).entity_id, endNode(r).globalFqn, elementId(endNode(r))),
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
