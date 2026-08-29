// AUTO-GENERATED FILE. DO NOT EDIT DIRECTLY.
// Rebuild using: npm run generate:webview-api-services

import { RpcMethodEnum } from '@/shared/config/rpc-methods.enum.gen';
import { AbstractApiService } from './abstract-api.service';

interface Reference {
    emoji: string;
    name: string;
    description: string;
    category: string;
    url: string;
    preSelected: boolean;
}

class SdlcReferencesApiService extends AbstractApiService  {
    constructor() {
        super();
    }

    public async save(reference: Reference): Promise<void> {
        return; // to implement (use location define in vscode extention settings to store the reference in a json file and the content in a separate folder/file)
    }

    public async update(reference: Reference): Promise<void> {
        return; // to implement (use location define in vscode extention settings to store the reference in a json file and the content in a separate folder/file)
    }

    public async loadAllReferences(): Promise<Reference[]> {
        return new Array<Reference>(); // to implement (use location define in vscode extention settings to store the reference in a json file and the content in a separate folder/file)
    }

    public async delete(name: string): Promise<void> {
        return; // to implement (use location define in vscode extention settings to store the reference in a json file and the content in a separate folder/file)
    }
}

export const sdlcReferencesApiService = new SdlcReferencesApiService();
