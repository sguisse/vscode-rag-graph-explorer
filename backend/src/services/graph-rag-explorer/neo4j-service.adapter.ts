import * as vscode from 'vscode';
import { AbstractServiceAdapter } from '../../core/AbstractServiceAdapter';
import { vsCodeSettingsManager } from '../../managers/VsCodeSettings.manager';
import { INeo4jServicePort } from '../../../../shared/services/graph-rag-explorer/domain/port-out/neo4j-service.port';
import neo4j, { Driver } from 'neo4j-driver';
import { logError, logInfo } from '../../utils/utils-log';
import { CodebaseData } from '../../../../shared/services/graph-rag-explorer';
import { initialCodebase } from './data/codebase.data';

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
      logInfo(`Executing Cypher query: ${query} with parameters: ${JSON.stringify(params)}`);
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

  public async getPathsChangeImpacts?(paths: string[]): Promise<CodebaseData> {
    this.executeCypher(`MATCH (f:File)
      WHERE any(p IN $paths WHERE f.path CONTAINS p OR f.name CONTAINS p OR p CONTAINS f.path OR f.id CONTAINS p)
      OPTIONAL MATCH (caller)-[r1:CALLS|DEPENDS_ON|USES|INVOKES|IMPORTS]->(f)
      OPTIONAL MATCH (f)-[r2:CALLS|DEPENDS_ON|USES|INVOKES|IMPORTS]->(callee)
      RETURN f, collect(distinct caller) as callers, collect(distinct callee) as callees, collect(distinct r1) as inRels, collect(distinct r2) as outRels`, { paths });
    //return { files: [], dependencies: [] };

    return initialCodebase;
  }

  public dispose() {
    this.neo4jDriver?.close();
  }
}
