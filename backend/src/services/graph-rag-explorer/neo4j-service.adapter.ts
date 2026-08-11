import * as vscode from 'vscode';
import { AbstractServiceAdapter } from '../../core/AbstractServiceAdapter';
import { vsCodeSettingsManager } from '../../managers/VsCodeSettings.manager';
import { INeo4jServicePort } from '../../../../shared/services/graph-rag-explorer/domain/port-out/neo4j-service.port';
import neo4j, { Driver } from 'neo4j-driver';
import { logError, logInfo } from '../../utils/utils-log';
import { CodebaseData } from '../../../../shared/services/graph-rag-explorer';
import { initialCodebase } from './data/codebase.data';
import { log } from 'console';

export class Neo4jAdapter extends AbstractServiceAdapter implements INeo4jServicePort, vscode.Disposable {
  private neo4jDriver: Driver | null = null;

  constructor() {
    super();
    this.initializeNeo4jDriver();
  }

  private initializeNeo4jDriver() {
    const uri = vsCodeSettingsManager.getSettings().graphRagExplorer.neo4j.uri;
    const user = vsCodeSettingsManager.getSettings().graphRagExplorer.neo4j.username;
    const password = vsCodeSettingsManager.getSettings().graphRagExplorer.neo4j.password;
    this.neo4jDriver = neo4j.driver(uri, neo4j.auth.basic(user, password));
  }

  /**
   * Executes a Cypher query against the Neo4j database.
   *
   * @param query - The Cypher query string to execute.
   * @param params - Optional key-value object of query parameters.
   * @returns Array of plain JavaScript objects containing query results.
   */
  public async executeCypher(query: string, params?: Record<string, any>): Promise<any> {
    const session = this.neo4jDriver!.session();

    try {
      logInfo(`Executing Cypher query: ${query} \n\n with parameters: \n${JSON.stringify(params)}`);
      const result = await session.run(query, params);

      const rows = result.records.map((record) => {
        const row: Record<string, any> = {};

        record.keys.forEach((key) => {
          const stringKey = String(key);
          row[stringKey] = this.convertNeo4jValues(record.get(key));
        });

        return row;
      });

      // Cast through 'unknown' to satisfy generic return type T
      return rows as unknown as any;
    } catch (error) {
      logError('Failed to execute Cypher query:', error);
      throw error;
    } finally {
      await session.close();
    }
  }

  /**
   * Helper to recursively convert Neo4j Types (like Integers, Nodes, or Relationships)
   * into standard JavaScript types.
   */
  private convertNeo4jValues(value: any): any {
    if (value === null || value === undefined) {
      return value;
    }

    // 1. Convert Neo4j 64-bit Integers to native JS numbers
    if (neo4j.isInt(value)) {
      return value.toNumber();
    }

    // 2. Convert Neo4j Node or Relationship instances (extract properties)
    if (typeof value === 'object' && value !== null && 'properties' in value) {
      return this.convertNeo4jValues(value.properties);
    }

    // 3. Recursively convert Arrays
    if (Array.isArray(value)) {
      return value.map((v) => this.convertNeo4jValues(v));
    }

    // 4. Recursively convert Objects safely using Object.entries
    if (typeof value === 'object' && value.constructor === Object) {
      const convertedObj: Record<string, any> = {};

      for (const [key, val] of Object.entries(value)) {
        convertedObj[key] = this.convertNeo4jValues(val);
      }

      return convertedObj;
    }

    return value;
  }

