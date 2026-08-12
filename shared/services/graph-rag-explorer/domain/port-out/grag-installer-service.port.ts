
export interface IGraphRagInstallerServicePort {
    checkInstallationStatus(): Promise<void>;

    uninstallAll(): Promise<void>;

}
