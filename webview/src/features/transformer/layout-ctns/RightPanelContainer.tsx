import React from 'react';
import { ContainerPanelHeader } from '@/_layout/ContainerPanelHeader';
import { OutputPanel } from '../components/output-panel/OutputPanel';
import { ExtractedTableRecord } from '@/shared/services/transform-content/model/transform-content-model';

interface RightPanelContainerProps {
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

export const RightPanelContainer: React.FC<RightPanelContainerProps> = (props) => {
  return (
    <div className="flex flex-col bg-card w-full min-w-0 h-full min-h-0 overflow-hidden">
      <ContainerPanelHeader title="Pipeline Output Preview" path="workspace.right" />
      <div className="flex-1 min-h-0 overflow-hidden">
        <OutputPanel {...props} />
      </div>
    </div>
  );
};
