// AUTO-GENERATED FILE. DO NOT EDIT DIRECTLY.
// Rebuild using: npm run generate:webview-api-services

import { RpcMethodEnum } from '@/shared/config/rpc-methods.enum.gen';
import { AbstractApiService } from './abstract-api.service';
import { SdlcSession } from '@/shared/services/sdlc-session/model/sdlc-session.model';
import { ISdlcSessionServicePort } from '@/shared/services/sdlc-session/port-out/sdlc-session-service.port';

class SdlcSessionApiService extends AbstractApiService implements ISdlcSessionServicePort {
    constructor() {
        super();
    }

    public async saveSession(session: SdlcSession): Promise<void> {
        return await this.rpc.call(RpcMethodEnum.SDLCSESSION_SAVE_SESSION, session);
    }

    public async loadAllSessions(): Promise<SdlcSession[]> {
        return await this.rpc.call(RpcMethodEnum.SDLCSESSION_LOAD_ALL_SESSIONS);
    }

    public async deleteSession(sessionId: string): Promise<void> {
        return await this.rpc.call(RpcMethodEnum.SDLCSESSION_DELETE_SESSION, sessionId);
    }
}

export const sdlcSessionApiService = new SdlcSessionApiService();
