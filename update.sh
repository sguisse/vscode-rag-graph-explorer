#!/usr/bin/env bash
set -e

# Variable declaration for safe backtick handling
BTICK=$(printf '\x60')
TRIPLE_TICK=$(printf '\x60\x60\x60')

echo "🚀 Updating DestinationSection badge to Amber with non-existing directory warning tooltip..."

mkdir -p webview/src/features/exporter/components

cat << 'EOF' > webview/src/features/exporter/components/DestinationSection.tsx
import React, { useState, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Copy, FolderOpen, Trash2 } from 'lucide-react';
import { CollapsibleCard, BadgeObject } from '@/components/ui/collapsible-card';
import { useExporterStore } from '../store/useExporterStore';
import { PathMappingService } from '../utils/path-resolver';
import { fileSystemApiService } from '@/services/api/file-system-api.service.gen';
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
  const workspaceRoot = useExporterStore((s) => s.workspaceRoot);
  const [destExists, setDestExists] = useState<boolean>(true);

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
  const absDest = PathMappingService.resolveToAbsolute(formattedDest, workspaceRoot);

  useEffect(() => {
    if (!absDest || !absDest.trim()) {
      setDestExists(false);
      return;
    }

    fileSystemApiService
      .getInvalidPaths([absDest], workspaceRoot)
      .then((invalid) => {
        const isInvalid = Boolean(invalid && invalid.length > 0);
        setDestExists(!isInvalid);
      })
      .catch(() => {
        setDestExists(true);
      });
  }, [absDest, workspaceRoot]);

  const normDest = absDest.replace(/\\/g, '/');
  const normWs = workspaceRoot ? workspaceRoot.replace(/\\/g, '/').replace(/\/+$/, '') : '';
  const isExternal = Boolean(normWs && !normDest.startsWith(normWs));

  let tooltip = formattedDest;
  if (!destExists) {
    tooltip = `⚠️ Warning because you have defined an non existing folder. <br> It will be created automatically`;
  } else if (isExternal) {
    tooltip = `⚠️ Warning: You reference a destination directory outside the current workspace: ${absDest}`;
  }

  const isWarning = !destExists || isExternal;

  const badgeClassName = isWarning
    ? 'bg-amber-500/10 text-amber-600 border-amber-500/30 font-semibold [direction:rtl] text-left w-full min-w-0 truncate'
    : 'bg-primary/10 text-primary border-primary/20 [direction:rtl] text-left w-full min-w-0 truncate';

  const summaryBadges: BadgeObject[] = [
    {
      label: formattedDest,
      tooltip,
      className: badgeClassName,
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
EOF

echo "✅ feat(exporter): 🎨 updated DestinationSection badge to Amber with non-existing directory warning tooltip!"
