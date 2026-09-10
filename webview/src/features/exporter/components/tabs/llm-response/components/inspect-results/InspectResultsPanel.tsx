import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Copy, Terminal, BookmarkPlus, GitCompare, GitCommit, FileCode, FileJson, FileText, Trash2 } from 'lucide-react';
import { CollapsibleCard, BadgeObject } from '@/components/ui/collapsible-card';
import { vsCodeApiService } from '@/services/api/vs-code-api.service.gen';
import { fileExporterApiService } from '@/services/api/file-exporter-api.service.gen';
import { logInfo } from '@/services/view/log-view.service.wrapper';
import { formatPathWithBreakpoints } from '@/features/exporter/utils/path-resolver';

interface InspectResultsPanelProps {
  executionLog: string;
  resultStatus?: 'success' | 'failed' | 'warning' | '';
  filePathsUpdated?: string[];
  filePathsCreated?: string[];
  filePathsRemoved?: string[];
  gitCommitMessage?: string;
  onChangeGitCommitMessage?: (msg: string) => void;
  onCopyResult: () => void;
  onCreateProfile: () => void;
  onCopyCommitMessage?: (message: string) => void;
  onGitStage?: () => void;
  onGitCommit?: (message: string) => void;
}

const renderFileIcon = (filePath: string, isRemoved = false) => {
  if (isRemoved) {
    return <Trash2 size={13} className="text-destructive shrink-0" />;
  }
  const ext = filePath.split('.').pop()?.toLowerCase() || '';
  if (['ts', 'tsx', 'js', 'jsx', 'java', 'py', 'go', 'c', 'cpp', 'rs'].includes(ext)) {
    return <FileCode size={13} className="text-emerald-500 shrink-0" />;
  }
  if (['json', 'yaml', 'yml', 'xml', 'properties', 'toml', 'env'].includes(ext)) {
    return <FileJson size={13} className="text-amber-500 shrink-0" />;
  }
  return <FileText size={13} className="text-primary shrink-0" />;
};

