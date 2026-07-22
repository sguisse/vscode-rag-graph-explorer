import { ICodebaseRepositoryPort } from '../domain/port-out/codebase-repository.port';
import { CodebaseData } from '../domain/model/codebase.model';
import { initialCodebase, FOLDER_POSITIONS, JSON_SCHEMA_SPEC } from './data/codebase.data';

export class MockCodebaseAdapter implements ICodebaseRepositoryPort {
  private currentCodebase: CodebaseData = initialCodebase;

  public getCodebase(): CodebaseData {
    return this.currentCodebase;
  }

  public importCodebase(data: CodebaseData): void {
    if (!data || !Array.isArray(data.files) || !Array.isArray(data.dependencies)) {
      throw new Error("Invalid AST data schema: must contain 'files' and 'dependencies' arrays");
    }
    this.currentCodebase = data;
  }

  public getFolderPositions(): Record<string, { label: string }> {
    return FOLDER_POSITIONS;
  }

  public getJsonSchemaSpec(): unknown {
    return JSON_SCHEMA_SPEC;
  }
}
