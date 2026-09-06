#!/usr/bin/env bash
set -e

# Ensure target directories exist
mkdir -p backend/src/services/_python-scripts
mkdir -p webview/src/features/exporter/components/tabs

# 1. Update backend argument builder with strict ordered arguments
cat << 'EOF' > backend/src/services/_python-scripts/file-exporter-py.service.ts
import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs';
import { PythonScriptStatus } from "../../../../shared/services/_python-scripts";
import { pythonScriptExecutionManager } from '../../managers/PythonScriptExecution.manager';
import { ChildProcess } from 'child_process';
import { getWorkspaceExtentionPath, getWorkspaceRoot } from '../../utils/utils-vscode';
import { logInfo, logError } from '../../utils/utils-log';

export async function callFileExporterScript(exportArgs: any): Promise<PythonScriptStatus> {
    const rootPath = getWorkspaceRoot();
    const workspaceExtPath = getWorkspaceExtentionPath();

    const candidatePaths = [
        path.join(workspaceExtPath, 'scripts', 'codebase_exporter', 'files-exporter.py'),
        path.join(workspaceExtPath, 'scripts', 'files-exporter.py'),
        path.join(rootPath, 'scripts', 'codebase_exporter', 'files-exporter.py'),
        path.join(rootPath, 'scripts', 'files-exporter.py'),
    ];

    let pythonScriptPath = '';
    for (const candidate of candidatePaths) {
        if (fs.existsSync(candidate)) {
            pythonScriptPath = candidate;
            break;
        }
    }

    if (!pythonScriptPath) {
        const errorMsg = `[file-exporter-py] Python script NOT FOUND. Checked candidate locations:\n` + candidatePaths.map(p => ` - ${p}`).join('\n');
        logError(errorMsg);
        throw new Error(errorMsg);
    }

    const absoluteCodebaseArray = makePathsAbsolute(exportArgs.paths || [], rootPath);
    const absoluteReferenceArray = makePathsAbsolute(exportArgs.referencePaths || [], rootPath);
    const absoluteDestDirectory = makeSinglePathAbsolute(exportArgs.destDir || '', rootPath);

    const runtimeData = {
        ...exportArgs,
        destDir: absoluteDestDirectory
    };

    const args: string[] = buildArgs(runtimeData, absoluteCodebaseArray.join(','), absoluteReferenceArray.join(','));

    logInfo(`[file-exporter-py] Executing Python script with args: ${args.join(' ')}`);

    const childProcess: ChildProcess = await pythonScriptExecutionManager.executeScript(pythonScriptPath, args);

    if (!childProcess || !childProcess.pid) {
        const errorMsg = `[file-exporter-py] Failed to spawn child process for script: ${pythonScriptPath}`;
        logError(errorMsg);
        throw new Error(errorMsg);
    }

    const pythonScriptStatus = pythonScriptExecutionManager.getProcessStatus(childProcess.pid || 0);
    if (!pythonScriptStatus) {
        const errorMsg = `[file-exporter-py] Failed to retrieve status for process PID: ${childProcess.pid}`;
        logError(errorMsg);
        throw new Error(errorMsg);
    }

    return pythonScriptStatus;
}

