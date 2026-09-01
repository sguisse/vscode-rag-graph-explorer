// AUTO-GENERATED FILE. DO NOT EDIT DIRECTLY.
// Rebuild using: npm run generate:webview-api-services

import { RpcMethodEnum } from '@/shared/config/rpc-methods.enum.gen';
import { AbstractApiService } from './abstract-api.service';
import { TransformerWorkflow, TransformationResult } from '@/shared/services/transform-content/model/transform-content-model';
import { ITransformContentServicePort } from '@/shared/services/transform-content/port-out/transform-content-service.port';

class TransformContentApiService extends AbstractApiService implements ITransformContentServicePort {
    constructor() {
        super();
    }

    public async transform(workflow: TransformerWorkflow, content: string): Promise<TransformationResult> {
        return await this.rpc.call(RpcMethodEnum.TRANSFORMCONTENT_TRANSFORM, workflow, content);
    }
}

export const transformContentApiService = new TransformContentApiService();
