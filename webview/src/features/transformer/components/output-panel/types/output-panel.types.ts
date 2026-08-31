import { ExtractedTableRecord } from "@/shared/services/transform-content/model/transform-content-model";

export type OutputPanelTab = 'template' | 'preview';

export interface OutputPanelProps {
  renderedOutput: string;
  outputFormat: string;
  outputTemplate: string;
  records: ExtractedTableRecord[];
  onCopy: () => void;
  onUpdateOutputTemplate: (template: string) => void;
  onUpdateOutputFormat: (format: string) => void;
  templateCursorPos: number | null;
  setTemplateCursorPos: (pos: number | null) => void;
  onSelectVariable?: (variableName: string) => void;
}
