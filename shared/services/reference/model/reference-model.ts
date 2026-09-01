import { TransformerWorkflow } from "../../transform-content/model/transform-content-model";

export const REFERENCES_PROJECT_KEY = 'global-project-references';

export interface ReferenceItem {
  id: string;
  emoji: string;
  name: string;
  description: string;
  category: string;
  url: string;
  preSelected: boolean;
  sizeKb: number;
  content?: string;
  addedAt?: string;
  updatedAt?: string;
  changeDetected?: number; // Expressed in % vs actual version
  transformer?: TransformerWorkflow;
  contentAfterTransformation?: string;
  sizeKbAfterTransformation?: number;
}
