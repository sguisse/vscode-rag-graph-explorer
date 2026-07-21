import { ICodebaseRepositoryPort } from '../domain/port-out/codebase-repository.port';
import { CodebaseData } from '../domain/model/codebase.model';
import { initialCodebase, FOLDER_POSITIONS, JSON_SCHEMA_SPEC } from './data/codebase.data';

export class MockCodebaseAdapter implements ICodebaseRepositoryPort {
  getCodebase(): CodebaseData {
    return initialCodebase;
  }

  getFolderPositions(): Record<string, { label: string }> {
    return FOLDER_POSITIONS;
  }

  getJsonSchemaSpec(): unknown {
    return JSON_SCHEMA_SPEC;
  }
}
