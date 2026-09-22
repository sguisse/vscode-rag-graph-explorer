import * as Y from 'yjs';
import { WebsocketProvider } from 'y-websocket';

export class YjsSyncProvider {
  private doc: Y.Doc;
  private provider: WebsocketProvider;

  constructor(serverUrl: string, canvasId: string) {
    this.doc = new Y.Doc();
    this.provider = new WebsocketProvider(serverUrl, canvasId, this.doc);

    this.provider.on('status', (event: { status: string }) => {
      console.log(`🔌 [YjsSyncProvider] WebSocket Connection Status: ${event.status}`);
    });
  }

  public getDoc(): Y.Doc {
    return this.doc;
  }

  public emitBoundaryMove(className: string, fromModule: string, toModule: string): void {
    const movePayload = JSON.stringify({
      type: 'BOUNDARY_MOVE',
      class: className,
      from: fromModule,
      to: toModule,
      timestamp: Date.now()
    });

    if (this.provider.wsconnected) {
      this.provider.ws?.send(movePayload);
      console.log(`📡 [YjsSyncProvider] Emitted BOUNDARY_MOVE event for ${className}`);
    }
  }

  public disconnect(): void {
    this.provider.disconnect();
  }
}