  public async getPathsChangeImpacts(paths: string[], maxDepth: number = 3): Promise<CodebaseData> {
    // Convert paths and maxDepth to a format suitable for Neo4j query parameters
    const params = { paths, maxDepth };

    logInfo(`Fetching change impacts for params: ${JSON.stringify(params)}`);

    return this.executeCypher(`
WITH $paths AS inputPaths, toInteger(COALESCE($maxDepth, 3)) AS depthLimit

UNWIND inputPaths AS inputPath

// 1. Find initial source nodes
MATCH (startClass:Class)
WHERE inputPath ENDS WITH replace(startClass.fileName, ".class", ".java")
   OR (startClass.absolute_path IS NOT NULL AND inputPath = startClass.absolute_path)

// 2. Traversal: Outgoing (Callees) and Incoming (Callers)
OPTIONAL MATCH calleePath = (startClass)-[:DEPENDS_ON*1..5]->(calleeClass:Class)
WHERE calleeClass <> startClass AND length(calleePath) <= depthLimit

OPTIONAL MATCH callerPath = (callerClass:Class)-[:DEPENDS_ON*1..5]->(startClass)
WHERE callerClass <> startClass AND length(callerPath) <= depthLimit

// 3. Aggregate all nodes and path relationships in the impact graph
WITH startClass,
     collect(DISTINCT calleeClass) + collect(DISTINCT callerClass) + [startClass] AS rawNodes,
     [p IN collect(DISTINCT calleePath) + collect(DISTINCT callerPath) WHERE p IS NOT NULL | relationships(p)] AS pathRels

UNWIND rawNodes AS n
WITH startClass, collect(DISTINCT n) AS allNodes, pathRels

UNWIND (CASE WHEN size(pathRels) = 0 THEN [[]] ELSE pathRels END) AS relList
UNWIND relList AS rel
WITH allNodes, collect(DISTINCT rel) AS allRels

// 4. Map Nodes to CodebaseFile objects (including attributes & methods)
UNWIND allNodes AS node
OPTIONAL MATCH (node)-[:DECLARES]->(f:Field)
WITH allRels, node, collect(DISTINCT {
  name: f.name,
  visibility: COALESCE(f.visibility, 'package')
}) AS rawFields

OPTIONAL MATCH (node)-[:DECLARES]->(m:Method)
WITH allRels, node, rawFields, collect(DISTINCT {
  id: COALESCE(m.entity_id, m.signature, m.name),
  name: m.name,
  description: m.signature
}) AS rawMethods

WITH allRels, collect(DISTINCT {
  id: COALESCE(node.entity_id, node.fqn, node.name),
  name: node.name + ".java",
  type: CASE WHEN "Interface" IN labels(node) THEN "interface" ELSE "class" END,
  path: COALESCE(node.absolute_path, replace(node.fileName, ".class", ".java")),
  language: "java",
  size: COALESCE(node.effectiveLineCount, 0),
  complexity: COALESCE(node.cyclomaticComplexity, 0),
  attributes: [x IN rawFields WHERE x.name IS NOT NULL],
  methods: [x IN rawMethods WHERE x.name IS NOT NULL],
  configProperties: []
}) AS files

// 5. Map Edges to Dependency objects
UNWIND (CASE WHEN size(allRels) = 0 THEN [null] ELSE allRels END) AS rel
WITH files, collect(DISTINCT CASE WHEN rel IS NOT NULL THEN {
  id: COALESCE(startNode(rel).entity_id, startNode(rel).name) + "->" + COALESCE(endNode(rel).entity_id, endNode(rel).name),
  sourceNode: COALESCE(startNode(rel).entity_id, startNode(rel).fqn, startNode(rel).name),
  sourceHandle: "source",
  targetNode: COALESCE(endNode(rel).entity_id, endNode(rel).fqn, endNode(rel).name),
  targetHandle: "target",
  relation: type(rel),
  label: type(rel),
  source: COALESCE(startNode(rel).entity_id, startNode(rel).fqn, startNode(rel).name),
  target: COALESCE(endNode(rel).entity_id, endNode(rel).fqn, endNode(rel).name)
} END) AS dependencies

RETURN {
  files: files,
  dependencies: [x IN dependencies WHERE x IS NOT NULL]
} AS codebaseData`, params);
    //return { files: [], dependencies: [] };

    //return initialCodebase;
  }

  public dispose() {
    this.neo4jDriver?.close();
  }
}
