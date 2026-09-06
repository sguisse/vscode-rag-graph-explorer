import { useState } from 'react';
import { TreeManifestNode } from '@/shared/services/file-exporter/model/file-exporter-model';
import { fileExporterApiService } from '@/services/api/file-exporter-api.service.gen';
import { logInfo } from '@/services/view/log-view.service.wrapper';

interface UseReportTreeProps {
  onExcludePattern?: (pattern: string, isExt: boolean) => void;
  onCaptureSelectedPaths?: (paths: string[]) => void;
}

export function useReportTree({ onExcludePattern, onCaptureSelectedPaths }: UseReportTreeProps = {}) {
  const [searchQuery, setSearchQuery] = useState('');
  const [useRegex, setUseRegex] = useState(false);
  const [viewMode, setViewMode] = useState<'standard' | 'extension'>('standard');
  const [expandedKeys, setExpandedKeys] = useState<Record<string, boolean>>({});
  const [checkedKeys, setCheckedKeys] = useState<Record<string, boolean>>({});

  const toggleExpand = (pathKey: string) => {
    logInfo('[ReportTreePanel] toggleExpand handler triggered', [pathKey]);
    setExpandedKeys((prev) => ({ ...prev, [pathKey]: !prev[pathKey] }));
  };

  const toggleCheck = (pathKey: string, node: TreeManifestNode) => {
    logInfo('[ReportTreePanel] toggleCheck handler triggered', [pathKey]);
    const isChecked = !checkedKeys[pathKey];
    const newChecked = { ...checkedKeys };

    const updateChildChecks = (n: TreeManifestNode) => {
      newChecked[n.absolute_path] = isChecked;
      if (n.children) {
        Object.values(n.children).forEach(updateChildChecks);
      }
    };

    updateChildChecks(node);
    setCheckedKeys(newChecked);
  };

  const handleOpenFile = (path: string) => {
    logInfo('[ReportTreePanel] handleOpenFile handler triggered', [path]);
    fileExporterApiService.openPathAtCursor(path);
  };

  const handleRevealNode = (path: string) => {
    logInfo('[ReportTreePanel] handleRevealNode handler triggered', [path]);
    fileExporterApiService.openPathAtCursor(path);
  };

  const handleExcludePattern = (pattern: string, isExt: boolean) => {
    logInfo('[ReportTreePanel] handleExcludePattern handler triggered', [{ pattern, isExt }]);
    if (onExcludePattern) {
      onExcludePattern(pattern, isExt);
    }
  };

  const handleToggleViewMode = () => {
    const nextMode = viewMode === 'standard' ? 'extension' : 'standard';
    logInfo('[ReportTreePanel] handleToggleViewMode handler triggered', [nextMode]);
    setViewMode(nextMode);
  };

  const handleCaptureSelected = () => {
    logInfo('[ReportTreePanel] handleCaptureSelected handler triggered');
    const selected = Object.entries(checkedKeys)
      .filter(([_, v]) => v)
      .map(([k]) => k);
    if (onCaptureSelectedPaths) {
      onCaptureSelectedPaths(selected);
    }
  };

  return {
    searchQuery,
    setSearchQuery,
    useRegex,
    setUseRegex,
    viewMode,
    expandedKeys,
    checkedKeys,
    toggleExpand,
    toggleCheck,
    handleOpenFile,
    handleRevealNode,
    handleExcludePattern,
    handleToggleViewMode,
    handleCaptureSelected,
  };
}
