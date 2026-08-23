export interface INeo4jServicePort {
  executeCypher(query: string, params?: Record<string, any>): Promise<any>;
  startNeo4jDatabase(): Promise<boolean>;
  stopNeo4jDatabase(): Promise<boolean>;
  restartNeo4jDatabase(): Promise<boolean>;
}
