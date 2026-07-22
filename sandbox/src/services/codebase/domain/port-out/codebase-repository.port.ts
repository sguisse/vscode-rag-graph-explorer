import { CodebaseData } from '../model/codebase.model';

export interface ICodebaseRepositoryPort {
  getCodebase(): CodebaseData;
  importCodebase(data: CodebaseData): void;
  getFolderPositions(): Record<string, { label: string }>;
  getJsonSchemaSpec(): unknown;
}
