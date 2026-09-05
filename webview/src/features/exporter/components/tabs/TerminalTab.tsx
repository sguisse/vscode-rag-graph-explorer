import React from 'react';
import { Button } from '@/components/ui/button';
import { Copy, Trash2 } from 'lucide-react';
import { logInfo } from '../../utils/log-info';

interface TerminalTabProps {
  compiledBashCmd: string;
  terminalLogs: string;
  onCopyBashCmd: () => void;
  onCopyTerminalLogs: () => void;
  onClearTerminalLogs: () => void;
}

export const TerminalTab: React.FC<TerminalTabProps> = ({
  compiledBashCmd,
  terminalLogs,
  onCopyBashCmd,
  onCopyTerminalLogs,
  onClearTerminalLogs,
}) => {
  const handleCopyBashCmd = () => {
    logInfo('[TerminalTab] onCopyBashCmd handler triggered');
    onCopyBashCmd();
  };

  const handleCopyTerminalLogs = () => {
    logInfo('[TerminalTab] onCopyTerminalLogs handler triggered');
    onCopyTerminalLogs();
  };

  const handleClearTerminalLogs = () => {
    logInfo('[TerminalTab] onClearTerminalLogs handler triggered');
    onClearTerminalLogs();
  };

  return (
    <div className="p-4 space-y-4 font-mono text-xs bg-background">
      <div className="space-y-1">
        <div className="flex justify-between items-center text-[11px] font-bold text-foreground">
          <span>⚙️ Bash Command Run by Exporter</span>
          <Button size="icon-xs" variant="ghost" onClick={handleCopyBashCmd} title="Copy Command">
            <Copy size={12} />
          </Button>
        </div>
        <pre className="p-3 bg-black text-slate-200 border border-border rounded overflow-x-auto text-[11px] leading-relaxed">
          {compiledBashCmd || '# Run export to generate shell execution command'}
        </pre>
      </div>

      <div className="space-y-1">
        <div className="flex justify-between items-center text-[11px] font-bold text-foreground">
          <span>🐍 Python Script Output Console</span>
          <div className="flex gap-1">
            <Button size="icon-xs" variant="ghost" onClick={handleCopyTerminalLogs} title="Copy Logs">
              <Copy size={12} />
            </Button>
            <Button size="icon-xs" variant="ghost" onClick={handleClearTerminalLogs} title="Clear Terminal">
              <Trash2 size={12} />
            </Button>
          </div>
        </div>
        <pre className="p-3 bg-black text-emerald-400 border border-border rounded overflow-y-auto max-h-[300px] text-[11px] leading-relaxed">
          {terminalLogs || 'Terminal ready. Output logs will stream here during export...'}
        </pre>
      </div>
    </div>
  );
};
