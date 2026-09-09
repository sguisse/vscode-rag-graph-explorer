import React from 'react';
import { Button } from '@/components/ui/button';
import { CheckSquare, Search } from 'lucide-react';
import { TopMiddleBottomPanel } from '@/components/app/top-middle-bottom-panel';
import { LeftCenterRightPanel } from '@/components/app/left-center-right-panel';
import { useLlmResponse } from './hooks/use-llm-response';
import { ApplyResponsePanel } from './components/apply-response/ApplyResponsePanel';
import { InspectResultsPanel } from './components/inspect-results/InspectResultsPanel';

export const LlmResponseTab: React.FC = () => {
  const {
    subTab,
    setSubTab,
    llmResponse,
    setLlmResponse,
    executionLog,
    impactedFilesCount,
    gitCommitMessage,
    setGitCommitMessage,
    isExecuting,
    handlePasteLlmResponse,
    handleExtractShScript,
    handleApplyShScript,
    handleCopyExecutionResult,
    handleCreateProfileFromImpacted,
  } = useLlmResponse();

  const topContent = (
    <LeftCenterRightPanel
      id="llm-response-subtab-panel"
      className="bg-muted/60 p-1 border-b border-border shrink-0 font-mono text-xs"
      left={
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setSubTab('apply')}
            className={`h-6 px-2.5 text-[11px] gap-1.5 cursor-pointer font-bold transition-all rounded-md ${
              subTab === 'apply'
                ? 'bg-background text-foreground border border-border/60 shadow-xs'
                : 'text-muted-foreground hover:text-foreground hover:bg-background/40 border border-transparent'
            }`}
          >
            <CheckSquare size={13} className={subTab === 'apply' ? 'text-primary' : ''} />
            <span>Apply Response</span>
          </Button>

          <Button
            variant="ghost"
            size="sm"
            onClick={() => setSubTab('inspect')}
            className={`h-6 px-2.5 text-[11px] gap-1.5 cursor-pointer font-bold transition-all rounded-md ${
              subTab === 'inspect'
                ? 'bg-background text-foreground border border-border/60 shadow-xs'
                : 'text-muted-foreground hover:text-foreground hover:bg-background/40 border border-transparent'
            }`}
          >
            <Search size={13} className={subTab === 'inspect' ? 'text-primary' : ''} />
            <span>Inspect Results</span>
          </Button>
        </div>
      }
    />
  );

  const middleContent = (
    <div className="flex-1 h-full min-h-0 w-full overflow-hidden">
      {subTab === 'apply' && (
        <ApplyResponsePanel
          llmResponse={llmResponse}
          isExecuting={isExecuting}
          onChangeLlmResponse={setLlmResponse}
          onPaste={handlePasteLlmResponse}
          onExtractSh={handleExtractShScript}
          onApplySh={handleApplyShScript}
        />
      )}
      {subTab === 'inspect' && (
        <InspectResultsPanel
          executionLog={executionLog}
          impactedFilesCount={impactedFilesCount}
          gitCommitMessage={gitCommitMessage}
          onChangeGitCommitMessage={setGitCommitMessage}
          onCopyResult={handleCopyExecutionResult}
          onCreateProfile={handleCreateProfileFromImpacted}
        />
      )}
    </div>
  );

  return (
    <TopMiddleBottomPanel
      id="panel-llm-response-tab"
      className="w-full h-full min-h-0 overflow-hidden bg-background font-mono text-xs"
      top={topContent}
      middle={middleContent}
    />
  );
};

export default LlmResponseTab;
