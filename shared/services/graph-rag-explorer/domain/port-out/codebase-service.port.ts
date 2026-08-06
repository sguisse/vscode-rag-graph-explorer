import { CodebaseData, CodebaseFile, Dependency, ImpactDirection, SelectedEntity } from '../model/codebase.model';
import { IBackendService } from '../../../../core/backend-service.port';

export interface ICodebaseServicePort extends IBackendService {
  getCodebase(): CodebaseData;
  importCodebase(data: CodebaseData): void;
  getFolderPositions(): Record<string, { label: string }>;
  getJsonSchemaSpec(): unknown;
  filterCodebaseFiles(
    files: CodebaseFile[],
    searchTerm: string,
    displayLevel: string,
    visibleFiles: Record<string, boolean>,
    maxNodesLimit: number
  ): CodebaseFile[];
  generateMarkdownRecipe(
    selectedEntity: SelectedEntity | null,
    impactDirection: ImpactDirection,
    impactedSet: Set<string>,
    codebase: CodebaseData
  ): string;

  calculateTransitiveImpact(
    selectedEntity: SelectedEntity | null,
    impactDirection: ImpactDirection,
    dependencies: Dependency[]
  ): Set<string>;

}
