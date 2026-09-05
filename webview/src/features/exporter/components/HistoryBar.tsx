import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Lock, Unlock, RotateCcw, Edit2, Copy, Plus, FileText, FolderOpen, Trash2 } from 'lucide-react';
import { HistoryEntry } from '@/shared/services/file-exporter/model/file-exporter-model';
import { logInfo } from '../utils/log-info';

interface HistoryBarProps {
  historyList: HistoryEntry[];
  selectedProfileId: string;
  onSelectProfile: (id: string) => void;
  onFreezeToggle: (id: string) => void;
  onResetConfig: () => void;
  onRenameProfile: (id: string, newName: string) => void;
  onDuplicateProfile: (id: string) => void;
  onAddProfile: () => void;
  onOpenFile: () => void;
  onRevealFolder: () => void;
  onClearHistory: () => void;
}

export const HistoryBar: React.FC<HistoryBarProps> = ({
  historyList,
  selectedProfileId,
  onSelectProfile,
  onFreezeToggle,
  onResetConfig,
  onRenameProfile,
  onDuplicateProfile,
  onAddProfile,
  onOpenFile,
  onRevealFolder,
  onClearHistory,
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [renameText, setRenameText] = useState('');

  const selectedEntry = historyList.find((h) => h.id === selectedProfileId);
  const isDefault = selectedProfileId === 'default';

  const handleSelectProfile = (id: string) => {
    logInfo('[HistoryBar] onSelectProfile handler triggered', id);
    onSelectProfile(id);
  };

  const handleFreezeToggle = () => {
    logInfo('[HistoryBar] onFreezeToggle handler triggered', selectedProfileId);
    onFreezeToggle(selectedProfileId);
  };

  const handleResetConfig = () => {
    logInfo('[HistoryBar] onResetConfig handler triggered', selectedProfileId);
    onResetConfig();
  };

  const handleStartRename = () => {
    logInfo('[HistoryBar] handleStartRename triggered', selectedProfileId);
    if (selectedEntry) {
      setRenameText(selectedEntry.display);
      setIsEditing(true);
    }
  };

  const handleConfirmRename = () => {
    logInfo('[HistoryBar] handleConfirmRename triggered', { selectedProfileId, renameText });
    if (selectedProfileId && renameText.trim()) {
      onRenameProfile(selectedProfileId, renameText.trim());
    }
    setIsEditing(false);
  };

  const handleDuplicateProfile = () => {
    logInfo('[HistoryBar] onDuplicateProfile handler triggered', selectedProfileId);
    onDuplicateProfile(selectedProfileId);
  };

  const handleAddProfile = () => {
    logInfo('[HistoryBar] onAddProfile handler triggered');
    onAddProfile();
  };

  const handleOpenFile = () => {
    logInfo('[HistoryBar] onOpenFile handler triggered');
    onOpenFile();
  };

  const handleRevealFolder = () => {
    logInfo('[HistoryBar] onRevealFolder handler triggered');
    onRevealFolder();
  };

  const handleClearHistory = () => {
    logInfo('[HistoryBar] onClearHistory handler triggered');
    onClearHistory();
  };

  return (
    <div className="flex items-center gap-1.5 bg-card px-2 w-full min-w-0 font-mono text-xs select-none">
      <span className="font-bold text-[11px] text-foreground shrink-0">Profile:</span>

      {isEditing ? (
        <Input
          value={renameText}
          onChange={(e) => setRenameText(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') handleConfirmRename();
            if (e.key === 'Escape') setIsEditing(false);
          }}
          className="flex-1 h-7 font-mono text-xs"
          autoFocus
        />
      ) : (
        <Select
          value={selectedProfileId}
          onValueChange={(val: string | null) => {
            if (val) handleSelectProfile(val);
          }}
        >
          <SelectTrigger className="flex-1 bg-background h-7 font-mono text-xs">
            <SelectValue placeholder="Select Configuration Profile..." />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="default">Default Configuration</SelectItem>
            {historyList.map((entry) => (
              <SelectItem key={entry.id} value={entry.id}>
                {entry.frozen ? '🔒 ' : ''}{entry.display}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      )}

      <div className="flex items-center gap-1 shrink-0">
        {!isDefault && (
          <Button
            size="icon-xs"
            variant="ghost"
            onClick={handleFreezeToggle}
            data-tooltip={selectedEntry?.frozen ? 'Unfreeze Profile' : 'Freeze Profile'}
          >
            {selectedEntry?.frozen ? <Lock size={13} className="text-amber-500" /> : <Unlock size={13} />}
          </Button>
        )}

        <Button
          size="icon-xs"
          variant="ghost"
          onClick={handleResetConfig}
          data-tooltip="Reset Configuration"
        >
          <RotateCcw size={13} />
        </Button>

        {!isDefault && !selectedEntry?.frozen && (
          <Button
            size="icon-xs"
            variant="ghost"
            onClick={handleStartRename}
            data-tooltip="Rename Profile"
          >
            <Edit2 size={13} />
          </Button>
        )}

        <Button
          size="icon-xs"
          variant="ghost"
          onClick={handleDuplicateProfile}
          data-tooltip="Duplicate Configuration"
        >
          <Copy size={13} />
        </Button>

        <Button
          size="icon-xs"
          variant="ghost"
          onClick={handleAddProfile}
          data-tooltip="New Blank Profile"
        >
          <Plus size={13} />
        </Button>

        <div className="mx-0.5 bg-border w-[1px] h-4" />

        <Button
          size="icon-xs"
          variant="ghost"
          onClick={handleOpenFile}
          data-tooltip="Open History File"
        >
          <FileText size={13} />
        </Button>

        <Button
          size="icon-xs"
          variant="ghost"
          onClick={handleRevealFolder}
          data-tooltip="Reveal History Folder"
        >
          <FolderOpen size={13} />
        </Button>

        <Button
          size="icon-xs"
          variant="ghost"
          onClick={handleClearHistory}
          data-tooltip="Clear History Entries"
          className="hover:text-destructive"
        >
          <Trash2 size={13} />
        </Button>
      </div>
    </div>
  );
};

export default HistoryBar;
