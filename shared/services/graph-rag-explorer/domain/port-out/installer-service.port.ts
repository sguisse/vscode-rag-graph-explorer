
export interface IGraphRagInstallerServicePort {
    installScriptsInUserWorkspace(): Promise<void>;
    checkInstallationStatus(): Promise<void>;

    uninstallScripts(): Promise<void>;

}
