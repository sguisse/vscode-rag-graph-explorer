import React, { useRef, useState, useEffect } from 'react';
import { TopMiddleBottomPanel } from '@/components/app/top-middle-bottom-panel';
import { ResizableContainer } from '@/components/app/container/resizable-container';
import { useResizable } from '@/components/app/container/hooks/use-resizable';
import { ExportReportData, SingleScopeReportData } from '@/shared/services/file-exporter/model/file-exporter-model';
import { TokenEstimationPanel } from './TokenEstimationPanel';
import { ReportTablePanel } from './ReportTablePanel';
import { ReportTreePanel } from './ReportTreePanel';

export interface ReportTabProps {
  reportData: ExportReportData | SingleScopeReportData | null;
  onAppendExtension?: (ext: string, mode: 'inc' | 'exc') => void;
  onSetMaxFileSize?: (kb: number) => void;
  onExcludeTreePattern?: (pattern: string, isExt: boolean) => void;
  onCaptureTreePaths?: (paths: string[]) => void;
}

export const ReportTab: React.FC<ReportTabProps> = ({
  reportData,
  onAppendExtension,
  onSetMaxFileSize,
  onExcludeTreePattern,
  onCaptureTreePaths,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [initWidth, setInitWidth] = useState<number>(500);

  useEffect(() => {
    if (containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect();
      if (rect.width > 0) {
        setInitWidth(Math.floor(rect.width * 0.5));
      }
    }
  }, []);

  const [tableWidth, startTableResize] = useResizable(initWidth, 150, 1500, true, false);

  if (!reportData) {
    return (
      <div className="p-8 font-mono text-muted-foreground text-xs text-center italic">
        No export report available. Execute an export run to review metrics.
      </div>
    );
  }

  const topContent = (
    <div className="p-2 pb-1">
      <TokenEstimationPanel tokens={reportData.estimatedInputTokens || 0} />
    </div>
  );

  const middleContent = (
    <div ref={containerRef} className="p-2 pt-1 flex flex-row h-full min-h-0 w-full overflow-hidden">
      <ResizableContainer
        key={initWidth}
        id="panel-report-table-resizable"
        visible
        resizeHandle="right"
        onResizeStart={startTableResize}
        style={{ width: `${tableWidth}px` }}
        className="border-border border-r shrink-0 pr-2 h-full min-w-0"
      >
        <ReportTablePanel
          reportData={reportData}
          onAppendExtension={onAppendExtension}
          onSetMaxFileSize={onSetMaxFileSize}
        />
      </ResizableContainer>

      <div className="flex-1 min-w-0 h-full overflow-y-auto pl-2">
        <ReportTreePanel
          rootNode={reportData.tree_manifest?.root || null}
          onExcludePattern={onExcludeTreePattern}
          onCaptureSelectedPaths={onCaptureTreePaths}
        />
      </div>
    </div>
  );

  return (
    <TopMiddleBottomPanel
      id="panel-exporter-report-tab"
      className="w-full h-full min-h-0 overflow-hidden bg-background font-mono text-xs"
      top={topContent}
      middle={middleContent}
    />
  );
};

export default ReportTab;
