import { CodebaseData, CodebaseFile, Dependency, ICodebaseServicePort, ImpactDirection, MEMBER_KEY_SEPARATOR_TOKEN, SelectedEntity } from '../../../../shared/services/graph-rag-explorer';
import { initialCodebase, FOLDER_POSITIONS, JSON_SCHEMA_SPEC } from './data/codebase.data';

export class CodebaseMockAdapter implements ICodebaseServicePort {
  private currentCodebase: CodebaseData = initialCodebase;

  public async getCodebase(): Promise<CodebaseData> {
    return this.currentCodebase;
  }

  public async importCodebase(data: CodebaseData): Promise<void> {
    if (!data || !Array.isArray(data.files) || !Array.isArray(data.dependencies)) {
      throw new Error("Invalid AST data schema: must contain 'files' and 'dependencies' arrays");
    }
    this.currentCodebase = data;
  }

  public async getFolderPositions(): Promise<Record<string, { label: string }>> {
    return FOLDER_POSITIONS;
  }

  public async getJsonSchemaSpec(): Promise<unknown> {
    return JSON_SCHEMA_SPEC;
  }

}
