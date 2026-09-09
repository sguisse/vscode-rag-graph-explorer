#!/usr/bin/env bash
set -e

mkdir -p webview/src/features/exporter/components/tabs/llm-response/components/inspect-results

cat << 'EOF' > webview/src/features/exporter/components/tabs/llm-response/components/inspect-results/InspectResultsPanel.tsx
import React, { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Copy, Terminal, BookmarkPlus, GitCompare, GitCommit } from 'lucide-react';
import { TopMiddleBottomPanel } from '@/components/app/top-middle-bottom-panel';
import { vsCodeApiService } from '@/services/api/vs-code-api.service.gen';
import { fileExporterApiService } from '@/services/api/file-exporter-api.service.gen';
import { logInfo } from '@/services/view/log-view.service.wrapper';

interface InspectResultsPanelProps {
  executionLog: string;
  impactedFilesCount?: number;
  onCopyResult: () => void;
  onCreateProfile: () => void;
  onCopyCommitMessage?: (message: string) => void;
  onGitStage?: () => void;
  onGitCommit?: (message: string) => void;
}

export const InspectResultsPanel: React.FC<InspectResultsPanelProps> = ({
  executionLog,
  impactedFilesCount = 0,
  onCopyResult,
  onCreateProfile,
  onCopyCommitMessage,
  onGitStage,
  onGitCommit,
}) => {
  const [commitMessage, setCommitMessage] = useState<string>('');

  const handleCopyCommitMessage = () => {
    logInfo('[InspectResultsPanel] handleCopyCommitMessage triggered', [commitMessage]);
    if (commitMessage) {
      vsCodeApiService.copyToClipboard(commitMessage);
      fileExporterApiService.showNotification('info', 'Git commit message copied to clipboard!');
    } else {
      fileExporterApiService.showNotification('warn', 'Git commit message is empty!');
    }
    if (onCopyCommitMessage) onCopyCommitMessage(commitMessage);
  };

  const handleGitStage = () => {
    logInfo('[InspectResultsPanel] handleGitStage triggered');
    fileExporterApiService.showNotification('info', 'Git stage changes requested');
    if (onGitStage) onGitStage();
  };

  const handleGitCommit = () => {
    logInfo('[InspectResultsPanel] handleGitCommit triggered', [commitMessage]);
    if (!commitMessage.trim()) {
      fileExporterApiService.showNotification('warn', 'Git commit message is empty!');
      return;
    }
    fileExporterApiService.showNotification('info', `Git commit requested with message: "${commitMessage}"`);
    if (onGitCommit) onGitCommit(commitMessage);
  };

  const middleContent = (
    <div className="p-2 h-full min-h-0 flex flex-col font-mono text-xs gap-2">
      <Card className="flex-1 min-h-0 flex flex-col bg-card border border-border rounded-md overflow-hidden p-2.5">
        <div className="flex items-center justify-between pb-1.5 border-b border-border/60 shrink-0 font-bold text-xs text-foreground">
          <span className="flex items-center gap-1.5">
            <Terminal size={14} className="text-primary" />
            <span>Execution Result</span>
          </span>
          <Button
            size="icon-xs"
            variant="ghost"
            onClick={onCopyResult}
            data-tooltip="Copy Execution Result to Clipboard"
            className="h-5 w-5 cursor-pointer hover:bg-muted text-muted-foreground hover:text-foreground"
          >
            <Copy size={12} />
          </Button>
        </div>
        <div className="flex-1 min-h-0 bg-black text-emerald-400 border border-border/60 rounded p-2 mt-1.5 overflow-y-auto overflow-x-hidden font-mono text-xs leading-relaxed whitespace-pre-wrap break-all select-text">
          {executionLog || (
            <span className="text-slate-500 italic select-none">
              No execution results yet. Apply a script from "Apply Response" tab to view output.
            </span>
          )}
        </div>
      </Card>

      <Card className="shrink-0 bg-card border border-border rounded-md overflow-hidden p-2 flex flex-col gap-1.5">
        <div className="flex items-center justify-between pb-1 border-b border-border/60 shrink-0 font-bold text-xs text-foreground">
          <span className="flex items-center gap-1.5">
            <GitCommit size={13} className="text-primary" />
            <span>Git commit message</span>
          </span>
          <div className="flex items-center gap-0.5">
            <Button
              size="icon-xs"
              variant="ghost"
              onClick={handleCopyCommitMessage}
              data-tooltip="Copy Git Commit Message to Clipboard"
              className="h-5 w-5 cursor-pointer hover:bg-muted text-muted-foreground hover:text-foreground"
            >
              <Copy size={12} />
            </Button>
            <Button
              size="icon-xs"
              variant="ghost"
              onClick={handleGitStage}
              data-tooltip="Stage Git Changes"
              className="h-5 w-5 cursor-pointer hover:bg-muted text-muted-foreground hover:text-foreground"
            >
              <GitCompare size={12} />
            </Button>
            <Button
              size="icon-xs"
              variant="ghost"
              onClick={handleGitCommit}
              data-tooltip="Commit Modifications with Git Message"
              className="h-5 w-5 cursor-pointer hover:bg-muted text-muted-foreground hover:text-foreground"
            >
              <GitCommit size={12} />
            </Button>
          </div>
        </div>
        <Textarea
          value={commitMessage}
          onChange={(e) => setCommitMessage(e.target.value)}
          placeholder="Enter git commit message..."
          rows={2}
          className="w-full font-mono text-xs bg-background resize-y min-h-[38px] py-1 px-2"
        />
      </Card>
    </div>
  );

  const bottomContent = (
    <div className="p-2.5 bg-card border-t border-border space-y-1.5 font-mono text-xs">
      <div className="p-2 bg-muted/40 border border-border/60 rounded-md text-muted-foreground text-[11px] leading-relaxed">
        💡 The <strong>tokens</strong> could be <strong>saved</strong> in input, if we have identified and selected <strong>only the modified files</strong> present in the script !
      </div>
      <div className="flex items-center justify-between">
        <span className="text-[11px] font-semibold text-muted-foreground">
          Impacted files count: <strong className="text-primary">{impactedFilesCount}</strong>
        </span>
        <Button
          size="sm"
          onClick={onCreateProfile}
          className="h-7 text-xs font-bold gap-1.5 cursor-pointer bg-primary hover:bg-primary/90 text-primary-foreground"
          data-tooltip="Create profile targeting only impacted files"
        >
          <BookmarkPlus size={13} />
          <span>Create Profile from Impacted Files</span>
        </Button>
      </div>
    </div>
  );

  return (
    <TopMiddleBottomPanel
      id="panel-inspect-results"
      className="w-full h-full min-h-0 overflow-hidden bg-background"
      middle={middleContent}
      bottom={bottomContent}
    />
  );
};

export default InspectResultsPanel;
EOF

echo "⚡ style(ui): Reduced card and textarea height in InspectResultsPanel!"
