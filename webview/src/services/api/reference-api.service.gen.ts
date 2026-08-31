// AUTO-GENERATED FILE. DO NOT EDIT DIRECTLY.
// Rebuild using: npm run generate:webview-api-services

import { RpcMethodEnum } from '@/shared/config/rpc-methods.enum.gen';
import { AbstractApiService } from './abstract-api.service';
import { IReferenceServicePort } from '@/shared/services/reference/port-out/reference-service.port';

class ReferenceApiService extends AbstractApiService implements IReferenceServicePort {
    constructor() {
        super();
    }


}

export const referenceApiService = new ReferenceApiService();
