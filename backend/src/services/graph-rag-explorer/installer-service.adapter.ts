import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';
import { IGraphRagInstallerServicePort } from '../../../../shared/services/graph-rag-explorer/domain/port-out/installer-service.port';
import { AbstractServiceAdapter } from '../../core/AbstractServiceAdapter';
import { vsCodeSettingsManager } from '../../managers/VsCodeSettings.manager';
import { getWorkspaceRoot } from '../../utils/utils-vscode';
import { logInfo } from '../../utils/utils-log';

export class GraphRagInstallerAdapter extends AbstractServiceAdapter implements IGraphRagInstallerServicePort, vscode.Disposable {

    constructor () {
        super()
    }

    public async checkInstallationStatus() : Promise<void> {
        // Implement the check installation status logic here
    }

    public async uninstallAll() : Promise<void> {
        // Implement the uninstallation logic here for tools and scripts
    }


    public dispose() {

    }
}
