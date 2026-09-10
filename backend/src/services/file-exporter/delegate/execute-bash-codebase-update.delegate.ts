import * as path from 'path';
import * as fs from 'fs';
import { execSync } from 'child_process';
import { logInfo } from '../../../utils/utils-log';
import { BashExecutionResult } from '../../../../../shared/services/file-exporter/model/file-exporter-model';

function cleanPath(p: string): string {
  let cleaned = p.trim().replace(/^['"]|['"]$/g, '').replace(/:\s*$/, '').trim();
  if (cleaned.startsWith('./')) {
    cleaned = cleaned.substring(2);
  }
  return cleaned;
}

function extractPathInQuotes(line: string): string | null {
  const match = line.match(/['"]([^'"]+)['"]/);
  if (match && match[1]) {
    return cleanPath(match[1]);
  }
  return null;
}

function getGitStatusPorcelain(wsPath: string): string {
  try {
    return execSync('git status --porcelain', {
      cwd: wsPath,
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'ignore'],
    });
  } catch {
    return '';
  }
}

function executeScriptFile(scriptPath: string, wsPath: string): { terminalLogs: string; execError: boolean } {
  try {
    const output = execSync(`bash "${scriptPath}"`, {
      cwd: wsPath,
      encoding: 'utf8',
      maxBuffer: 10 * 1024 * 1024,
    });
    return { terminalLogs: output, execError: false };
  } catch (err: any) {
    const logs = (err.stdout || '') + '\n' + (err.stderr || '') + '\n' + (err.message || '');
    return { terminalLogs: logs, execError: true };
  }
}

function parseImpactedPathsFromLogs(terminalLogs: string): {
  created: Set<string>;
  updated: Set<string>;
  removed: Set<string>;
} {
  const created = new Set<string>();
  const updated = new Set<string>();
  const removed = new Set<string>();

  const logLines = terminalLogs.split('\n');
  logLines.forEach((line) => {
    const cleanLine = line.trim();
    if (!cleanLine) return;

    const pathInQuotes = extractPathInQuotes(cleanLine);

    if (cleanLine.includes('➕ Creating') || cleanLine.includes('Creating')) {
      const p = pathInQuotes || cleanPath(cleanLine.replace(/.*(?:➕\s*)?Creating:?\s*/, ''));
      if (p && !p.startsWith('http') && !p.includes('...')) created.add(p);
    } else if (cleanLine.includes('✏️ Modifying') || cleanLine.includes('Modifying') || cleanLine.includes('Updated')) {
      const p = pathInQuotes || cleanPath(cleanLine.replace(/.*(?:✏️\s*)?(?:Modifying|Updated):?\s*/, ''));
      if (p && !p.startsWith('http') && !p.includes('...')) updated.add(p);
    } else if (
      cleanLine.includes('🗑️ Deleting') ||
      cleanLine.includes('🗑️ Removing') ||
      cleanLine.includes('Deleting') ||
      cleanLine.includes('Removing') ||
      cleanLine.includes('Removed')
    ) {
      const p = pathInQuotes || cleanPath(cleanLine.replace(/.*(?:🗑️\s*)?(?:Deleting|Removing|Removed):?\s*/, ''));
      if (p && !p.startsWith('http') && !p.includes('...')) removed.add(p);
    }
  });

  return { created, updated, removed };
}

function parseImpactedPathsFromGitDiff(
  gitStatusBefore: string,
  gitStatusAfter: string,
  created: Set<string>,
  updated: Set<string>,
  removed: Set<string>
): void {
  if (!gitStatusAfter) return;

  const beforeLines = new Set(gitStatusBefore.split('\n').map((l) => l.trim()).filter(Boolean));
  const afterLines = gitStatusAfter.split('\n').map((l) => l.trim()).filter(Boolean);

  const newGitLines = afterLines.filter((l) => !beforeLines.has(l));
  for (const line of newGitLines) {
    const statusCode = line.substring(0, 2);
    const relPath = cleanPath(line.substring(2));
    if (relPath && relPath !== 'update_codebase_with_llm_result.sh') {
      if (statusCode.includes('?') || statusCode.includes('A')) {
        created.add(relPath);
      } else if (statusCode.includes('M')) {
        updated.add(relPath);
      } else if (statusCode.includes('D')) {
        removed.add(relPath);
      }
    }
  }
}

function parseImpactedPathsFromBashFallback(
  bash: string,
  wsPath: string,
  created: Set<string>,
  updated: Set<string>,
  removed: Set<string>
): void {
  if (created.size > 0 || updated.size > 0 || removed.size > 0) return;

  const catRegex = /cat\s+<<\s*['"]?(\w+)['"]?\s*>\s*['"]?([a-zA-Z0-9_.\-\/]+)['"]?/g;
  let match: RegExpExecArray | null;
  while ((match = catRegex.exec(bash)) !== null) {
    const targetFile = cleanPath(match[2]);
    if (targetFile && targetFile !== 'update_codebase_with_llm_result.sh') {
      const abs = path.isAbsolute(targetFile) ? targetFile : path.join(wsPath, targetFile);
      if (fs.existsSync(abs)) {
        updated.add(targetFile);
      } else {
        created.add(targetFile);
      }
    }
  }

  const rmRegex = /rm\s+(-[rf]+\s+)?['"]?([a-zA-Z0-9_.\-\/]+)['"]?/g;
  while ((match = rmRegex.exec(bash)) !== null) {
    const targetFile = cleanPath(match[2]);
    if (targetFile && targetFile !== 'update_codebase_with_llm_result.sh') {
      removed.add(targetFile);
    }
  }
}

function extractCommitFromLine(line: string): string {
  const echoMatch = line.match(/^echo\s+["']?([^"']+)["']?$/i);
  if (echoMatch) {
    const msg = echoMatch[1].trim();
    if (
      msg.includes('✅') ||
      msg.includes('🐛') ||
      msg.includes('✨') ||
      msg.toLowerCase().startsWith('feat') ||
      msg.toLowerCase().startsWith('fix')
    ) {
      return msg;
    }
  }
  const commitMatch = line.match(/git\s+commit\s+-m\s+["']([^"']+)["']/i);
  if (commitMatch) {
    return commitMatch[1].trim();
  }
  if (line.includes('✅') || line.includes('🐛') || line.includes('✨')) {
    return line.replace(/^echo\s+/, '').replace(/^["']|["']$/g, '').trim();
  }
  return '';
}

function extractGitCommitMessage(terminalLogs: string, bash: string): string {
  const logLines = terminalLogs.split('\n').map((l) => l.trim()).filter(Boolean);
  for (let i = logLines.length - 1; i >= 0; i--) {
    const msg = extractCommitFromLine(logLines[i]);
    if (msg) {
      return msg;
    }
  }

  const scriptLines = bash.split('\n').map((l) => l.trim()).filter(Boolean);
  for (let i = scriptLines.length - 1; i >= 0; i--) {
    const msg = extractCommitFromLine(scriptLines[i]);
    if (msg) {
      return msg;
    }
  }

  return '';
}

export async function executeBashCodebaseUpdateDelegate(
  bash: string,
  wsPath: string
): Promise<BashExecutionResult> {
  const scriptPath = path.join(wsPath, 'update_codebase_with_llm_result.sh');
  logInfo(`[executeBashCodebaseUpdateDelegate] starting... (${bash.length} chars)`);

  fs.writeFileSync(scriptPath, bash, { encoding: 'utf8', mode: 0o755 });

  const gitStatusBefore = getGitStatusPorcelain(wsPath);
  const { terminalLogs, execError } = executeScriptFile(scriptPath, wsPath);

  const { created, updated, removed } = parseImpactedPathsFromLogs(terminalLogs);

  const gitStatusAfter = getGitStatusPorcelain(wsPath);
  parseImpactedPathsFromGitDiff(gitStatusBefore, gitStatusAfter, created, updated, removed);
  parseImpactedPathsFromBashFallback(bash, wsPath, created, updated, removed);

  const filePathsCreated = Array.from(created);
  const filePathsUpdated = Array.from(updated);
  const filePathsRemoved = Array.from(removed);

  const gitCommitMessage = extractGitCommitMessage(terminalLogs, bash);

  let result: 'success' | 'failed' | 'warning' = 'success';
  let message = 'Bash script executed successfully.';

  if (execError) {
    result = 'failed';
    message = 'Bash script execution failed with errors.';
  } else if (filePathsCreated.length === 0 && filePathsUpdated.length === 0 && filePathsRemoved.length === 0) {
    result = 'warning';
    message = 'Bash script executed, but no file paths were modified, created, or removed.';
  } else {
    message = `Bash script executed successfully. ${filePathsCreated.length} file(s) created, ${filePathsUpdated.length} file(s) updated, ${filePathsRemoved.length} file(s) removed.`;
  }

  return {
    terminalLogs,
    result,
    message,
    filePathsUpdated,
    filePathsCreated,
    filePathsRemoved,
    gitCommitMessage,
  };
}
