import React from 'react';
import { logInfo } from '@/services/view/log-view.service.wrapper';

interface UseReportTableProps {
  onAppendExtension?: (ext: string, mode: 'inc' | 'exc') => void;
  onSetMaxFileSize?: (kb: number) => void;
}

export function useReportTable({ onAppendExtension, onSetMaxFileSize }: UseReportTableProps = {}) {
  const handleExtensionClick = (ext: string, e: React.MouseEvent) => {
    const mode = e.metaKey || e.ctrlKey ? 'exc' : 'inc';
    logInfo('[ReportTablePanel] handleExtensionClick handler triggered', [{ ext, mode }]);
    if (onAppendExtension) {
      onAppendExtension(ext, mode);
    }
  };

  const handleMaxFileSizeClick = (kb: number) => {
    logInfo('[ReportTablePanel] handleMaxFileSizeClick handler triggered', [kb]);
    if (onSetMaxFileSize) {
      onSetMaxFileSize(kb);
    }
  };

  return {
    handleExtensionClick,
    handleMaxFileSizeClick,
  };
}
