#!/usr/bin/env bash
set -e

TRANSFORMER_DIR="webview/src/features/transformer"

mkdir -p "${TRANSFORMER_DIR}/types"
mkdir -p "${TRANSFORMER_DIR}/utils"
mkdir -p "${TRANSFORMER_DIR}/components/workflow-editor/tabs"

# 1. Update Transformer Types Definition
cat << 'EOF' > "${TRANSFORMER_DIR}/types/transformer.types.ts"
export type AnonymizationStrategy = 'mask' | 'hash' | 'uuid' | 'replace';

export interface AnonymizationRule {
  id: string;
  name: string;
  pattern: string;
  strategy: AnonymizationStrategy;
  replace?: string;
  replacement?: string;
  enabled: boolean;
}

export interface RegexExtractionStep {
  id: string;
  name: string;
  pattern: string;
  flags?: string;
  targetVariable?: string; // If specified, stores match into this key
  replacement?: string;    // Optional substitution
  enabled: boolean;
}

export interface MinifyOptions {
  stripComments: boolean;
  collapseWhitespace: boolean;
  trimLines: boolean;
}

export interface TransformerWorkflow {
  id: string;
  name: string;
  description?: string;
  anonymizationRules: AnonymizationRule[];
  extractionSteps: RegexExtractionStep[];
  minify: MinifyOptions;
  outputTemplate: string;
  outputFormat: 'json' | 'yaml' | 'xml' | 'markdown' | 'plaintext';
}

export interface ExtractedTableRecord {
  id: string;
  stepName: string;
  variable: string;
  value: string;
  rawMatch: string;
  status: 'matched' | 'skipped' | 'failed';
}

export interface PipelineExecutionMetrics {
  executionTimeMs: number;
  inputBytes: number;
  outputBytes: number;
  totalMatches: number;
  logs: string[];
}
EOF

# 2. Update Transformer Engine with 'replace' strategy execution
cat << 'EOF' > "${TRANSFORMER_DIR}/utils/transformer-engine.ts"
import {
  TransformerWorkflow,
  ExtractedTableRecord,
  PipelineExecutionMetrics,
} from '../types/transformer.types';

/**
 * Lightweight Client-side Mustache Interpolator
 */
export function renderMustacheTemplate(template: string, data: Record<string, any>): string {
  return template.replace(/\{\{\s*([\w.]+)\s*\}\}/g, (_, key) => {
    return data[key] !== undefined ? String(data[key]) : '';
  });
}

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
 * Executes full Lite-ETL transformation pipeline
 */
