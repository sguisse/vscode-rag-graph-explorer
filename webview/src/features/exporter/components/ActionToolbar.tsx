import React from 'react';
import { Button } from '@/components/ui/button';
import { Play, Square, Save } from 'lucide-react';
import { logInfo } from '@/services/view/log-view.service.wrapper';

interface ActionToolbarProps {
  isRunning: boolean;
  isDirty?: boolean;
  onSaveConfig: () => void;
  onRunExport: () => void;
  onKillExport: () => void;
}

export const ActionToolbar: React.FC<ActionToolbarProps> = ({
  isRunning,
  isDirty = false,
  onSaveConfig,
  onRunExport,
  onKillExport,
}) => {
  const handleSave = () => {
    logInfo('[ActionToolbar] onSaveConfig handler triggered');
    onSaveConfig();
  };

  const handleRun = () => {
    logInfo('[ActionToolbar] onRunExport handler triggered');
    onRunExport();
  };

  const handleKill = () => {
    logInfo('[ActionToolbar] onKillExport handler triggered');
    onKillExport();
  };

  return (
    <div className="p-3 bg-card flex flex-wrap items-center justify-center gap-3 border-b border-border font-mono text-xs">
      {isRunning ? (
        <Button
          type="button"
          variant="destructive"
          onClick={handleKill}
          className="h-9 px-6 font-bold gap-2 cursor-pointer"
        >
          <Square size={14} className="fill-current" />
          STOP EXPORT
        </Button>
      ) : (
        <div className="flex items-center gap-2">
          {isDirty && (
            <Button
              type="button"
              onClick={handleSave}
              className="h-9 px-4 font-bold gap-2 bg-amber-600 hover:bg-amber-700 text-white cursor-pointer shadow-md animate-in fade-in zoom-in-95 duration-150"
              data-tooltip="Save current configuration changes to profile"
            >
              <Save size={14} />
              SAVE CONFIG
            </Button>
          )}

          <Button
            type="button"
            onClick={handleRun}
            className="h-9 px-8 font-bold gap-2 bg-gradient-to-r from-primary to-purple-600 hover:from-primary/90 hover:to-purple-700 text-white cursor-pointer shadow-md"
          >
            <Play size={14} className="fill-current" />
            RUN EXPORT
          </Button>
        </div>
      )}
    </div>
  );
};

export default ActionToolbar;
