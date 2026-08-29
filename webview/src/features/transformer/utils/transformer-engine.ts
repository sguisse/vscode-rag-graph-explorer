import {
  TransformerWorkflow,
  ExtractedTableRecord,
  PipelineExecutionMetrics,
} from '../types/transformer.types';

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
