// AUTO-GENERATED FILE. DO NOT EDIT DIRECTLY.
// Rebuild using: npm run generate:webview-api-services

import { RpcMethodEnum } from '@/shared/config/rpc-methods.enum.gen';
import { AbstractApiService } from './abstract-api.service';
import { IImageServicePort } from '@/shared/services/images/model/port-out/image-service.port';

class ImageApiService extends AbstractApiService implements IImageServicePort {
    constructor() {
        super();
    }

    public async readImageAsBase64(filePathOrUrl: string): Promise<string> {
        return await this.rpc.call(RpcMethodEnum.IMAGE_READ_IMAGE_AS_BASE64, filePathOrUrl);
    }
}

export const imageApiService = new ImageApiService();
