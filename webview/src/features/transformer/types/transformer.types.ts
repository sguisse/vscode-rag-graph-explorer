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
