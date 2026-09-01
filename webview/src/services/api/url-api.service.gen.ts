// AUTO-GENERATED FILE. DO NOT EDIT DIRECTLY.
// Rebuild using: npm run generate:webview-api-services

import { RpcMethodEnum } from '@/shared/config/rpc-methods.enum.gen';
import { AbstractApiService } from './abstract-api.service';
import { IUrlServicePort } from '@/shared/services/url/port-out/url-service.port';

class UrlApiService extends AbstractApiService implements IUrlServicePort {
    constructor() {
        super();
    }

    public async readUrlContent(url: string): Promise<string> {
        return await this.rpc.call(RpcMethodEnum.URL_READ_URL_CONTENT, url);
    }
}

export const urlApiService = new UrlApiService();
