#!/usr/bin/env node
/**
 * Applies a YAML "generation manifest" (file create/update/delete list) to the workspace.
 *
 * Features:
 * - Auto-repairs `.tsx` and `.jsx` file content for common LLM syntax corruption signatures.
 * - Tracks and reports sanitization replacement counts per file at completion.
 * - Full AST syntax validation via TypeScript Compiler API (can be bypassed with --skipCheckSyntax).
 * - Double-check regex gate for residual JSX corruption signatures.
 * - Workspace rollback on build or syntax failure (skipped with warning if --skipCheckSyntax is enabled).
 *
 * Usage:
 *   node dev-tools/apply-yaml-on-codebase.js path/to/manifest.yaml
 *   node dev-tools/apply-yaml-on-codebase.js path/to/manifest.yaml --skipCheckSyntax
 */
const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');
const yaml = require('js-yaml');
const ts = require('typescript');

const WORKSPACE_ROOT = process.cwd();
const VALID_ACTIONS = new Set(['create', 'update', 'delete']);
const SYNTAX_CHECKED_EXTENSIONS = new Set(['ts', 'tsx', 'js', 'jsx']);
const SANITIZED_EXTENSIONS = new Set(['tsx', 'jsx']);

// Pattern for common LLM JSX corruption signatures
const JSX_CORRUPTION_REGEX = /="\{|\}"|=>"[[:space:]]*>/;

/**
 * Pre-pass auto-repair for common LLM generation/formatting corruptions on JSX/TSX content.
 * Returns the sanitized string and the total number of replacements made.
 */
