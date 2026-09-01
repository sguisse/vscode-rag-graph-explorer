import React from 'react';
import { ContainerPanelHeader } from '@/_layout/ContainerPanelHeader';
import { TransformationScopePanel, TransformationScopeType, ReferenceFileInfo } from '../components/TransformationScopePanel';

interface TopPanelContainerProps {
  scope: TransformationScopeType;
  onScopeChange: (newScope: TransformationScopeType) => void;
  referenceFileInfo?: ReferenceFileInfo;
  isDirty?: boolean;
  hasPreviousFeature?: boolean;
  onValidate?: () => void;
  onClose?: () => void;
}

export const TopPanelContainer: React.FC<TopPanelContainerProps> = ({
  scope,
  onScopeChange,
  referenceFileInfo,
  isDirty,
  hasPreviousFeature,
  onValidate,
  onClose,
}) => {
  return (
    <div className="flex flex-col bg-background w-full min-w-0 h-full min-h-0 overflow-hidden">
      <ContainerPanelHeader title="Transformation Scope & Context" path="workspace.top" />
      <div className="flex-1 min-h-0">
        <TransformationScopePanel
          scope={scope}
          onScopeChange={onScopeChange}
          referenceFileInfo={referenceFileInfo}
          isDirty={isDirty}
          hasPreviousFeature={hasPreviousFeature}
          onValidate={onValidate}
          onClose={onClose}
        />
      </div>
    </div>
  );
};
