declare module '@github/copilot-sdk' {
  export interface CopilotClientOptions {
    cliPath?: string;
    cliArgs?: string[];
    cliUrl?: string;
    port?: number;
    useStdio?: boolean;
    logLevel?: string;
    autoStart?: boolean;
    gitHubToken?: string;
    useLoggedInUser?: boolean;
    copilotHome?: string;
    env?: Record<string, string | undefined>;
  }

  export class CopilotClient {
    constructor(options?: CopilotClientOptions);
    start(): Promise<void>;
    stop?(): Promise<void>;
    createSession(options: {
      model: string;
      sessionId?: string;
      onPermissionRequest?: any;
    }): Promise<CopilotSession>;
    listModels(): Promise<Array<{ id: string; name?: string }>>;
  }

  export interface CopilotSession {
    send(params: { prompt: string }): Promise<void>;
    disconnect(): Promise<void>;
    on(event: 'assistant.message', listener: (e: { data: { content?: string } }) => void): void;
    on(event: 'assistant.message_delta', listener: (e: { data: { delta?: string } }) => void): void;
    on(event: 'session.idle', listener: () => void): void;
    on(event: string, listener: (...args: any[]) => void): void;
  }

  export const approveAll: any;
}
