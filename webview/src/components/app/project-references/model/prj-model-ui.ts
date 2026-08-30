import { TransformerWorkflow } from '@/features/transformer/model/transformer.model';

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
}

export type RefSortField = 'category' | 'preSelected' | 'name' | 'sizeKb' | 'updatedAt' | 'transformer';
export type RefSortOrder = 'asc' | 'desc';

export interface RefSortRule {
  field: RefSortField;
  order: RefSortOrder;
}

export type ProjectReferencesViewMode = 'User' | 'Administrator';

export interface ProjectReferencesPanelProps {
  localDocumentStorage?: string;
  viewMode?: ProjectReferencesViewMode;
  collapsibleParentIncluded?: boolean;
  className?: string;
}