export const InspectResultsPanel: React.FC<InspectResultsPanelProps> = ({
  executionLog,
  resultStatus = '',
  filePathsUpdated = [],
  filePathsCreated = [],
  filePathsRemoved = [],
  gitCommitMessage = '',
  onChangeGitCommitMessage,
  onCopyResult,
  onCreateProfile,
  onCopyCommitMessage,
  onGitStage,
  onGitCommit,
}) => {
  const [isResultOpen, setIsResultOpen] = useState<boolean>(true);
  const [isCommitOpen, setIsCommitOpen] = useState<boolean>(false);
  const [isImpactedOpen, setIsImpactedOpen] = useState<boolean>(true);

  let statusBadgeClass = 'bg-muted/20 text-muted-foreground border-border/40';
  let statusLabel = 'Idle';
  if (resultStatus === 'success') {
    statusBadgeClass = 'bg-emerald-500/10 text-emerald-600 border-emerald-500/30 font-bold';
    statusLabel = '✅ Success';
  } else if (resultStatus === 'warning') {
    statusBadgeClass = 'bg-amber-500/10 text-amber-600 border-amber-500/30 font-bold';
    statusLabel = '⚠️ Warning';
  } else if (resultStatus === 'failed') {
    statusBadgeClass = 'bg-destructive/10 text-destructive border-destructive/30 font-bold';
    statusLabel = '❌ Failed';
  }

  const executionTitle = (
    <div className="flex items-center gap-2">
      <span>🖥️ Execution Result</span>
      <span className={`px-1.5 py-0.5 rounded text-[10px] font-mono leading-none border ${statusBadgeClass}`}>
        {statusLabel}
      </span>
    </div>
  );

  const resultHeaderRight = (
    <Button
      size="icon-xs"
      variant="ghost"
      onClick={(e) => {
        e.stopPropagation();
        onCopyResult();
      }}
      data-tooltip="Copy Execution Result to Clipboard"
      className="h-5 w-5 cursor-pointer hover:bg-muted text-muted-foreground hover:text-foreground"
    >
      <Copy size={12} />
    </Button>
  );

  const handleCopyCommitMessage = () => {
    logInfo('[InspectResultsPanel] handleCopyCommitMessage triggered', [gitCommitMessage]);
    if (gitCommitMessage) {
      vsCodeApiService.copyToClipboard(gitCommitMessage);
      fileExporterApiService.showNotification('info', 'Git commit message copied to clipboard!');
    } else {
      fileExporterApiService.showNotification('warn', 'Git commit message is empty!');
    }
    if (onCopyCommitMessage) onCopyCommitMessage(gitCommitMessage);
  };

  const handleGitStage = () => {
    logInfo('[InspectResultsPanel] handleGitStage triggered');
    fileExporterApiService.showNotification('info', 'Git stage changes requested');
    if (onGitStage) onGitStage();
  };

  const handleGitCommit = () => {
    logInfo('[InspectResultsPanel] handleGitCommit triggered', [gitCommitMessage]);
    if (!gitCommitMessage.trim()) {
      fileExporterApiService.showNotification('warn', 'Git commit message is empty!');
      return;
    }
    fileExporterApiService.showNotification('info', `Git commit requested with message: "${gitCommitMessage}"`);
    if (onGitCommit) onGitCommit(gitCommitMessage);
  };

  const firstCommitLine = gitCommitMessage.trim().split('\n')[0] || 'No commit message';
  const commitBadges: BadgeObject[] = [
    {
      label: firstCommitLine,
      tooltip: `Git commit message: ${gitCommitMessage || 'Empty'}`,
      className: 'bg-primary/10 text-primary border-primary/20 w-full min-w-0 truncate cursor-pointer hover:bg-primary/20',
    },
  ];

  const commitHeaderRight = (
    <div className="flex items-center gap-0.5" onClick={(e) => e.stopPropagation()}>
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
  );

  const impactedTitle = (
    <div className="flex items-center gap-2">
      <span>📂 Impacted Files</span>
      <span className="px-1.5 py-0.5 rounded text-[10px] font-mono leading-none border bg-primary/10 text-primary border-primary/20 font-bold">
        {filePathsUpdated.length} updated / {filePathsCreated.length} created / {filePathsRemoved.length} removed
      </span>
    </div>
  );

  return (
    <div className="p-2 h-full min-h-0 flex flex-col font-mono text-xs gap-2 overflow-hidden">
      {/* Card 1: Execution Result */}
      <CollapsibleCard
        id="block-execution-result"
        title={executionTitle}
        tooltip="Standard terminal logs stream from bash codebase update script."
        headerRight={resultHeaderRight}
        isOpen={isResultOpen}
        onOpenChange={setIsResultOpen}
        className={`w-full min-w-0 ${isResultOpen ? 'flex-1 min-h-0 flex flex-col' : 'shrink-0'}`}
      >
        <div className="bg-black text-emerald-400 border border-border/60 rounded p-2 flex-1 min-h-0 h-full overflow-y-auto overflow-x-hidden font-mono text-xs leading-relaxed whitespace-pre-wrap break-all select-text">
          {executionLog || (
            <span className="text-slate-500 italic select-none">
              No execution results yet. Apply a script from "Apply Response" tab to view output.
            </span>
          )}
        </div>
      </CollapsibleCard>

      {/* Card 2: Git Commit Message */}
      <CollapsibleCard
        id="block-git-commit-message"
        title="💬 Git Commit Message"
        tooltip="Git commit message parsed from script execution or entered manually."
        summaryBadges={commitBadges}
        headerRight={commitHeaderRight}
        isOpen={isCommitOpen}
        onOpenChange={setIsCommitOpen}
        className="w-full min-w-0 shrink-0"
      >
        <Textarea
          value={gitCommitMessage}
          onChange={(e) => onChangeGitCommitMessage?.(e.target.value)}
          placeholder="Enter git commit message..."
          rows={2}
          className="w-full font-mono text-xs bg-background resize-y min-h-[48px] py-1 px-2"
        />
      </CollapsibleCard>

      {/* Card 3: Impacted Files */}
      <CollapsibleCard
        id="block-impacted-files"
        title={impactedTitle}
        tooltip="Files modified, newly generated, or removed by the applied LLM execution script."
        isOpen={isImpactedOpen}
        onOpenChange={setIsImpactedOpen}
        className="w-full min-w-0 shrink-0"
      >
        <div className="space-y-2">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-2 p-1 font-mono text-xs">
            {/* Column 1: Files Updated */}
            <div className="space-y-1 bg-muted/20 p-2 border border-border/40 rounded-md">
              <div className="font-bold text-[11px] text-amber-600 dark:text-amber-400 border-b border-border/40 pb-1 flex items-center justify-between">
                <span>✏️ Files Updated ({filePathsUpdated.length})</span>
              </div>
              {filePathsUpdated.length === 0 ? (
                <div className="py-2 text-[11px] text-muted-foreground italic">No updated files.</div>
              ) : (
                <div className="space-y-0.5 max-h-[160px] overflow-y-auto">
                  {filePathsUpdated.map((filePath) => {
                    const fileName = filePath.split(/[\\/]/).pop() || filePath;
                    return (
                      <div
                        key={filePath}
                        data-tooltip={formatPathWithBreakpoints(filePath)}
                        onClick={() => {
                          vsCodeApiService.revealInExplorer(filePath);
                          vsCodeApiService.copyToClipboard(filePath);
                          fileExporterApiService.showNotification('info', `Path copied to clipboard: ${filePath}`);
                        }}
                        onDoubleClick={() => {
                          vsCodeApiService.revealInExplorer(filePath);
                          vsCodeApiService.openFile(filePath);
                        }}
                        className="flex items-center gap-1.5 p-1 rounded hover:bg-muted/60 cursor-pointer transition-colors group truncate"
                      >
                        {renderFileIcon(filePath)}
                        <span className="font-semibold text-primary truncate hover:underline">{fileName}</span>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Column 2: Files Created */}
            <div className="space-y-1 bg-muted/20 p-2 border border-border/40 rounded-md">
              <div className="font-bold text-[11px] text-emerald-600 dark:text-emerald-400 border-b border-border/40 pb-1 flex items-center justify-between">
                <span>➕ Files Created ({filePathsCreated.length})</span>
              </div>
              {filePathsCreated.length === 0 ? (
                <div className="py-2 text-[11px] text-muted-foreground italic">No newly created files.</div>
              ) : (
                <div className="space-y-0.5 max-h-[160px] overflow-y-auto">
                  {filePathsCreated.map((filePath) => {
                    const fileName = filePath.split(/[\\/]/).pop() || filePath;
                    return (
                      <div
                        key={filePath}
                        data-tooltip={formatPathWithBreakpoints(filePath)}
                        onClick={() => {
                          vsCodeApiService.revealInExplorer(filePath);
                          vsCodeApiService.copyToClipboard(filePath);
                          fileExporterApiService.showNotification('info', `Path copied to clipboard: ${filePath}`);
                        }}
                        onDoubleClick={() => {
                          vsCodeApiService.revealInExplorer(filePath);
                          vsCodeApiService.openFile(filePath);
                        }}
                        className="flex items-center gap-1.5 p-1 rounded hover:bg-muted/60 cursor-pointer transition-colors group truncate"
                      >
                        {renderFileIcon(filePath)}
                        <span className="font-semibold text-primary truncate hover:underline">{fileName}</span>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Column 3: Files Removed */}
            <div className="space-y-1 bg-muted/20 p-2 border border-border/40 rounded-md">
              <div className="font-bold text-[11px] text-destructive border-b border-border/40 pb-1 flex items-center justify-between">
                <span>🗑️ Files Removed ({filePathsRemoved.length})</span>
              </div>
              {filePathsRemoved.length === 0 ? (
                <div className="py-2 text-[11px] text-muted-foreground italic">No removed files.</div>
              ) : (
                <div className="space-y-0.5 max-h-[160px] overflow-y-auto">
                  {filePathsRemoved.map((filePath) => {
                    const fileName = filePath.split(/[\\/]/).pop() || filePath;
                    return (
                      <div
                        key={filePath}
                        data-tooltip={`${formatPathWithBreakpoints(filePath, "Removed File:<br />", 44)}`}
                        onClick={() => {
                          vsCodeApiService.revealInExplorer(filePath); // Attempt to reveal in explorer even if removed, to verify effective removal !!
                          vsCodeApiService.copyToClipboard(filePath);
                          fileExporterApiService.showNotification('info', `Path copied to clipboard: ${filePath}`);
                        }}
                        className="flex items-center gap-1.5 p-1 rounded hover:bg-muted/60 cursor-pointer transition-colors group truncate"
                      >
                        {renderFileIcon(filePath, true)}
                        <span className="font-semibold text-destructive line-through truncate">{fileName}</span>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          <div className="flex items-center justify-between pt-2 border-t border-border/60">
            <div className="text-muted-foreground text-[11px]">
              <span className="font-bold"><strong>
                💡 Token Saver</strong>: Identify impacted scope before submitting.
                   Only <strong>{(filePathsUpdated.length + filePathsRemoved.length)} file(s) from codebase </strong> are needed for this request—providing.</span><br/>
              <span className="font-bold pl-27">Only relevant files reduces input tokens.</span>
               <br/>
            </div>
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
      </CollapsibleCard>
    </div>
  );
};

export default InspectResultsPanel;
