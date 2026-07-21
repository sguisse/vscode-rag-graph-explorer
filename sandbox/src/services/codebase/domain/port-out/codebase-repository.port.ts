import { CodebaseData } from '../model/codebase.model';

export interface ICodebaseRepositoryPort {
  getCodebase(): CodebaseData;
  getFolderPositions(): Record<string, { label: string }>;
  getJsonSchemaSpec(): unknown;
}
