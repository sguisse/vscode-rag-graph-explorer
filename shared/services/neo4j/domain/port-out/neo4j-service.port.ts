export interface INeo4jServicePort {
  executeCypher(query: string, params?: Record<string, any>): Promise<any>;
}
