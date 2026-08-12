import { CodebaseData } from '../model/codebase.model';

export interface IGraphRagExplorerServicePort {
  getPathsChangeImpacts(paths: string[], upstreamDepth: number, downstreamDepth: number): Promise<CodebaseData>;
}
