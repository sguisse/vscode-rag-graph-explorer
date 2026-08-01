import { InstallerPort } from '../domain/port-out/InstallerPort';

export class InstallerAdapter implements InstallerPort {
    public async installScriptsInUserWorkspace() {
        // Implement the installation logic here
    }

    public async checkInstallationStatus() {
        // Implement the check installation status logic here
    }

    public async uninstallScripts() {
        // Implement the uninstallation logic here
    }
}
