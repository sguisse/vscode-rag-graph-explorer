import { useExporterProfiles } from "./use-exporter-profiles";
import { useState } from 'react';
import { useExporterStore } from '../store/useExporterStore';
import { fileExporterHistoryApiService } from '@/services/api/file-exporter-history-api.service.gen';
import { generateNewConfigName, generateDuplicateName } from '../utils/date-formatter';
import { logInfo } from '@/services/view/log-view.service.wrapper';

export function useHistoryBar() {
  const store = useExporterStore();
  const { selectProfile, freezeToggle, resetConfig, renameProfile, clearHistoryWithMode, addProfile } = useExporterProfiles();
  const [isEditing, setIsEditing] = useState<boolean>(false);
  const [isNewProfile, setIsNewProfile] = useState<boolean>(false);
  const [renameText, setRenameText] = useState<string>('');

  const handleToggleHistoryView = () => {
    const nextMode =
      store.historyViewMode === 'scope-current-repo'
        ? 'scope-all-repo'
        : 'scope-current-repo';
    logInfo('[useHistoryBar] Toggling history view mode to:', [nextMode]);
    store.setHistoryViewMode(nextMode);
  };

  const handleSelectProfile = async (id: string) => {
    logInfo('[useHistoryBar] handleSelectProfile starting...', [id]);
    setIsEditing(false);
    setIsNewProfile(false);
    await selectProfile(id);
  };

  const handleFreezeToggle = async (id: string) => {
    logInfo('[useHistoryBar] handleFreezeToggle starting...', [id]);
    await freezeToggle(id);
  };

  const handleResetConfig = () => {
    logInfo('[useHistoryBar] handleResetConfig starting...');
    setIsEditing(false);
    setIsNewProfile(false);
    resetConfig();
  };

  const handleStartRename = () => {
    logInfo('[useHistoryBar] handleStartRename triggered', [store.selectedProfileId]);
    const selected = store.historyList.find((h) => h.id === store.selectedProfileId);
    if (selected) {
      setRenameText(selected.display);
      setIsEditing(true);
      setIsNewProfile(false);
    }
  };

  const handleConfirmRename = async () => {
    logInfo('[useHistoryBar] handleConfirmRename starting...', [{ id: store.selectedProfileId, renameText }]);
    if (store.selectedProfileId && renameText.trim()) {
      await renameProfile(store.selectedProfileId, renameText.trim());
    }
    setIsEditing(false);
    setIsNewProfile(false);
  };

  const handleCancelRename = async () => {
    logInfo('[useHistoryBar] handleCancelRename starting...', [{ isNewProfile, selectedId: store.selectedProfileId }]);
    if (isNewProfile) {
      await clearHistoryWithMode('remove-selected-hard');
      await selectProfile('default');
    }
    setIsEditing(false);
    setIsNewProfile(false);
  };

  const handleDuplicateProfile = async (id: string) => {
    logInfo('[useHistoryBar] handleDuplicateProfile starting...', [id]);
    const wsName =
      store.currentRepo ||
      (store.workspaceRoot ? store.workspaceRoot.split(/[/\\]/).pop() || '' : 'workspace');

    let newName = '';
    if (id === 'default') {
      newName = generateNewConfigName(wsName);
    } else {
      const targetEntry = store.historyList.find((h) => h.id === id);
      const originalName = targetEntry ? targetEntry.display : 'Default Configuration';
      const existingNames = store.historyList.map((h) => h.display);
      newName = generateDuplicateName(originalName, existingNames);
    }

    const newId = await addProfile(store.config);
    if (newId) {
      await renameProfile(newId, newName);
      setRenameText(newName);
      setIsEditing(true);
      setIsNewProfile(true);
    }
  };

  const handleAddProfile = async () => {
    logInfo('[useHistoryBar] handleAddProfile starting...');
    const wsName =
      store.currentRepo ||
      (store.workspaceRoot ? store.workspaceRoot.split(/[/\\]/).pop() || '' : 'workspace');
    const newName = generateNewConfigName(wsName);

    const newId = await addProfile();
    if (newId) {
      await renameProfile(newId, newName);
      setRenameText(newName);
      setIsEditing(true);
      setIsNewProfile(true);
    }
  };

  const handleOpenDeleteModal = () => {
    logInfo('[useHistoryBar] handleOpenDeleteModal starting...', [store.selectedProfileId]);
    if (store.selectedProfileId !== 'default') {
      store.setModalState({ isDeleteModalOpen: true });
    }
  };

  const handleConfirmDelete = async () => {
    logInfo('[useHistoryBar] handleConfirmDelete starting...', [store.selectedProfileId]);
    store.setModalState({ isDeleteModalOpen: false });
    if (store.selectedProfileId !== 'default') {
      await clearHistoryWithMode('remove-selected-hard');
      await selectProfile('default');
    }
  };

  const handleCancelDelete = () => {
    logInfo('[useHistoryBar] handleCancelDelete starting...');
    store.setModalState({ isDeleteModalOpen: false });
  };

  const handleOpenFile = async () => {
    logInfo('[useHistoryBar] handleOpenFile starting...');
    try {
      await fileExporterHistoryApiService.openHistoryFile();
      logInfo('[useHistoryBar] handleOpenFile completed');
    } catch (err: any) {
      logInfo('[useHistoryBar] handleOpenFile error:', [err?.message || err]);
    }
  };

  const handleRevealFolder = async () => {
    logInfo('[useHistoryBar] handleRevealFolder starting...');
    try {
      await fileExporterHistoryApiService.revealHistoryFile();
      logInfo('[useHistoryBar] handleRevealFolder completed');
    } catch (err: any) {
      logInfo('[useHistoryBar] handleRevealFolder error:', [err?.message || err]);
    }
  };

  return {
    historyList: store.historyList,
    selectedProfileId: store.selectedProfileId,
    historyViewMode: store.historyViewMode,
    currentRepo: store.currentRepo,
    isEditing,
    renameText,
    setRenameText,
    isDeleteModalOpen: Boolean(store.modalState.isDeleteModalOpen),
    onToggleHistoryView: handleToggleHistoryView,
    onSelectProfile: handleSelectProfile,
    onFreezeToggle: handleFreezeToggle,
    onResetConfig: handleResetConfig,
    onStartRename: handleStartRename,
    onConfirmRename: handleConfirmRename,
    onCancelRename: handleCancelRename,
    onDuplicateProfile: handleDuplicateProfile,
    onAddProfile: handleAddProfile,
    onOpenFile: handleOpenFile,
    onRevealFolder: handleRevealFolder,
    onClearHistory: handleOpenDeleteModal,
    onConfirmDelete: handleConfirmDelete,
    onCancelDelete: handleCancelDelete,
  };
}
