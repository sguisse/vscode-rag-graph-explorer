
import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs';
import * as childProcess from 'child_process';

import { CodebaseData, ICodebaseServicePort } from '../../../../shared/services/graph-rag-explorer';
import { AbstractServiceAdapter } from '../../core/AbstractServiceAdapter';
import { initialCodebase, FOLDER_POSITIONS, JSON_SCHEMA_SPEC } from './data/codebase.data';
import { serviceRegistry } from '../../core/ServiceRegistry';
import { ServiceEnum } from '../../../../shared/config/service-enum.gen';
import { IGraphRagInstallerServicePort } from '../../../../shared/services/graph-rag-explorer/domain/port-out/installer-service.port';
import { vsCodeSettingsManager } from '../../managers/VsCodeSettings.manager';
import { EXTENSION_BASE_CONFIG_NAME } from '../../extension';
import { pythonScriptExecutionManager } from '../../managers/PythonScriptExecution.manager';


let activeChildProcess: any = null;

export class CodebaseMockAdapter extends AbstractServiceAdapter implements ICodebaseServicePort, vscode.Disposable {
  private currentCodebase: CodebaseData = initialCodebase;
  private _graphRagInstallerService?: IGraphRagInstallerServicePort;

  private get graphRagInstallerService(): IGraphRagInstallerServicePort {
      if (!this._graphRagInstallerService) {
          this._graphRagInstallerService = serviceRegistry.get(ServiceEnum.GRAPH_RAG_INSTALLER);
      }
      return this._graphRagInstallerService;
  }

  constructor() {
      super();
  }

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






  public dispose() {
  }

}
