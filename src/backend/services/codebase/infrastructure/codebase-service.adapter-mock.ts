import { ICodebaseServicePort } from '../domain/port-out/codebase-service.port';
import { CodebaseData } from '../domain/model/codebase.model';
import { initialCodebase, FOLDER_POSITIONS, JSON_SCHEMA_SPEC } from './data/codebase.data';

export class CodebaseAdapter implements ICodebaseServicePort {
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

  public loadGraphDataFromFile(file: File): Promise<any> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (event) => {
        try {
          const json = JSON.parse(event.target?.result as string);
          resolve(json);
        } catch (err) {
          reject(new Error('Invalid graph data format file.'));
        }
      };
      reader.onerror = () => {
        reject(new Error('Failed to read file.'));
      };
      reader.readAsText(file);
    });
  }

  public getFolderPositions(): Record<string, { label: string }> {
    return FOLDER_POSITIONS;
  }

  public getJsonSchemaSpec(): unknown {
    return JSON_SCHEMA_SPEC;
  }
}
