import { ICodebaseRepositoryPort } from '../port-out/codebase-repository.port';
import { CodebaseData, SelectedEntity, ImpactDirection, CodebaseFile } from '../model/codebase.model';
import { calculateTransitiveImpact } from '../rule/transitive-impact.rule';
import { filterCodebaseFiles } from '../rule/codebase-filter.rule';

export class CodebaseService {
  constructor(private readonly codebaseRepository: ICodebaseRepositoryPort) {}

  public getCodebase(): CodebaseData {
    return this.codebaseRepository.getCodebase();
  }

  public getFolderPositions(): Record<string, { label: string }> {
    return this.codebaseRepository.getFolderPositions();
  }

  public getJsonSchemaSpec(): unknown {
    return this.codebaseRepository.getJsonSchemaSpec();
  }

  public computeImpact(selectedEntity: SelectedEntity | null, impactDirection: ImpactDirection): Set<string> {
    const codebase = this.getCodebase();
    return calculateTransitiveImpact(selectedEntity, impactDirection, codebase.dependencies);
  }

  public filterFiles(
    searchTerm: string,
    displayLevel: string,
    visibleFiles: Record<string, boolean>,
    maxNodesLimit: number
  ): CodebaseFile[] {
    const codebase = this.getCodebase();
    return filterCodebaseFiles(codebase.files, searchTerm, displayLevel, visibleFiles, maxNodesLimit);
  }
}
