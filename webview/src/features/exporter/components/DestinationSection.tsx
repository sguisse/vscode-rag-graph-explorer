import React from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Copy, FolderOpen, Trash2 } from 'lucide-react';
import { CollapsibleCard, BadgeObject } from '@/components/ui/collapsible-card';
import { logInfo } from '../utils/log-info';

interface DestinationSectionProps {
  destDir: string;
  isOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
  onChangeDestDir: (dir: string) => void;
  onCopyLatestFiles: () => void;
  onRevealDestDir: () => void;
  onClearDestDir: () => void;
}

export const DestinationSection: React.FC<DestinationSectionProps> = ({
  destDir,
  isOpen,
  onOpenChange,
  onChangeDestDir,
  onCopyLatestFiles,
  onRevealDestDir,
  onClearDestDir,
}) => {
  const handleCopyLatestFiles = () => {
    logInfo('[DestinationSection] onCopyLatestFiles handler triggered', destDir);
    onCopyLatestFiles();
  };

  const handleRevealDestDir = () => {
    logInfo('[DestinationSection] onRevealDestDir handler triggered', destDir);
    onRevealDestDir();
  };

  const handleClearDestDir = () => {
    logInfo('[DestinationSection] onClearDestDir handler triggered', destDir);
    onClearDestDir();
  };

  const formattedDest = destDir || 'Default directory';

  const summaryBadges: BadgeObject[] = [
    {
      label: formattedDest,
      tooltip: formattedDest,
      className: 'bg-primary/10 text-primary border-primary/20 [direction:rtl] text-left w-full min-w-0 truncate',
    },
  ];

  return (
    <CollapsibleCard
      id="block-destination"
      title="💾 Destination Directory"
      tooltip="Absolute distribution path folder location where structured files will be generated."
      summaryBadges={summaryBadges}
      defaultOpen={true}
      isOpen={isOpen}
      onOpenChange={onOpenChange}
      className="w-full min-w-0 shrink-0"
    >
      <div className="flex gap-1.5 items-center font-mono text-xs">
        <Input
          value={destDir}
          onChange={(e) => onChangeDestDir(e.target.value)}
          placeholder="/absolute/path/to/exported-files"
          className="h-7 text-xs font-mono flex-1 bg-background"
        />

        <Button
          size="icon-xs"
          variant="outline"
          onClick={handleCopyLatestFiles}
          title="Copy Last Exported Files to Clipboard"
        >
          <Copy size={13} />
        </Button>

        <Button
          size="icon-xs"
          variant="outline"
          onClick={handleRevealDestDir}
          title="Reveal Folder in OS Explorer"
        >
          <FolderOpen size={13} />
        </Button>

        <Button
          size="icon-xs"
          variant="outline"
          onClick={handleClearDestDir}
          title="Clean Destination Folder Contents"
          className="hover:text-destructive"
        >
          <Trash2 size={13} />
        </Button>
      </div>
    </CollapsibleCard>
  );
};

export default DestinationSection;
