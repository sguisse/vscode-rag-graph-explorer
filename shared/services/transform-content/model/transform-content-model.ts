export type AnonymizationStrategy = 'mask' | 'hash' | 'uuid' | 'replace';

export interface TransformerWorkflow {
  id: string;
  name: string;
  description?: string;
  anonymizationRules: AnonymizationRule[];
  extractionSteps: RegexExtractionStep[];
  minify: MinifyOptions;
  outputTemplate: string;
  outputFormat: 'json' | 'yaml' | 'toml' | 'xml' | 'markdown' | 'plaintext';
}

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
  targetVariable?: string;
  replacement?: string;
  enabled: boolean;
}

export interface MinifyOptions {
  stripComments: boolean;
  collapseWhitespace: boolean;
  trimLines: boolean;
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

export interface TransformationResult {
  content: string;
  sizeKb: number;
  anonymizedText: string;
  extractedData: Record<string, string>;
  records: ExtractedTableRecord[];
  renderedOutput: string;
  metrics: PipelineExecutionMetrics;
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
