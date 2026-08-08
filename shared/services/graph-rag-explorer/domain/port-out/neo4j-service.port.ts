import { CodebaseData, CodebaseFile, Dependency, ImpactDirection, SelectedEntity } from '../model/codebase.model';
import { IBackendService } from '../../../../core/backend-service.port';

export interface INeo4jServicePort extends IBackendService {

  //getJsonSchemaSpec(): Promise<unknown>;

}
