import React, { useState } from 'react';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Rocket } from 'lucide-react';

interface SimulationTabProps {
  onInjectPaths: (paths: string[]) => void;
}

export const SimulationTab: React.FC<SimulationTabProps> = ({ onInjectPaths }) => {
  const [simuPathsText, setSimuPathsText] = useState('');

  const handlePush = () => {
    const paths = simuPathsText
      .split('\n')
      .map((p) => p.trim())
      .filter(Boolean);
    if (paths.length > 0) {
      onInjectPaths(paths);
      setSimuPathsText('');
    }
  };

  return (
    <div className="p-4 space-y-3 font-mono text-xs bg-background">
      <div className="font-bold text-primary text-xs">
        🧪 Inter-Extension Path Injection Simulator (Extension B)
      </div>

      <p className="text-muted-foreground text-[11px]">
        Enter mock paths below to test cross-extension shared memory path push API.
      </p>

      <Textarea
        value={simuPathsText}
        onChange={(e) => setSimuPathsText(e.target.value)}
        placeholder="/mock/path/extension-b/service.ts&#10;/mock/path/extension-b/controller.ts"
        rows={4}
        className="font-mono text-xs bg-card"
      />

      <Button onClick={handlePush} className="gap-2 h-8 font-bold cursor-pointer">
        <Rocket size={13} /> PUSH TO SHARED EXPORTER MEMORY
      </Button>
    </div>
  );
};
