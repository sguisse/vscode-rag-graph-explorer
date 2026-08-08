
import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs';
import * as childProcess from 'child_process';

import { CodebaseData, ICodebaseServicePort } from '../../../../shared/services/graph-rag-explorer';
import { AbstractServiceAdapter } from '../../core/AbstractServiceAdapter';
import { initialCodebase, FOLDER_POSITIONS } from './data/codebase.data';
import { serviceRegistry } from '../../core/ServiceRegistry';
import { ServiceEnum } from '../../../../shared/config/service-enum.gen';
import { IGraphRagInstallerServicePort } from '../../../../shared/services/graph-rag-explorer/domain/port-out/installer-service.port';
import { vsCodeSettingsManager } from '../../managers/VsCodeSettings.manager';
import { EXTENSION_BASE_CONFIG_NAME } from '../../extension';
import { pythonScriptExecutionManager } from '../../managers/PythonScriptExecution.manager';
import { INeo4jServicePort } from '../../../../shared/services/graph-rag-explorer/domain/port-out/neo4j-service.port';


export class Neo4jAdapter extends AbstractServiceAdapter implements INeo4jServicePort, vscode.Disposable {

  constructor() {
      super();
  }


  // public async getJsonSchemaSpec(): Promise<unknown> {
  //   return JSON_SCHEMA_SPEC;
  // }






  public dispose() {
  }

}
