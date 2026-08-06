import { CodebaseData, CodebaseFile, Dependency, ImpactDirection, SelectedEntity } from '../model/codebase.model';
import { IBackendService } from '../../../../core/backend-service.port';

export interface ICodebaseServicePort extends IBackendService {
  getCodebase(): Promise<CodebaseData>;
  importCodebase(data: CodebaseData): Promise<void>;
  getFolderPositions(): Promise<Record<string, { label: string }>>;
  getJsonSchemaSpec(): Promise<unknown>;

}
