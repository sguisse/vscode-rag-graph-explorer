import React, { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Copy, Trash2 } from 'lucide-react';
import { CollapsibleCard } from '@/components/ui/collapsible-card';
import { TopMiddleBottomPanel } from '@/components/app/top-middle-bottom-panel';
import { ResizableContainer } from '@/components/app/container/resizable-container';
import { useResizable } from '@/components/app/container/hooks/use-resizable';
import { logInfo } from '@/services/view/log-view.service.wrapper';
import { vsCodeApiService } from '@/services/api/vs-code-api.service.gen';

interface TerminalTabProps {
  compiledBashCmd: string;
  terminalLogs: string;
  isRunning?: boolean;
  onCopyBashCmd?: () => void;
  onCopyTerminalLogs?: () => void;
  onClearTerminalLogs?: () => void;
}

export function formatBashCommand(cmd: string): string {
  if (!cmd || !cmd.trim()) return '';

  const raw = cmd.trim();
  const tokens: string[] = [];
  let current = '';
  let inSingle = false;
  let inDouble = false;

  for (let i = 0; i < raw.length; i++) {
    const char = raw[i];
    if (char === "'" && !inDouble) {
      inSingle = !inSingle;
      current += char;
    } else if (char === '"' && !inSingle) {
      inDouble = !inDouble;
      current += char;
    } else if (char === ' ' && !inSingle && !inDouble) {
      if (current.trim()) {
        tokens.push(current.trim());
      }
      current = '';
    } else {
      current += char;
    }
  }
  if (current.trim()) {
    tokens.push(current.trim());
  }

  if (tokens.length === 0) return '';

  const lines: string[] = [];
  let currentLine = tokens[0];

  for (let i = 1; i < tokens.length; i++) {
    const token = tokens[i];
    if (token.startsWith('-')) {
      lines.push(currentLine + ' \\');
      currentLine = '  ' + token;
    } else {
      currentLine += ' ' + token;
    }
  }
  lines.push(currentLine);

  return lines.join('\n');
}

