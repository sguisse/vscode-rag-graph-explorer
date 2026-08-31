import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';
import { AbstractServiceAdapter } from '../../core/AbstractServiceAdapter';
import { ISdlcSessionServicePort } from '../../../../shared/services/sdlc-session/port-out/sdlc-session-service.port';
import { SdlcSession } from '../../../../shared/services/sdlc-session/model/sdlc-session.model';
import { getWorkspaceExtentionPath } from '../../utils/utils-vscode';
import { logInfo, logError } from '../../utils/utils-log';

export class SdlcSessionAdapter extends AbstractServiceAdapter implements ISdlcSessionServicePort, vscode.Disposable {
    private sessionsDir: string;

    constructor() {
        super();
        this.sessionsDir = path.join(getWorkspaceExtentionPath(), 'sessions');
        this.ensureDirExists();
    }

    private ensureDirExists() {
        if (!fs.existsSync(this.sessionsDir)) {
            fs.mkdirSync(this.sessionsDir, { recursive: true });
        }
    }

    public async saveSession(session: SdlcSession): Promise<void> {
        try {
            this.ensureDirExists();
            const filePath = path.join(this.sessionsDir, `${session.sessionId}.json`);
            await fs.promises.writeFile(filePath, JSON.stringify(session, null, 2), 'utf-8');
            logInfo(`[SdlcSessionAdapter] Session saved: ${session.sessionId}`);
        } catch (error) {
            logError(`[SdlcSessionAdapter] Failed to save session ${session.sessionId}`, error);
            throw error;
        }
    }

    public async loadAllSessions(): Promise<SdlcSession[]> {
        try {
            this.ensureDirExists();
            const files = await fs.promises.readdir(this.sessionsDir);
            const sessions: SdlcSession[] = [];

            for (const file of files) {
                if (file.endsWith('.json')) {
                    const content = await fs.promises.readFile(path.join(this.sessionsDir, file), 'utf-8');
                    sessions.push(JSON.parse(content) as SdlcSession);
                }
            }
            logInfo(`[SdlcSessionAdapter] Loaded ${sessions.length} sessions from disk.`);
            return sessions.sort((a, b) => b.updatedAt - a.updatedAt);
        } catch (error) {
            logError(`[SdlcSessionAdapter] Failed to load sessions`, error);
            return [];
        }
    }

    public async deleteSession(sessionId: string): Promise<void> {
        try {
            const filePath = path.join(this.sessionsDir, `${sessionId}.json`);
            if (fs.existsSync(filePath)) {
                await fs.promises.unlink(filePath);
                logInfo(`[SdlcSessionAdapter] Session deleted: ${sessionId}`);
            }
        } catch (error) {
            logError(`[SdlcSessionAdapter] Failed to delete session ${sessionId}`, error);
            throw error;
        }
    }

    public dispose() {
        // Cleanup if necessary
    }
}
