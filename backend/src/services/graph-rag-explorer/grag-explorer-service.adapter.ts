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
    // 1. Capture of all upstream and downstream paths
// 1. Upstream and Downstream Traversal (Works for Java :SourceFile and TS :Module as both have label :File)
CALL {
  MATCH (target:File)
  WHERE target.absolute_path = $targetPath OR target.absoluteFileName = $targetPath
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
  WHERE target.absolute_path = $targetPath OR target.absoluteFileName = $targetPath
  CALL apoc.path.expandConfig(target, {
    relationshipFilter: "DEPENDS_ON>",
    labelFilter: "+File",
    minLevel: 0,
    maxLevel: $downstreamDepth,
    uniqueness: "NODE_GLOBAL"
  }) YIELD path
  RETURN path
}

// 2. Extraction and deduplication of crossed nodes and relationships
WITH collect(path) AS allPaths
UNWIND allPaths AS p
UNWIND nodes(p) AS sfNode
UNWIND relationships(p) AS relNode

WITH collect(DISTINCT sfNode) AS impactedFiles,
     collect(DISTINCT relNode) AS traversedRels

// 3. Aggregation of Types/Classes/Interfaces and Members (Java & TS)
UNWIND impactedFiles AS sf

// Match Java types (WITH_SOURCE -> file) OR TypeScript declarations (file -> DECLARES)
OPTIONAL MATCH (sf)<-[:WITH_SOURCE]-(tJava:Type)
OPTIONAL MATCH (sf)-[:DECLARES]->(tTS)
WHERE tTS:Class OR tTS:Interface OR tTS:TypeAlias OR tTS:Enum

WITH sf, coalesce(tJava, tTS) AS t, traversedRels

// Match Methods (Java Method or TS Method/Function) and Fields (Java Field or TS Property)
OPTIONAL MATCH (t)-[:DECLARES]->(m) WHERE m:Method OR m:Function
OPTIONAL MATCH (t)-[:DECLARES]->(f) WHERE f:Field OR f:Property

WITH sf, t,
     collect(DISTINCT m) AS methods,
     collect(DISTINCT f) AS fields,
     traversedRels

// 4. Projection aligned to RawNeo4jRecord interface
WITH sf,
     coalesce(sf.absolute_path, sf.absoluteFileName) AS filePath,
     t,
     methods,
     fields,
     traversedRels

RETURN coalesce(sf.entity_id, sf.globalFqn, elementId(sf)) AS fileId,
       sf.fileName AS fileName,
       replace(
         split(filePath, "/")[-1],
         "." + split(filePath, ".")[-1],
         ""
       ) AS name,
       filePath AS path,
       labels(t) AS typeLabels,
       coalesce(t.fqn, t.globalFqn, t.localFqn, t.name) AS fqn,
       [m IN methods WHERE m IS NOT NULL | {
         id: coalesce(m.entity_id, m.globalFqn, elementId(m)),
         name: m.name,
         signature: coalesce(m.signature, m.name),
         summary: m.summary
       }] AS methodsData,
       [f IN fields WHERE f.name IS NOT NULL | {
         name: f.name,
         visibility: coalesce(f.visibility, "public")
       }] AS fieldsData,
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
