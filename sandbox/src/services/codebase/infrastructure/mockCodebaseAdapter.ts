import { ICodebaseRepositoryPort } from '../domain/port-out/codebase-repository.port';
import { CodebaseData } from '../domain/model/codebase.model';
import { initialCodebase, FOLDER_POSITIONS, JSON_SCHEMA_SPEC } from '@/features/explorer/wksp-cnt-graph/components/graph/GraphData';

export class MockCodebaseAdapter implements ICodebaseRepositoryPort {
  getCodebase(): CodebaseData {
    return initialCodebase as CodebaseData;
  }

  getFolderPositions(): Record<string, { label: string }> {
    return FOLDER_POSITIONS;
  }

  getJsonSchemaSpec(): any {
    return JSON_SCHEMA_SPEC;
  }
}
