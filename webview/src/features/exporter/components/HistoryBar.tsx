import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Lock, Unlock, RotateCcw, Edit2, Copy, Plus, FileText, FolderOpen, Trash2 } from 'lucide-react';
import { HistoryEntry, HistoryViewMode } from '@/shared/services/file-exporter/model/file-exporter-model';
import { DeleteProfileDialog } from './DeleteProfileDialog';
import { useExporterStore } from '../store/useExporterStore';
import { isConfigDirty } from '../utils/config-dirty-checker';
import { logInfo } from '@/services/view/log-view.service.wrapper';

interface HistoryBarProps {
  historyList: HistoryEntry[];
  selectedProfileId: string;
  historyViewMode?: HistoryViewMode;
  currentRepo?: string;
  isEditing?: boolean;
  renameText?: string;
  setRenameText?: (text: string) => void;
  isDeleteModalOpen?: boolean;
  onToggleHistoryView?: () => void;
  onSelectProfile: (id: string) => void;
  onFreezeToggle: (id: string) => void;
  onResetConfig: () => void;
  onStartRename?: () => void;
  onConfirmRename?: () => void;
  onCancelRename?: () => void;
  onRenameProfile?: (id: string, newName: string) => void;
  onDuplicateProfile: (id: string) => void;
  onAddProfile: () => void;
  onOpenFile: () => void;
  onRevealFolder: () => void;
  onClearHistory: () => void;
  onConfirmDelete?: () => void;
  onCancelDelete?: () => void;
}

