export type OutputPanelTab = 'template' | 'preview';

export interface OutputPanelProps {
  renderedOutput: string;
  outputFormat: string;
  outputTemplate: string;
  onCopy: () => void;
  onUpdateOutputTemplate: (template: string) => void;
  onUpdateOutputFormat: (format: string) => void;
}
