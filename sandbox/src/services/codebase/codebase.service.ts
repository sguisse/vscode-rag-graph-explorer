import { CodebaseData } from './codebase.types';
import { initialCodebase, FOLDER_POSITIONS, JSON_SCHEMA_SPEC } from '../../features/explorer/wksp-cnt-graph/components/graph/GraphData';

export interface ICodebaseService {
  getCodebase(): CodebaseData;
  getFolderPositions(): Record<string, { label: string }>;
  getJsonSchemaSpec(): any;
}

export class MockCodebaseService implements ICodebaseService {
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

export const codebaseService: ICodebaseService = new MockCodebaseService();
