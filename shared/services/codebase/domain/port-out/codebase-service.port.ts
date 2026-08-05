import { CodebaseData } from '../model/codebase.model';

export interface ICodebaseServicePort {
  getCodebase(): CodebaseData;
  importCodebase(data: CodebaseData): void;
  getFolderPositions(): Record<string, { label: string }>;
  getJsonSchemaSpec(): unknown;
}
