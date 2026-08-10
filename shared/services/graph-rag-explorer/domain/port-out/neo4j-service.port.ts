import { CodebaseData } from '../model/codebase.model';

export interface INeo4jServicePort {
  executeCypher(query: string, params?: Record<string, any>): Promise<any>;
  getPathsChangeImpacts?(paths: string[]): Promise<CodebaseData>;
}
