#!/usr/bin/env bash
set -e

mkdir -p backend/src/services/transform-content

cat << 'EOF' > backend/src/services/transform-content/transform-content-service.adapter.ts
import * as vscode from 'vscode';
import * as crypto from 'crypto';
import { AbstractServiceAdapter } from '../../core/AbstractServiceAdapter';
import { logInfo, logError } from '../../utils/utils-log';
import { ITransformContentServicePort } from '../../../../shared/services/transform-content/port-out/transform-content-service.port';
import {
    TransformerWorkflow,
    TransformationResult,
    AnonymizationRule,
    RegexExtractionStep,
    MinifyOptions,
    ExtractedTableRecord
} from '../../../../shared/services/transform-content/model/transform-content-model';

function simpleHash(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash |= 0;
  }
  return hash;
}

/**
 * Externalized Transformation Stage 1: Anonymization
 */
function applyAnonymization(
  content: string,
  rules: AnonymizationRule[] = [],
  logs: string[]
): { anonymizedText: string; processedText: string; totalMatches: number } {
  let processedText = content;
  let totalMatches = 0;

  for (const rule of rules) {
    if (!rule.enabled || !rule.pattern) continue;
    try {
      const regex = new RegExp(rule.pattern, 'gi');
      const matches = processedText.match(regex);
      if (matches) {
        totalMatches += matches.length;
        logs.push(`[Anonymizer] Rule '${rule.name}' matched ${matches.length} instance(s)`);
        processedText = processedText.replace(regex, (match) => {
          if (rule.strategy === 'hash') return `[HASH:${Math.abs(simpleHash(match))}]`;
          if (rule.strategy === 'uuid') {
            const uuid = crypto.randomUUID ? crypto.randomUUID().slice(0, 8) : Math.random().toString(36).substring(2, 10);
            return `[UUID:${uuid}]`;
          }
          if (rule.strategy === 'replace') return rule.replace ?? rule.replacement ?? '';
          return '[REDACTED]';
        });
      }
    } catch (err: any) {
      logs.push(`[Anonymizer Error] Rule '${rule.name}': ${err.message}`);
    }
  }

  return {
    anonymizedText: processedText,
    processedText,
    totalMatches,
  };
}

/**
 * Externalized Transformation Stage 2: Extraction & Regex Replacements
 */
function applyExtraction(
  inputText: string,
  steps: RegexExtractionStep[] = [],
  logs: string[]
): { processedText: string; extractedData: Record<string, string>; records: ExtractedTableRecord[]; matchesCount: number } {
  let processedText = inputText;
  let matchesCount = 0;
  const extractedData: Record<string, string> = {};
  const records: ExtractedTableRecord[] = [];

  for (const step of steps) {
    if (!step.enabled || !step.pattern) continue;

    try {
      const flags = step.flags || 'g';
      const regex = new RegExp(step.pattern, flags);
      let match: RegExpExecArray | null;
      let stepMatchCount = 0;

      if (flags.includes('g')) {
        while ((match = regex.exec(processedText)) !== null) {
          stepMatchCount++;
          matchesCount++;

          if (match.groups) {
            Object.entries(match.groups).forEach(([grpName, val]) => {
              extractedData[grpName] = val;
              records.push({
                id: `${step.id}-${stepMatchCount}-${grpName}`,
                stepName: step.name,
                variable: grpName,
                value: val,
                rawMatch: match![0],
                status: 'matched',
              });
            });
          } else if (step.targetVariable) {
            const extractedVal = match[1] ?? match[0];
            extractedData[step.targetVariable] = extractedVal;
            records.push({
              id: `${step.id}-${stepMatchCount}`,
              stepName: step.name,
              variable: step.targetVariable,
              value: extractedVal,
              rawMatch: match[0],
              status: 'matched',
            });
          }

          if (match[0].length === 0) regex.lastIndex++;
        }
      } else {
        match = regex.exec(processedText);
        if (match) {
          stepMatchCount++;
          matchesCount++;
          if (match.groups) {
            Object.entries(match.groups).forEach(([grpName, val]) => {
              extractedData[grpName] = val;
              records.push({
                id: `${step.id}-1-${grpName}`,
                stepName: step.name,
                variable: grpName,
                value: val,
                rawMatch: match![0],
                status: 'matched',
              });
            });
          } else if (step.targetVariable) {
            const extractedVal = match[1] ?? match[0];
            extractedData[step.targetVariable] = extractedVal;
            records.push({
              id: `${step.id}-1`,
              stepName: step.name,
              variable: step.targetVariable,
              value: extractedVal,
              rawMatch: match[0],
              status: 'matched',
            });
          }
        }
      }

      if (step.replacement !== undefined) {
        processedText = processedText.replace(regex, step.replacement);
      }

      logs.push(`[Extraction] Step '${step.name}' produced ${stepMatchCount} match(es)`);
    } catch (err: any) {
      logs.push(`[Extraction Error] Step '${step.name}': ${err.message}`);
    }
  }

  return { processedText, extractedData, records, matchesCount };
}

