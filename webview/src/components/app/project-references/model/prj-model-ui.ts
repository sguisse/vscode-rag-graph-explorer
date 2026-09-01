import { ReferenceItem } from '@/shared/services/reference/model/reference-model';

export type RefSortField = 'category' | 'preSelected' | 'name' | 'sizeKb' | 'sizeKbAfterTransformation' | 'updatedAt' | 'transformer';
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
  onTransformReference?: (reference: ReferenceItem) => void;
}
