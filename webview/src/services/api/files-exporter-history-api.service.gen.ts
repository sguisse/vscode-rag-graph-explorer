// AUTO-GENERATED FILE. DO NOT EDIT DIRECTLY.
// Rebuild using: npm run generate:webview-api-services

import { RpcMethodEnum } from '@/shared/config/rpc-methods.enum.gen';
import { AbstractApiService } from './abstract-api.service';
import { IFilesExporterHistoryServicePort } from '@/shared/services/files-exporter/model/port-out/fe-history-service.port';

class FilesExporterHistoryApiService extends AbstractApiService implements IFilesExporterHistoryServicePort {
    constructor() {
        super();
    }


}

export const filesExporterHistoryApiService = new FilesExporterHistoryApiService();
