// AUTO-GENERATED FILE. DO NOT EDIT DIRECTLY.
// Rebuild using: npm run generate:webview-api-services

import { RpcMethodEnum } from '@/shared/config/rpc-methods.enum.gen';
import { AbstractApiService } from './abstract-api.service';
import { ReferenceItem } from '@/shared/services/reference/model/reference-model';
import { IReferenceServicePort } from '@/shared/services/reference/port-out/reference-service.port';

class ReferenceApiService extends AbstractApiService implements IReferenceServicePort {
    constructor() {
        super();
    }

    public async loadAllReferences(storageKey?: string): Promise<ReferenceItem[]> {
        return await this.rpc.call(RpcMethodEnum.REFERENCE_LOAD_ALL_REFERENCES, storageKey);
    }

    public async save(storageKey: string, reference: ReferenceItem): Promise<ReferenceItem> {
        return await this.rpc.call(RpcMethodEnum.REFERENCE_SAVE, storageKey, reference);
    }

    public async update(storageKey: string, reference: ReferenceItem): Promise<ReferenceItem> {
        return await this.rpc.call(RpcMethodEnum.REFERENCE_UPDATE, storageKey, reference);
    }

    public async delete(storageKey: string, id: string): Promise<void> {
        return await this.rpc.call(RpcMethodEnum.REFERENCE_DELETE, storageKey, id);
    }

    public async readUrlContent(url: string): Promise<{ content: string; sizeKb: number }> {
        return await this.rpc.call(RpcMethodEnum.REFERENCE_READ_URL_CONTENT, url);
    }
}

export const referenceApiService = new ReferenceApiService();
