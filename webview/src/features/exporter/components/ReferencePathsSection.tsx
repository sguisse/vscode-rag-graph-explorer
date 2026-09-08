import React from 'react';
import { HelpCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { PathsSection, PathsSectionProps } from './PathsSection';
import { fileExporterApiService } from '@/services/api/file-exporter-api.service.gen';

export type ReferencePathsSectionProps = Omit<PathsSectionProps, 'scopeType' | 'title' | 'tooltip'> & {
  onHelp?: () => void;
};

export const ReferencePathsSection: React.FC<ReferencePathsSectionProps> = ({
  extraHeaderActions,
  onHelp,
  showAddErrorStackFiles = false, // Bug icon hidden by default in Reference section
  ...props
}) => {
  const handleHelp = () => {
    if (onHelp) {
      onHelp();
    } else {
      fileExporterApiService.showNotification(
        'info',
        'Reference Paths: Provide supplementary docs, external SDKs, or context files for LLM prompt augmentation.'
      );
    }
  };

  const defaultExtraActions = (
    <>
      <Button
        size="icon-xs"
        variant="ghost"
        onClick={(e) => {
          e.stopPropagation();
          handleHelp();
        }}
        data-tooltip="Reference Paths Guidance & Help"
        className="h-5 w-5 cursor-pointer hover:bg-accent text-muted-foreground hover:text-foreground"
      >
        <HelpCircle size={12} />
      </Button>
      {extraHeaderActions}
    </>
  );

  return (
    <PathsSection
      scopeType="reference"
      title="📚 Reference Source Paths"
      tooltip="Reference documentation or sample files targeted for LLM context injection."
      extraHeaderActions={defaultExtraActions}
      showAddErrorStackFiles={showAddErrorStackFiles}
      {...props}
    />
  );
};

export default ReferencePathsSection;