export function renderColoredBashCommand(cmd: string): React.ReactNode {
  const formatted = formatBashCommand(cmd);
  if (!formatted) {
    return (
      <span className="text-slate-500 italic select-none">
        Terminal ready. Command will be displayed after starting export...
      </span>
    );
  }

  const lines = formatted.split('\n');

  return lines.map((line, lineIdx) => {
    let raw = line;
    let hasContinuation = false;

    if (raw.endsWith(' \\')) {
      hasContinuation = true;
      raw = raw.slice(0, -2);
    } else if (raw.endsWith('\\')) {
      hasContinuation = true;
      raw = raw.slice(0, -1);
    }

    const indentMatch = raw.match(/^(\s*)/);
    const indent = indentMatch ? indentMatch[1] : '';
    const trimmed = raw.trim();

    let contentNode: React.ReactNode = trimmed;

    if (trimmed.startsWith('python3') || trimmed.startsWith('python')) {
      const firstSpaceIdx = trimmed.indexOf(' ');
      if (firstSpaceIdx !== -1) {
        const exe = trimmed.slice(0, firstSpaceIdx);
        const rest = trimmed.slice(firstSpaceIdx + 1);
        contentNode = (
          <>
            <span className="text-emerald-400 font-semibold">{exe}</span>
            <span className="text-slate-300"> {rest}</span>
          </>
        );
      } else {
        contentNode = <span className="text-emerald-400 font-semibold">{trimmed}</span>;
      }
    } else {
      const flagMatch = trimmed.match(/^(--?[\w-]+)(?:\s+(.*))?$/);
      if (flagMatch) {
        const flag = flagMatch[1];
        const val = flagMatch[2];

        let valNode: React.ReactNode = null;
        if (val !== undefined && val !== '') {
          const cleanVal = val.replace(/^['"]|['"]$/g, '');
          const isDatetime = /^\d{4}-\d{2}-\d{2}_\d{2}-\d{2}-\d{2}$/.test(cleanVal);
          const isNumber = /^\d+$/.test(cleanVal);

          if (isDatetime) {
            valNode = <span className="text-indigo-400 font-semibold">{val}</span>;
          } else if (isNumber) {
            valNode = <span className="text-amber-400 font-semibold">{val}</span>;
          } else if (/^['"].*['"]$/.test(val)) {
            valNode = <span className="text-slate-300">{val}</span>;
          } else {
            valNode = <span className="text-amber-300">{val}</span>;
          }
        }

        contentNode = (
          <>
            <span className="text-sky-400 font-medium">{flag}</span>
            {valNode ? <> {valNode}</> : null}
          </>
        );
      }
    }

    return (
      <div key={lineIdx} className="leading-relaxed">
        <span>{indent}</span>
        {contentNode}
        {hasContinuation ? <span className="text-slate-500 font-bold"> \</span> : null}
      </div>
    );
  });
}

export function renderColoredTerminalLogs(logs: string): React.ReactNode {
  if (!logs || !logs.trim()) {
    return (
      <span className="text-slate-500 italic select-none">
        Terminal ready. Output logs will stream here during export...
      </span>
    );
  }

  const lines = logs.split('\n');

  return lines.map((line, idx) => {
    if (!line && idx === lines.length - 1) return null;

    let textColor = 'text-slate-200';
    if (line.includes('❌') || line.includes('[Error]') || line.includes('Error:')) {
      textColor = 'text-rose-400 font-semibold';
    } else if (line.includes('✅') || line.includes('completed successfully')) {
      textColor = 'text-emerald-400 font-semibold';
    } else if (line.includes('⚠️') || line.includes('Warning')) {
      textColor = 'text-amber-400';
    } else if (line.includes('🚀') || line.includes('⚡') || line.includes('📡')) {
      textColor = 'text-cyan-400 font-medium';
    } else if (line.includes('📂') || line.includes('📚') || line.includes('💾')) {
      textColor = 'text-emerald-300';
    } else if (line.includes('📋')) {
      textColor = 'text-indigo-300';
    }

    return (
      <div key={idx} className={`leading-relaxed ${textColor}`}>
        {line || '\u00A0'}
      </div>
    );
  });
}

export const TerminalTab: React.FC<TerminalTabProps> = ({
  compiledBashCmd,
  terminalLogs,
  isRunning = false,
  onCopyBashCmd,
  onCopyTerminalLogs,
  onClearTerminalLogs,
}) => {
  const [topHeight, startTopResize] = useResizable(240, 80, 800, false, false);
  const [isBashCardOpen, setIsBashCardOpen] = useState<boolean>(true);
  const [isConsoleCardOpen, setIsConsoleCardOpen] = useState<boolean>(true);
  const [autoScroll, setAutoScroll] = useState<boolean>(true);

  const consoleContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (autoScroll && consoleContainerRef.current) {
      consoleContainerRef.current.scrollTop = consoleContainerRef.current.scrollHeight;
    }
  }, [terminalLogs, autoScroll]);

  const formattedBashCmd = formatBashCommand(compiledBashCmd);

  const handleCopyBashCmd = () => {
    logInfo('[TerminalTab] onCopyBashCmd handler triggered');
    if (formattedBashCmd) {
      vsCodeApiService.copyToClipboard(formattedBashCmd);
    }
    if (onCopyBashCmd) onCopyBashCmd();
  };

  const handleCopyTerminalLogs = () => {
    logInfo('[TerminalTab] onCopyTerminalLogs handler triggered');
    if (terminalLogs) {
      vsCodeApiService.copyToClipboard(terminalLogs);
    }
    if (onCopyTerminalLogs) onCopyTerminalLogs();
  };

  const handleClearTerminalLogs = () => {
    logInfo('[TerminalTab] onClearTerminalLogs handler triggered');
    if (onClearTerminalLogs) onClearTerminalLogs();
  };

  const bashHeaderRight = (
    <Button
      size="icon-xs"
      variant="ghost"
      onClick={(e) => {
        e.stopPropagation();
        handleCopyBashCmd();
      }}
      data-tooltip="Copy Formatted Bash Command"
      className="h-5 w-5 cursor-pointer hover:bg-accent"
    >
      <Copy size={12} />
    </Button>
  );

  const consoleHeaderRight = (
    <div className="flex items-center gap-2">
      {isRunning && (
        <span className="flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 animate-pulse">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 inline-block"></span>
          LIVE
        </span>
      )}

      <label
        className="flex items-center gap-1 text-[11px] font-medium text-muted-foreground cursor-pointer select-none"
        onClick={(e) => e.stopPropagation()}
        title="Stick to bottom as output logs arrive"
      >
        <input
          type="checkbox"
          checked={autoScroll}
          onChange={(e) => setAutoScroll(e.target.checked)}
          className="h-3 w-3 rounded border-border text-primary focus:ring-0 cursor-pointer"
        />
        Auto-scroll
      </label>

      <Button
        size="icon-xs"
        variant="ghost"
        onClick={(e) => {
          e.stopPropagation();
          handleCopyTerminalLogs();
        }}
        data-tooltip="Copy Terminal Logs"
        className="h-5 w-5 cursor-pointer hover:bg-accent"
      >
        <Copy size={12} />
      </Button>

      <Button
        size="icon-xs"
        variant="ghost"
        onClick={(e) => {
          e.stopPropagation();
          handleClearTerminalLogs();
        }}
        data-tooltip="Clear Terminal Logs"
        className="h-5 w-5 hover:text-destructive cursor-pointer"
      >
        <Trash2 size={12} />
      </Button>
    </div>
  );

  const topContent = (
    <ResizableContainer
      id="panel-terminal-top-resizable"
      visible
      resizeHandle="bottom"
      onResizeStart={startTopResize}
      style={{ height: isBashCardOpen ? `${topHeight}px` : 'auto' }}
      className="w-full shrink-0 min-h-0 pb-1 flex flex-col overflow-hidden"
    >
      <CollapsibleCard
        id="block-terminal-bash-cmd"
        title="⚙️ Bash Command Run by Exporter (Reusable in OS Terminal)"
        tooltip="Shell execution command string generated from active UI configuration parameters."
        headerRight={bashHeaderRight}
        isOpen={isBashCardOpen}
        onOpenChange={setIsBashCardOpen}
        className="h-full w-full min-h-0 flex flex-col font-sans overflow-hidden [&>:last-child]:flex-1 [&>:last-child]:min-h-0 [&>:last-child]:flex [&>:last-child]:flex-col [&>:last-child]:h-full [&>:last-child]:overflow-hidden"
      >
        <div className="flex-1 min-h-0 h-full w-full bg-black text-slate-200 border border-border/60 rounded p-3 overflow-y-auto overflow-x-hidden font-mono text-xs leading-relaxed select-text whitespace-pre-wrap break-all [overflow-wrap:anywhere]">
          {renderColoredBashCommand(compiledBashCmd)}
        </div>
      </CollapsibleCard>
    </ResizableContainer>
  );

  const middleContent = (
    <div className="h-full w-full min-h-0 flex flex-col pt-1 overflow-hidden flex-1">
      <CollapsibleCard
        id="block-terminal-python-console"
        title="🐍 Python Export Script Output Console"
        tooltip="Real-time standard execution stream and output logs from backend exporter scripts."
        headerRight={consoleHeaderRight}
        isOpen={isConsoleCardOpen}
        onOpenChange={setIsConsoleCardOpen}
        className="h-full w-full min-h-0 flex flex-col font-sans flex-1 overflow-hidden [&>:last-child]:flex-1 [&>:last-child]:min-h-0 [&>:last-child]:flex [&>:last-child]:flex-col [&>:last-child]:h-full [&>:last-child]:overflow-hidden"
      >
        <div
          ref={consoleContainerRef}
          className="flex-1 min-h-0 h-full w-full bg-black text-emerald-400 border border-border/60 rounded p-3 overflow-y-auto overflow-x-hidden font-mono text-xs leading-relaxed select-text whitespace-pre-wrap break-all [overflow-wrap:anywhere]"
        >
          {renderColoredTerminalLogs(terminalLogs)}
        </div>
      </CollapsibleCard>
    </div>
  );

  return (
    <TopMiddleBottomPanel
      id="panel-terminal-tab"
      className="w-full h-full min-h-0 overflow-hidden bg-background p-2 font-sans"
      top={topContent}
      middle={middleContent}
    />
  );
};

export default TerminalTab;
