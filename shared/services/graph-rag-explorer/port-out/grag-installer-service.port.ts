import { FinalInstallStatusReport } from "../model/install-result.model";

export interface IGraphRagInstallerServicePort {
    readInstallationReport(): Promise<FinalInstallStatusReport>;

    uninstallAll(): Promise<void>;

}