export function executeTransformationPipeline(
  inputText: string,
  workflow: TransformerWorkflow
): {
  anonymizedText: string;
  extractedData: Record<string, string>;
  records: ExtractedTableRecord[];
  renderedOutput: string;
  metrics: PipelineExecutionMetrics;
} {
  const startTime = performance.now();
  const logs: string[] = [];
  const records: ExtractedTableRecord[] = [];
  const extractedData: Record<string, string> = {};

  logs.push(`[ETL] Starting pipeline: ${workflow.name || 'Untitled Workflow'}`);

  // Stage 1: Anonymization
  let processedText = inputText;
  let totalMatches = 0;

  for (const rule of workflow.anonymizationRules || []) {
    if (!rule.enabled || !rule.pattern) continue;
    try {
      const regex = new RegExp(rule.pattern, 'gi');
      const matches = processedText.match(regex);
      if (matches) {
        totalMatches += matches.length;
        logs.push(`[Anonymizer] Rule '${rule.name}' matched ${matches.length} instance(s)`);
        processedText = processedText.replace(regex, (match) => {
          if (rule.strategy === 'hash') return `[HASH:${Math.abs(simpleHash(match))}]`;
          if (rule.strategy === 'uuid') return `[UUID:${crypto.randomUUID().slice(0, 8)}]`;
          if (rule.strategy === 'replace') return rule.replace ?? rule.replacement ?? '';
          return '[REDACTED]';
        });
      }
    } catch (err: any) {
      logs.push(`[Anonymizer Error] Rule '${rule.name}': ${err.message}`);
    }
  }

  const anonymizedText = processedText;

  // Stage 2: Regex Extraction & Replacements
  for (const step of workflow.extractionSteps || []) {
    if (!step.enabled || !step.pattern) continue;

    try {
      const flags = step.flags || 'g';
      const regex = new RegExp(step.pattern, flags);
      let match: RegExpExecArray | null;
      let stepMatchCount = 0;

      if (flags.includes('g')) {
        while ((match = regex.exec(processedText)) !== null) {
          stepMatchCount++;
          totalMatches++;

          // Named capture groups support
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
          totalMatches++;
          if (step.targetVariable) {
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

  // Stage 3: Templating
  let renderedOutput = renderMustacheTemplate(
    workflow.outputTemplate || '{{raw_content}}',
    {
      ...extractedData,
      raw_content: processedText,
      anonymized_content: anonymizedText,
    }
  );

  // Stage 4: Minification
  if (workflow.minify) {
    if (workflow.minify.stripComments) {
      renderedOutput = renderedOutput.replace(/<!--[\s\S]*?-->|\/\*[\s\S]*?\*\//g, '');
    }
    if (workflow.minify.collapseWhitespace) {
      renderedOutput = renderedOutput.replace(/[ \t]+/g, ' ');
    }
    if (workflow.minify.trimLines) {
      renderedOutput = renderedOutput
        .split('\n')
        .map((l) => l.trim())
        .filter(Boolean)
        .join('\n');
    }
  }

  const endTime = performance.now();
  const executionTimeMs = Math.round((endTime - startTime) * 100) / 100;

  return {
    anonymizedText,
    extractedData,
    records,
    renderedOutput,
    metrics: {
      executionTimeMs,
      inputBytes: new Blob([inputText]).size,
      outputBytes: new Blob([renderedOutput]).size,
      totalMatches,
      logs,
    },
  };
}

export const DEFAULT_WORKFLOW_JSON: TransformerWorkflow = {
  id: 'default-web-scraper-etl',
  name: 'Web Scraper & Article Extractor',
  description: 'Extracts title, meta tags, and PII anonymization from web content',
  anonymizationRules: [
    {
      id: 'anon-email',
      name: 'Sanitize Emails',
      pattern: '[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}',
      strategy: 'mask',
      enabled: true,
    },
    {
      id: 'anon-ip',
      name: 'Sanitize IP Addresses',
      pattern: '\\b(?:\\d{1,3}\\.){3}\\d{1,3}\\b',
      strategy: 'hash',
      enabled: true,
    },
    {
      id: 'anon-enterprise',
      name: 'Sanitize Enterprise Name',
      pattern: 'dkt',
      strategy: 'replace',
      replace: 'ent',
      enabled: true,
    },
  ],
  extractionSteps: [
    {
      id: 'step-title',
      name: 'Extract HTML Title',
      pattern: '<title>(?<title>[^<]+)</title>',
      flags: 'i',
      targetVariable: 'title',
      enabled: true,
    },
    {
      id: 'step-meta-desc',
      name: 'Extract Meta Description',
      pattern: '<meta\\s+name="description"\\s+content="(?<description>[^"]+)"',
      flags: 'i',
      targetVariable: 'description',
      enabled: true,
    },
  ],
  minify: {
    stripComments: true,
    collapseWhitespace: true,
    trimLines: false,
  },
  outputTemplate: `{\n  "articleTitle": "{{title}}",\n  "summary": "{{description}}",\n  "cleanBody": "{{raw_content}}"\n}`,
  outputFormat: 'json',
};
EOF

# 3. Update TreeTableTab.tsx to display 'replace' strategy values
cat << 'EOF' > "${TRANSFORMER_DIR}/components/workflow-editor/tabs/TreeTableTab.tsx"
import React, { useState } from 'react';
import { ChevronDown, ChevronRight, ShieldCheck, Zap, Scissors } from 'lucide-react';
import { TransformerWorkflow } from '../../../types/transformer.types';

interface TreeTableTabProps {
  parsedWorkflow: TransformerWorkflow;
}

export const TreeTableTab: React.FC<TreeTableTabProps> = ({ parsedWorkflow }) => {
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    anonymization: true,
    extraction: true,
    minify: true,
  });

  const toggleSection = (key: string) => {
    setExpandedSections((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  return (
    <div className="flex flex-col h-full w-full p-2 font-mono text-xs overflow-y-auto space-y-2 bg-card select-none">
      {/* 1. Anonymization Rules */}
      <div className="border border-border rounded-md overflow-hidden bg-background">
        <div
          onClick={() => toggleSection('anonymization')}
          className="flex items-center justify-between p-2 bg-muted/30 cursor-pointer hover:bg-muted/50 transition-colors"
        >
          <div className="flex items-center gap-2 font-bold text-foreground">
            {expandedSections.anonymization ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
            <ShieldCheck size={14} className="text-emerald-500" />
            <span>Anonymization Rules ({parsedWorkflow.anonymizationRules?.length || 0})</span>
          </div>
        </div>

        {expandedSections.anonymization && (
          <div className="p-2 space-y-1 divide-y divide-border/40">
            {(parsedWorkflow.anonymizationRules || []).length === 0 ? (
              <div className="text-muted-foreground italic p-1">No anonymization rules configured.</div>
            ) : (
              parsedWorkflow.anonymizationRules.map((rule) => {
                const replacementText = rule.strategy === 'replace' ? rule.replace ?? rule.replacement : '';
                return (
                  <div key={rule.id} className="pt-1 text-[11px] space-y-0.5">
                    <div className="flex justify-between items-center">
                      <span className="font-bold text-foreground">{rule.name}</span>
                      <span className="bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 px-1 py-0.2 rounded text-[9px]">
                        {rule.strategy}{replacementText ? `: "${replacementText}"` : ''}
                      </span>
                    </div>
                    <div className="text-muted-foreground truncate">Pattern: <code>{rule.pattern}</code></div>
                  </div>
                );
              })
            )}
          </div>
        )}
      </div>

      {/* 2. Extraction Steps */}
      <div className="border border-border rounded-md overflow-hidden bg-background">
        <div
          onClick={() => toggleSection('extraction')}
          className="flex items-center justify-between p-2 bg-muted/30 cursor-pointer hover:bg-muted/50 transition-colors"
        >
          <div className="flex items-center gap-2 font-bold text-foreground">
            {expandedSections.extraction ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
            <Zap size={14} className="text-indigo-400" />
            <span>Extraction Steps ({parsedWorkflow.extractionSteps?.length || 0})</span>
          </div>
        </div>

        {expandedSections.extraction && (
          <div className="p-2 space-y-1 divide-y divide-border/40">
            {(parsedWorkflow.extractionSteps || []).length === 0 ? (
              <div className="text-muted-foreground italic p-1">No extraction steps configured.</div>
            ) : (
              parsedWorkflow.extractionSteps.map((step) => (
                <div key={step.id} className="pt-1 text-[11px] space-y-0.5">
                  <div className="flex justify-between items-center">
                    <span className="font-bold text-foreground">{step.name}</span>
                    {step.targetVariable && (
                      <span className="bg-primary/10 text-primary border border-primary/20 px-1 py-0.2 rounded text-[9px]">
                        → ${step.targetVariable}
                      </span>
                    )}
                  </div>
                  <div className="text-muted-foreground truncate">Pattern: <code>{step.pattern}</code></div>
                </div>
              ))
            )}
          </div>
        )}
      </div>

      {/* 3. Minification Settings */}
      <div className="border border-border rounded-md overflow-hidden bg-background">
        <div
          onClick={() => toggleSection('minify')}
          className="flex items-center justify-between p-2 bg-muted/30 cursor-pointer hover:bg-muted/50 transition-colors"
        >
          <div className="flex items-center gap-2 font-bold text-foreground">
            {expandedSections.minify ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
            <Scissors size={14} className="text-amber-500" />
            <span>Minify Options</span>
          </div>
        </div>

        {expandedSections.minify && (
          <div className="p-2 text-[11px] space-y-1">
            <div className="flex justify-between">
              <span>Strip Comments:</span>
              <strong className={parsedWorkflow.minify?.stripComments ? 'text-emerald-500' : 'text-muted-foreground'}>
                {parsedWorkflow.minify?.stripComments ? 'YES' : 'NO'}
              </strong>
            </div>
            <div className="flex justify-between">
              <span>Collapse Whitespace:</span>
              <strong className={parsedWorkflow.minify?.collapseWhitespace ? 'text-emerald-500' : 'text-muted-foreground'}>
                {parsedWorkflow.minify?.collapseWhitespace ? 'YES' : 'NO'}
              </strong>
            </div>
            <div className="flex justify-between">
              <span>Trim Lines:</span>
              <strong className={parsedWorkflow.minify?.trimLines ? 'text-emerald-500' : 'text-muted-foreground'}>
                {parsedWorkflow.minify?.trimLines ? 'YES' : 'NO'}
              </strong>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
EOF

# Build Webview Application
cd webview && npm run build

echo "✅ feat: Added 'replace' strategy support to anonymization rules with target replacement string processing!"
