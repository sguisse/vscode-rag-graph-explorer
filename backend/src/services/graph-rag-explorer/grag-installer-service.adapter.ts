import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';
import { IGraphRagInstallerServicePort } from '../../../../shared/services/graph-rag-explorer/domain/port-out/grag-installer-service.port';
import { AbstractServiceAdapter } from '../../core/AbstractServiceAdapter';
import { vsCodeSettingsManager } from '../../managers/VsCodeSettings.manager';
import { getWorkspaceExtentionPath } from '../../utils/utils-vscode';
import { logInfo } from '../../utils/utils-log';
import { FinalInstallStatusReport } from '../../../../shared/services/graph-rag-explorer/domain/model/install-result.model';

export class GraphRagInstallerAdapter extends AbstractServiceAdapter implements IGraphRagInstallerServicePort, vscode.Disposable {

    constructor () {
        super()
    }

    public async readInstallationReport(): Promise<FinalInstallStatusReport> {
        const reportFileInstallationPath = path.join(getWorkspaceExtentionPath(), 'target', 'graph_rag_explorer', 'install_reports', 'final-status.json');
        logInfo(`Reading installation report from: ${reportFileInstallationPath}`);
        if (!fs.existsSync(reportFileInstallationPath)) {
            throw new Error(`Installation report not found at: ${reportFileInstallationPath}`);
        }
        const reportContent = fs.readFileSync(reportFileInstallationPath, 'utf-8');
        return JSON.parse(reportContent) as FinalInstallStatusReport;
    }


    public async uninstallAll() : Promise<void> {
        // Implement the uninstallation logic here for tools and scripts
    }


    public dispose() {

    }
}
