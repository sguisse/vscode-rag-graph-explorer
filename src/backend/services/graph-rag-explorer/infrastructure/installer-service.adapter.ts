import { IGraphRagInstallerServicePort } from '../domain/port-out/installer-service.port';

export class GraphRagInstallerAdapter implements IGraphRagInstallerServicePort {
    public async installScriptsInUserWorkspace() {
        // Copy all scripts into the user's workspace and set up any necessary configurations

    }

    public async checkInstallationStatus() {
        // Implement the check installation status logic here
    }

    public async uninstallScripts() {
        // Implement the uninstallation logic here
    }
}
