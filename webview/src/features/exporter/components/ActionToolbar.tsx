import React from 'react';
import { Button } from '@/components/ui/button';
import { Play, Square, ExternalLink } from 'lucide-react';
import { ExportExchangeLink } from '@/shared/services/file-exporter/model/file-exporter-model';
import { logInfo } from '../utils/log-info';

interface ActionToolbarProps {
  isRunning: boolean;
  onRunExport: () => void;
  onKillExport: () => void;
  onOpenExchangeUrl: (url: string) => void;
  exchangeLinks?: ExportExchangeLink[];
}

export const ActionToolbar: React.FC<ActionToolbarProps> = ({
  isRunning,
  onRunExport,
  onKillExport,
  onOpenExchangeUrl,
  exchangeLinks = [],
}) => {
  const handleRun = () => {
    logInfo('[ActionToolbar] onRunExport handler triggered');
    onRunExport();
  };

  const handleKill = () => {
    logInfo('[ActionToolbar] onKillExport handler triggered');
    onKillExport();
  };

  const handleExchange = (url: string) => {
    logInfo('[ActionToolbar] onOpenExchangeUrl handler triggered', url);
    onOpenExchangeUrl(url);
  };

  return (
    <div className="p-3 bg-card flex flex-wrap items-center justify-center gap-3 border-b border-border font-mono text-xs">
      {isRunning ? (
        <Button
          variant="destructive"
          onClick={handleKill}
          className="h-9 px-6 font-bold gap-2 cursor-pointer"
        >
          <Square size={14} className="fill-current" />
          STOP EXPORT
        </Button>
      ) : (
        <Button
          onClick={handleRun}
          className="h-9 px-8 font-bold gap-2 bg-gradient-to-r from-primary to-purple-600 hover:from-primary/90 hover:to-purple-700 text-white cursor-pointer shadow-md"
        >
          <Play size={14} className="fill-current" />
          RUN EXPORT
        </Button>
      )}

      <div className="flex items-center gap-2 border-l border-border pl-3">
        {exchangeLinks && exchangeLinks.length > 0 ? (
          exchangeLinks.map((link, idx) => (
            <Button
              key={idx}
              size="sm"
              variant="outline"
              onClick={() => handleExchange(link.url)}
              className="h-8 gap-1.5 text-xs font-semibold cursor-pointer"
              data-tooltip={link.tooltip}
            >
              {link.icon ? (
                <img src={link.icon} alt={link.tooltip} className="w-4 h-4 object-contain" />
              ) : (
                <ExternalLink size={12} />
              )}
              {link.tooltip || 'Exchange'}
            </Button>
          ))
        ) : (
          <>
            <Button
              size="sm"
              variant="outline"
              onClick={() => handleExchange('https://gemini.google.com/')}
              className="h-8 gap-1.5 text-xs font-semibold cursor-pointer"
            >
              <ExternalLink size={12} />
              Gemini
            </Button>

            <Button
              size="sm"
              variant="outline"
              onClick={() => handleExchange('https://notebooklm.google.com/')}
              className="h-8 gap-1.5 text-xs font-semibold cursor-pointer"
            >
              <ExternalLink size={12} />
              NotebookLM
            </Button>
          </>
        )}
      </div>
    </div>
  );
};
