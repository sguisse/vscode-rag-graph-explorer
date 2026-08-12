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
CALL {
  MATCH (target:SourceFile {absolute_path: $targetPath})
  CALL apoc.path.expandConfig(target, {
    relationshipFilter: "<DEPENDS_ON",
    labelFilter: "+SourceFile",
    minLevel: 0,
    maxLevel: $upstreamDepth,
    uniqueness: "NODE_GLOBAL"
  }) YIELD path
  RETURN path

  UNION

  MATCH (target:SourceFile {absolute_path: $targetPath})
  CALL apoc.path.expandConfig(target, {
    relationshipFilter: "DEPENDS_ON>",
    labelFilter: "+SourceFile",
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

// 3. Aggregation of members (Types, Methods, Fields) for each file
UNWIND impactedFiles AS sf

OPTIONAL MATCH (t:Type)-[:WITH_SOURCE]->(sf)
OPTIONAL MATCH (t)-[:DECLARES]->(m:Method)
OPTIONAL MATCH (t)-[:DECLARES]->(f:Field)

WITH sf, t,
     collect(DISTINCT m) AS methods,
     collect(DISTINCT f) AS fields,
     traversedRels

// 4. Projection aligned to the RawNeo4jRecord interface
RETURN sf.entity_id AS fileId,
       sf.fileName AS fileName,
       replace(
         split(sf.absolute_path, "/")[-1],
         "." + split(sf.absolute_path, ".")[-1],
         ""
       ) AS name,
       sf.absolute_path AS path,
       labels(t) AS typeLabels,
       t.fqn AS fqn,
       [m IN methods WHERE m.entity_id IS NOT NULL | {
         id: m.entity_id,
         name: m.name,
         signature: m.signature,
         summary: m.summary
       }] AS methodsData,
       [f IN fields WHERE f.name IS NOT NULL | {
         name: f.name,
         visibility: f.visibility
       }] AS fieldsData,
       [r IN traversedRels | {
         id: elementId(r),
         source: startNode(r).entity_id,
         target: endNode(r).entity_id,
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