function sanitizeContentWithCount(content) {
  if (typeof content !== 'string') return { content, count: 0 };

  let totalCount = 0;
  let result = content;

  const rules = [
    [/null \|>/g, '| null>'],
    [/ "\{\(\)">/g, '{() =>'],
    [/=(?:")(\{.*?\})(?:")/g, '=$1'],
    [/="\{\((.*?)\)">/g, '={($1) =>'],
    [/"\{/g, '{'],
    [/\}"/g, '}'],
  ];

  for (const [regex, replacement] of rules) {
    const matches = result.match(regex);
    if (matches) {
      totalCount += matches.length;
      result = result.replace(regex, replacement);
    }
  }

  return { content: result, count: totalCount };
}

function fail(message) {
  console.error(`❌ ${message}`);
  process.exit(1);
}

function resolveTargetPath(entry, index) {
  if (!entry.filename || typeof entry.filename !== 'string') fail(`Entry #${index}: missing 'filename'.`);
  if (!entry.extension || typeof entry.extension !== 'string') fail(`Entry #${index}: missing 'extension'.`);
  if (!entry.path || typeof entry.path !== 'string') fail(`Entry #${index}: missing 'path'.`);
  if (!VALID_ACTIONS.has(entry.action)) fail(`Entry #${index}: 'action' must be one of create|update|delete.`);
  if (entry.action !== 'delete' && typeof entry.content !== 'string') {
    fail(`Entry #${index} (${entry.filename}.${entry.extension}): 'content' is required for action '${entry.action}'.`);
  }

  const targetDir = path.resolve(WORKSPACE_ROOT, entry.path);
  const targetFile = path.join(targetDir, `${entry.filename}.${entry.extension}`);

  const relative = path.relative(WORKSPACE_ROOT, targetFile);
  if (relative.startsWith('..') || path.isAbsolute(relative)) {
    fail(`Entry #${index} (${entry.filename}.${entry.extension}): path escapes workspace root.`);
  }

  return targetFile;
}

function checkSyntax(entry, targetFile) {
  const errors = [];

  // 1. Regex Pre-Check for residual LLM JSX corruption patterns
  const lines = entry.content.split('\n');
  lines.forEach((lineText, idx) => {
    if (JSX_CORRUPTION_REGEX.test(lineText)) {
      errors.push(`line ${idx + 1}: JSX corruption signature detected (quoted brace or truncated callback): "${lineText.trim()}"`);
    }
  });

  // 2. TypeScript Compiler AST Parsing
  const isJsx = targetFile.endsWith('.tsx') || targetFile.endsWith('.jsx');
  const result = ts.transpileModule(entry.content, {
    compilerOptions: {
      target: ts.ScriptTarget.Latest,
      module: ts.ModuleKind.ESNext,
      jsx: isJsx ? ts.JsxEmit.ReactJSX : ts.JsxEmit.None,
    },
    reportDiagnostics: true,
    fileName: targetFile,
  });

  (result.diagnostics || []).forEach((d) => {
    const message = ts.flattenDiagnosticMessageText(d.messageText, '\n');
    if (d.file && d.start !== undefined) {
      const { line, character } = d.file.getLineAndCharacterOfPosition(d.start);
      errors.push(`line ${line + 1}, col ${character + 1}: ${message}`);
    } else {
      errors.push(message);
    }
  });

  return errors;
}

function main() {
  const cliArgs = process.argv.slice(2);
  const skipCheckSyntax = cliArgs.some((arg) => arg === '--skipCheckSyntax' || arg === 'skipCheckSyntax');
  const manifestArg = cliArgs.find((arg) => arg !== '--skipCheckSyntax' && arg !== 'skipCheckSyntax');

  if (!manifestArg) fail('Usage: node dev-tools/apply-yaml-on-codebase.js path/to/manifest.yaml [--skipCheckSyntax]');

  const manifestPath = path.resolve(WORKSPACE_ROOT, manifestArg);
  if (!fs.existsSync(manifestPath)) fail(`Manifest not found: ${manifestPath}`);

  const rawManifestText = fs.readFileSync(manifestPath, 'utf8');

  let manifest;
  try {
    manifest = yaml.load(rawManifestText);
  } catch (err) {
    fail(`Failed to parse YAML manifest: ${err.message}`);
  }

  const files = manifest?.generation?.files;
  if (!Array.isArray(files) || files.length === 0) fail("Manifest must define 'generation.files' as a non-empty array.");

  if (skipCheckSyntax) {
    console.log(`⚠️  skipCheckSyntax flag detected. Bypassing syntax validation for ${files.length} manifest entr${files.length === 1 ? 'y' : 'ies'}...`);
  } else {
    console.log(`🚀 Validating ${files.length} manifest entr${files.length === 1 ? 'y' : 'ies'}...`);
  }

  const resolvedEntries = [];
  const validationErrors = [];
  const sanitizationStats = []; // Tracks files with >0 replacements

  files.forEach((entry, index) => {
    const ext = (entry.extension || '').replace(/^\./, '').toLowerCase();

    // Apply sanitization strictly to .tsx and .jsx file extensions
    if (SANITIZED_EXTENSIONS.has(ext) && entry.content && typeof entry.content === 'string') {
      const { content: cleanedContent, count } = sanitizeContentWithCount(entry.content);
      entry.content = cleanedContent;

      if (count > 0) {
        const fileLabel = `${entry.path}/${entry.filename}.${entry.extension}`;
        sanitizationStats.push({ file: fileLabel, count });
      }
    }

    const targetFile = resolveTargetPath(entry, index);
    resolvedEntries.push({ entry, targetFile });

    if (entry.action === 'delete') return;

    if (!skipCheckSyntax && SYNTAX_CHECKED_EXTENSIONS.has(ext)) {
      const errors = checkSyntax(entry, targetFile);
      if (errors.length > 0) {
        validationErrors.push({ targetFile, errors });
      }
    }
  });

  if (validationErrors.length > 0) {
    console.error(`❌ Syntax validation failed for ${validationErrors.length} file(s). Zero disk writes performed.`);
    validationErrors.forEach(({ targetFile, errors }) => {
      console.error(`\n  ${path.relative(WORKSPACE_ROOT, targetFile)}`);
      errors.forEach((e) => console.error(`    - ${e}`));
    });
    process.exit(1);
  }

  console.log('✅ All entries ready. Creating backups and applying to disk...');

  // Create in-memory backups for atomic rollback if `npm run build` fails
  const backups = new Map();
  resolvedEntries.forEach(({ targetFile }) => {
    if (fs.existsSync(targetFile)) {
      backups.set(targetFile, fs.readFileSync(targetFile));
    } else {
      backups.set(targetFile, null);
    }
  });

  try {
    resolvedEntries.forEach(({ entry, targetFile }) => {
      const relativeDisplay = path.relative(WORKSPACE_ROOT, targetFile);
      if (entry.action === 'delete') {
        if (fs.existsSync(targetFile)) {
          fs.unlinkSync(targetFile);
          console.log(`🗑️ Removed existing file: '${relativeDisplay}'`);
        }
        return;
      }

      fs.mkdirSync(path.dirname(targetFile), { recursive: true });
      const icon = entry.action === 'create' ? '➕ Creating new file' : '✏️ Modifying existing file';
      console.log(`${icon}: '${relativeDisplay}'`);
      fs.writeFileSync(targetFile, entry.content, 'utf8');
    });

    console.log('🧪 Running workspace build verification...');
    execFileSync('npm', ['run', 'build'], { cwd: WORKSPACE_ROOT, stdio: 'inherit' });

  } catch (err) {
    if (skipCheckSyntax) {
      console.warn('\n⚠️  WARNING: Workspace build verification failed!');
      console.warn('⚠️  Because --skipCheckSyntax was enabled, rollback is SKIPPED and changes remain on disk.');
      process.exit(1);
    } else {
      console.error('\n❌ Workspace build verification failed! Rolling back disk changes...');
      backups.forEach((content, file) => {
        if (content === null) {
          if (fs.existsSync(file)) fs.unlinkSync(file);
        } else {
          fs.writeFileSync(file, content);
        }
      });
      fail('Rollback complete. Workspace restored to clean state.');
    }
  }

  // Print sanitization report (only lists files with >0 replacements)
  if (sanitizationStats.length > 0) {
    console.log('\n🧹 Sanitization replacements applied:');
    sanitizationStats.forEach(({ file, count }) => {
      console.log(`  - ${file} : ${count}`);
    });
  }

  const commitMessage = manifest?.commit?.message;
  if (commitMessage) console.log(`\n${commitMessage}`);
}

main();