function makePathsAbsolute(paths: string[], workspaceRoot: string): string[] {
    return paths.map(p => {
        let clean = (p || '').replace(/^['"]|['"]$/g, '').trim();
        if (!clean) return '';
        if (!path.isAbsolute(clean)) {
            return path.join(workspaceRoot, clean);
        }
        return clean;
    }).filter(Boolean);
}

function makeSinglePathAbsolute(p: string, workspaceRoot: string): string {
    let clean = (p || '').replace(/^['"]|['"]$/g, '').trim();
    if (!clean) return workspaceRoot;
    if (!path.isAbsolute(clean)) {
        return path.join(workspaceRoot, clean);
    }
    return clean;
}

function buildArgs(exportArgs: any, codebaseSources: string, referenceSources: string): string[] {
    if (!exportArgs.destDir || exportArgs.destDir.trim() === '') {
        throw new Error('Destination directory is not specified in export arguments.');
    }

    const args: string[] = [];

    // 1. Execution Mode
    if (exportArgs.mode) args.push('--mode', exportArgs.mode);

    // 2. Timestamp
    if (exportArgs.timestamp) args.push('--timestamp', exportArgs.timestamp);

    // 3. Destination Directory
    args.push('--dest', exportArgs.destDir);

    const cleanFilters = (val: string) => val ? val.split(/[\n,]/).map(s => s.trim()).filter(Boolean).join(',') : '';
    const codebase = exportArgs.config?.codebase || exportArgs.codebase || {};
    const reference = exportArgs.config?.reference || exportArgs.reference || {};

    // 4. Codebase Options & Filters
    if (codebaseSources) args.push('--codebase-src', codebaseSources);
    if (codebase.max_file || exportArgs.codebaseMaxFile) args.push('--codebase-max-file', String(codebase.max_file || exportArgs.codebaseMaxFile));
    if (codebase.inc_paths || exportArgs.codebaseIncPaths) args.push('--codebase-inc-paths', cleanFilters(codebase.inc_paths || exportArgs.codebaseIncPaths));
    if (codebase.exc_paths || exportArgs.codebaseExcPaths) args.push('--codebase-exc-paths', cleanFilters(codebase.exc_paths || exportArgs.codebaseExcPaths));
    if (codebase.inc_ext || exportArgs.codebaseIncExts) args.push('--codebase-inc-ext', cleanFilters(codebase.inc_ext || exportArgs.codebaseIncExts));
    if (codebase.exc_ext || exportArgs.codebaseExcExts) args.push('--codebase-exc-ext', cleanFilters(codebase.exc_ext || exportArgs.codebaseExcExts));

    // 5. Reference Options & Filters
    if (referenceSources) args.push('--reference-src', referenceSources);
    if (reference.max_file || exportArgs.referenceMaxFile) args.push('--reference-max-file', String(reference.max_file || exportArgs.referenceMaxFile));
    if (reference.inc_paths || exportArgs.referenceIncPaths) args.push('--reference-inc-paths', cleanFilters(reference.inc_paths || exportArgs.referenceIncPaths));
    if (reference.exc_paths || exportArgs.referenceExcPaths) args.push('--reference-exc-paths', cleanFilters(reference.exc_paths || exportArgs.referenceExcPaths));
    if (reference.inc_ext || exportArgs.referenceIncExts) args.push('--reference-inc-ext', cleanFilters(reference.inc_ext || exportArgs.referenceIncExts));
    if (reference.exc_ext || exportArgs.referenceExcExts) args.push('--reference-exc-ext', cleanFilters(reference.exc_ext || exportArgs.referenceExcExts));

    // 6. Output Formatting & Chunks
    if (exportArgs.format) args.push('--format', exportArgs.format);
    if (exportArgs.maxChunk !== undefined && exportArgs.maxChunk !== '') args.push('--max-chunk', String(exportArgs.maxChunk));
    if (exportArgs.groupByExt) args.push('--group-ext');

    // 7. Logging & Generation Flags
    if (exportArgs.logConsole) args.push('--log-console');
    if (exportArgs.logFile) args.push('--log-file');
    if (exportArgs.generateTreeView) args.push('--tree-view');

    // 8. Custom Prompt
    if (exportArgs.prompt) args.push('--prompt', exportArgs.prompt);

    return args;
}
EOF

# 2. Update TerminalTab component to colorize numbers in Amber and datetime in Indigo
cat << 'EOF' > webview/src/features/exporter/components/tabs/TerminalTab.tsx
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
        title="⚙️ Bash Command Run by Exporter"
        tooltip="Dynamic shell execution command string generated from active UI configuration parameters."
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
        title="🐍 Python Script Output Console"
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
EOF

echo "✅ fix: Enforced strict argument ordering in backend and configured numbers in Amber & datetimes in Indigo in TerminalTab."
