import { TransformerWorkflow } from "../../transform-content/model/transform-content-model";

export const REFERENCES_PROJECT_KEY = 'global-project-references';

export interface ReferenceItem {
  id: string;
  emoji: string;
  name: string;
  description: string;
  category: string;
  url: string;
  preSelected: boolean; // If user resets selection, if true it will be selected again
  sizeKb: number;
  addedAt?: string;
  updatedAt?: string;
  changeDetected?: number; // Expressed in % vs actual version
  transformer?: TransformerWorkflow;
  sizeKbAfterTransformation?: number;
}

export interface ReferenceFiles {
  originalContent: string;
  transformedContent?: string;
  tempContent?: string;
}
