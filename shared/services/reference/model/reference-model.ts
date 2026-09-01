import { TransformerWorkflow } from "../../transform-content/model/transform-content-model";

export const REFERENCES_PROJECT_KEY = 'global-project-references';

export interface ReferenceItem {
  id: string;
  emoji: string;
  name: string;
  description: string;
  category: string;
  url: string;
  preSelected: boolean; // If user reset his selection, if true it will be selected again, if false it will be unselected
  sizeKb: number;
  content?: string;
  addedAt?: string;
  updatedAt?: string;
  changeDetected?: number; // Expressed in % vs actual version
  transformer?: TransformerWorkflow;
  contentAfterTransformation?: string;
  sizeKbAfterTransformation?: number;
}
