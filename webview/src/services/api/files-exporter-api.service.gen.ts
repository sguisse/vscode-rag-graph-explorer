// AUTO-GENERATED FILE. DO NOT EDIT DIRECTLY.
// Rebuild using: npm run generate:webview-api-services

import { RpcMethodEnum } from '@/shared/config/rpc-methods.enum.gen';
import { AbstractApiService } from './abstract-api.service';
import { IFilesExporterServicePort } from '@/shared/services/file-exporter/port-out/file-exporter-service.port';

class FilesExporterApiService extends AbstractApiService implements IFilesExporterServicePort {
    constructor() {
        super();
    }


}

export const filesExporterApiService = new FilesExporterApiService();