export const HistoryBar: React.FC<HistoryBarProps> = ({
  historyList,
  selectedProfileId,
  historyViewMode = 'scope-current-repo',
  currentRepo = '',
  isEditing = false,
  renameText = '',
  setRenameText,
  isDeleteModalOpen = false,
  onToggleHistoryView,
  onSelectProfile,
  onFreezeToggle,
  onResetConfig,
  onStartRename,
  onConfirmRename,
  onCancelRename,
  onDuplicateProfile,
  onAddProfile,
  onOpenFile,
  onRevealFolder,
  onClearHistory,
  onConfirmDelete,
  onCancelDelete,
}) => {
  const currentConfig = useExporterStore((s) => s.config);
  const defaultConfig = useExporterStore((s) => s.defaultConfig);

  const selectedEntry = historyList.find((h) => h.id === selectedProfileId);
  const isDefault = selectedProfileId === 'default';

  const targetSavedConfig = isDefault ? defaultConfig : selectedEntry?.config;
  const isDirty = isConfigDirty(currentConfig, targetSavedConfig);

  const filteredHistoryList = historyList.filter((item) => {
    if (historyViewMode === 'scope-current-repo' && currentRepo) {
      return !item.repo || item.repo === currentRepo;
    }
    return true;
  });

  const handleToggleHistoryView = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    logInfo('[HistoryBar] onToggleHistoryView handler triggered');
    if (onToggleHistoryView) onToggleHistoryView();
  };

  const handleSelectProfile = (id: string) => {
    logInfo('[HistoryBar] onSelectProfile handler triggered', [id]);
    onSelectProfile(id);
  };

  const handleFreezeToggle = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    logInfo('[HistoryBar] onFreezeToggle handler triggered', [selectedProfileId]);
    onFreezeToggle(selectedProfileId);
  };

  const handleResetConfig = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    logInfo('[HistoryBar] onResetConfig handler triggered', [selectedProfileId]);
    onResetConfig();
  };

  const handleStartRename = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    logInfo('[HistoryBar] handleStartRename triggered', [selectedProfileId]);
    if (onStartRename) onStartRename();
  };

  const handleDuplicateProfile = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    logInfo('[HistoryBar] onDuplicateProfile handler triggered', [selectedProfileId]);
    onDuplicateProfile(selectedProfileId);
  };

  const handleAddProfile = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    logInfo('[HistoryBar] onAddProfile handler triggered');
    onAddProfile();
  };

  const handleOpenFile = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    logInfo('[HistoryBar] onOpenFile handler triggered');
    onOpenFile();
  };

  const handleRevealFolder = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    logInfo('[HistoryBar] onRevealFolder handler triggered');
    onRevealFolder();
  };

  const handleClearHistory = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    logInfo('[HistoryBar] onClearHistory handler triggered');
    onClearHistory();
  };

  return (
    <>
      <div className="flex items-center gap-1.5 bg-card px-2 w-full min-w-0 font-mono text-xs select-none">
        <Button
          type="button"
          size="icon-xs"
          variant="ghost"
          onClick={handleToggleHistoryView}
          data-tooltip={`Toggle history scope:<br/> - 🏠 Current Repo<br/> - 🌐 All Repos`}
        >
          {historyViewMode === 'scope-current-repo' ? '🏠' : '🌐'}
        </Button>

        <span className="font-bold text-[11px] text-foreground shrink-0">Profile:</span>

        {isEditing ? (
          <Input
            value={renameText}
            onChange={(e) => setRenameText?.(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') onConfirmRename?.();
              if (e.key === 'Escape') onCancelRename?.();
            }}
            onBlur={() => onConfirmRename?.()}
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
            <SelectTrigger
              className={`flex-1 h-7 font-mono text-xs transition-colors ${
                isDirty
                  ? 'bg-amber-500/20 border-amber-500/50 text-amber-700 dark:text-amber-300 font-semibold'
                  : 'bg-background'
              }`}
              data-tooltip={isDirty ? '⚠️ Configuration has unsaved changes vs stored profile' : undefined}
            >
              <SelectValue placeholder="Select Configuration Profile...">
                {selectedEntry ? selectedEntry.display : 'Default Configuration'}
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="default">Default Configuration</SelectItem>
              {filteredHistoryList.map((entry) => (
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
              type="button"
              size="icon-xs"
              variant="ghost"
              onClick={handleFreezeToggle}
              data-tooltip={selectedEntry?.frozen ? 'Unfreeze Profile' : 'Freeze Profile'}
            >
              {selectedEntry?.frozen ? <Lock size={13} className="text-amber-500" /> : <Unlock size={13} />}
            </Button>
          )}

          <Button
            type="button"
            size="icon-xs"
            variant="ghost"
            onClick={handleResetConfig}
            data-tooltip="Reset Configuration"
          >
            <RotateCcw size={13} />
          </Button>

          {!isDefault && !selectedEntry?.frozen && (
            <Button
              type="button"
              size="icon-xs"
              variant="ghost"
              onClick={handleStartRename}
              data-tooltip="Rename Profile"
            >
              <Edit2 size={13} />
            </Button>
          )}

          <Button
            type="button"
            size="icon-xs"
            variant="ghost"
            onClick={handleDuplicateProfile}
            data-tooltip="Duplicate current screen configuration in memory into a new profile"
          >
            <Copy size={13} />
          </Button>

          <Button
            type="button"
            size="icon-xs"
            variant="ghost"
            onClick={handleAddProfile}
            data-tooltip="Create a new profile from default configuration settings"
          >
            <Plus size={13} />
          </Button>

          <div className="mx-0.5 bg-border w-[1px] h-4" />

          <Button
            type="button"
            size="icon-xs"
            variant="ghost"
            onClick={handleOpenFile}
            data-tooltip="Open History File"
          >
            <FileText size={13} />
          </Button>

          <Button
            type="button"
            size="icon-xs"
            variant="ghost"
            onClick={handleRevealFolder}
            data-tooltip="Reveal History Folder"
          >
            <FolderOpen size={13} />
          </Button>

          <Button
            type="button"
            size="icon-xs"
            variant="ghost"
            onClick={handleClearHistory}
            disabled={isDefault}
            data-tooltip={isDefault ? 'Default configuration cannot be deleted' : 'Delete selected profile configuration'}
            className="hover:text-destructive disabled:opacity-30 disabled:cursor-not-allowed"
          >
            <Trash2 size={13} />
          </Button>
        </div>
      </div>

      <DeleteProfileDialog
        isOpen={isDeleteModalOpen}
        profileName={selectedEntry?.display}
        onConfirm={() => {
          logInfo('[HistoryBar] Delete profile confirmed');
          if (onConfirmDelete) onConfirmDelete();
        }}
        onCancel={() => {
          logInfo('[HistoryBar] Delete profile cancelled');
          if (onCancelDelete) onCancelDelete();
        }}
      />
    </>
  );
};

export default HistoryBar;
