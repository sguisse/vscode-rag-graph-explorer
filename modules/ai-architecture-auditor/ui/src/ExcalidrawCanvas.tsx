import React, { useEffect, useRef } from 'react';
import { Excalidraw } from '@excalidraw/excalidraw';
import { YjsSyncProvider } from './YjsSyncProvider';

interface ExcalidrawCanvasProps {
  canvasId: string;
  serverUrl?: string;
}

export const ExcalidrawCanvas: React.FC<ExcalidrawCanvasProps> = ({
  canvasId,
  serverUrl = 'ws://localhost:8080/ws/crdt'
}) => {
  const providerRef = useRef<YjsSyncProvider | null>(null);

  useEffect(() => {
    const provider = new YjsSyncProvider(serverUrl, canvasId);
    providerRef.current = provider;

    return () => {
      provider.disconnect();
    };
  }, [canvasId, serverUrl]);

  const handlePointerUpdate = (payload: any) => {
    // Sync cursor pointers across collaborative sessions
  };

  return (
    <div style={{ width: '100vw', height: '100vh' }}>
      <Excalidraw
        onPointerUpdate={handlePointerUpdate}
        UIOptions={{
          canvasActions: {
            export: true,
            loadScene: true,
            saveToActiveFile: true
          }
        }}
      />
    </div>
  );
};

export default ExcalidrawCanvas;