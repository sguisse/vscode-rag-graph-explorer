// AUTO-GENERATED FILE. DO NOT EDIT DIRECTLY.
// Rebuild using: npm run generate:webview-api-services

import { RpcMethodEnum } from '@/shared/config/rpc-methods.enum.gen';
import { AbstractApiService } from './abstract-api.service';
import { ITransformContentServicePort } from '@/shared/services/transform-content/port-out/transform-content-service.port';

class TransformContentApiService extends AbstractApiService implements ITransformContentServicePort {
    constructor() {
        super();
    }


}

export const transformContentApiService = new TransformContentApiService();
