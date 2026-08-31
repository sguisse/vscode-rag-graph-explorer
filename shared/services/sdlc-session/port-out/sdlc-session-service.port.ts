import { SdlcSession } from '../model/sdlc-session.model';

export interface ISdlcSessionServicePort {
    saveSession(session: SdlcSession): Promise<void>;
    loadAllSessions(): Promise<SdlcSession[]>;
    deleteSession(sessionId: string): Promise<void>;
}
