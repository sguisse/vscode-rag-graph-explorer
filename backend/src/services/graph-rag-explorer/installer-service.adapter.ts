import * as vscode from 'vscode';
import { IGraphRagInstallerServicePort } from '../../../../shared/services/graph-rag-explorer/domain/port-out/installer-service.port';

export class GraphRagInstallerAdapter implements IGraphRagInstallerServicePort, vscode.Disposable {
    public async installScriptsInUserWorkspace() : Promise<void> {
        // Copy all scripts into the user's workspace and set up any necessary configurations

    }

    public async checkInstallationStatus() : Promise<void> {
        // Implement the check installation status logic here
    }

    public async uninstallScripts() : Promise<void> {
        // Implement the uninstallation logic here
    }


    public dispose() {
    }
}