/**
 * Externalized Transformation Stage 3: Templating
 */
function applyTemplating(template: string, data: Record<string, any>): string {
  return template.replace(/\{\{\s*([\w.]+)\s*\}\}/g, (_, key) => {
    return data[key] !== undefined ? String(data[key]) : '';
  });
}

/**
 * Externalized Transformation Stage 4: Minification
 */
function applyMinification(renderedOutput: string, options?: MinifyOptions): string {
  if (!options) return renderedOutput;
  let result = renderedOutput;

  if (options.stripComments) {
    result = result.replace(/<!--[\s\S]*?-->|\/\*[\s\S]*?\*\//g, '');
  }
  if (options.collapseWhitespace) {
    result = result.replace(/[ \t]+/g, ' ');
  }
  if (options.trimLines) {
    result = result
      .split('\n')
      .map((l) => l.trim())
      .filter(Boolean)
      .join('\n');
  }

  return result;
}

export class TransformContentAdapter extends AbstractServiceAdapter implements ITransformContentServicePort, vscode.Disposable {

    constructor() {
        super();
    }

    public async transform(workflow: TransformerWorkflow, content: string): Promise<TransformationResult> {
        const startTime = performance.now();
        const logs: string[] = [];

        logs.push(`[ETL] Starting pipeline: ${workflow.name || 'Untitled Workflow'}`);

        // Stage 1: Anonymization
        const { anonymizedText, processedText: anonymizedProcessedText, totalMatches: anonMatches } =
          applyAnonymization(content, workflow.anonymizationRules, logs);

        // Stage 2: Regex Extraction & Replacements
        const { processedText: extractedProcessedText, extractedData, records, matchesCount: extractMatches } =
          applyExtraction(anonymizedProcessedText, workflow.extractionSteps, logs);

        // Stage 3: Templating
        const rawTemplatedOutput = applyTemplating(
          workflow.outputTemplate || '{{raw_content}}',
          {
            ...extractedData,
            raw_content: extractedProcessedText,
            anonymized_content: anonymizedText,
          }
        );

        // Stage 4: Minification
        const renderedOutput = applyMinification(rawTemplatedOutput, workflow.minify);

        const totalMatches = anonMatches + extractMatches;
        const endTime = performance.now();
        const executionTimeMs = Math.round((endTime - startTime) * 100) / 100;
        const inputBytes = Buffer.byteLength(content, 'utf-8');
        const outputBytes = Buffer.byteLength(renderedOutput, 'utf-8');
        const sizeKb = parseFloat((outputBytes / 1024).toFixed(2));

        logInfo(`[TransformContentAdapter] Transformed content size: ${sizeKb.toFixed(2)} KB / ${(inputBytes / 1024).toFixed(2)} KB`);

        return {
          content: renderedOutput,
          sizeKb,
          anonymizedText,
          extractedData,
          records,
          renderedOutput,
          metrics: {
            executionTimeMs,
            inputBytes,
            outputBytes,
            totalMatches,
            logs,
          },
        };
    }

    public dispose() {
        // Cleanup if necessary
    }
}
EOF

echo "✨ refactor: Externalized anonymization, extraction, templating, and minification into dedicated helper functions in TransformContentAdapter! Run 'npm run compile' to build."
