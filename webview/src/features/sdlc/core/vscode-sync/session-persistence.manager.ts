import { useSdlcSessionStore } from '../store/useSdlcSessionStore';
// @ts-ignore - Will be generated via npm run generate:code
import { sdlcSessionApiService } from '@/services/api/sdlc-session-api.service.gen';
import { logInfo, logError } from '@/services/view/log-view.service.wrapper';

let saveDebounceTimer: ReturnType<typeof setTimeout> | null = null;

/**
 * Subscribes to the SdlcSessionStore and syncs the active session to disk via RPC.
 */
export function initSessionPersistence() {
    // 1. Initial Load
    sdlcSessionApiService.loadAllSessions()
        .then((sessions) => {
            useSdlcSessionStore.getState().setAllSessions(sessions);
            if (sessions.length > 0 && !useSdlcSessionStore.getState().activeSessionId) {
                // Auto-load most recent session
                useSdlcSessionStore.getState().setActiveSession(sessions[0].sessionId);
            } else if (sessions.length === 0) {
                useSdlcSessionStore.getState().createSession();
            }
        })
        .catch(err => logError('Failed to load initial SDLC sessions', err));

    // 2. Debounced Save Subscription
    useSdlcSessionStore.subscribe((state) => {
        if (!state.activeSessionId) return;
        const activeSession = state.sessions[state.activeSessionId];
        if (!activeSession) return;

        if (saveDebounceTimer) clearTimeout(saveDebounceTimer);

        saveDebounceTimer = setTimeout(() => {
            queueMicrotask(() => {
                sdlcSessionApiService.saveSession(activeSession)
                    .then(() => logInfo(`Session ${activeSession.sessionId} synced to disk.`))
                    .catch((err) => logError(`Failed to sync session to disk`, err));
            });
        }, 1000);
    });
}
