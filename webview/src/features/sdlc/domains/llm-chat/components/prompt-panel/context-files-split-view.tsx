import React, { useState, useRef } from 'react';
import { Code2, FileText, GripVertical } from 'lucide-react';
import { FileListView } from './file-list-view';
import { FilesContextPanel } from '@/features/sdlc/domains/codebase-context/components/files-selection/files-context';
import { ReferenceItem } from '@/shared/services/reference/model/reference-model';

export interface ContextFilesSplitViewProps {
  sortedReferences: ReferenceItem[];
  selectedRefIds: Set<string>;
  selectedReferencesCount: number;
  totalReferencesCount: number;
  onToggleReference: (item: ReferenceItem) => void;
  onSelectAllReferences: () => void;
  onDeselectAllReferences: () => void;
}

export const ContextFilesSplitView: React.FC<ContextFilesSplitViewProps> = ({
  sortedReferences,
  selectedRefIds,
  selectedReferencesCount,
  totalReferencesCount,
  onToggleReference,
  onSelectAllReferences,
  onDeselectAllReferences,
}) => {
  // Width percentage state for left panel (Codebase Files)
  const [leftWidthPercent, setLeftWidthPercentage] = useState<number>(50);
  const containerRef = useRef<HTMLDivElement>(null);
  const isDraggingRef = useRef<boolean>(false);

  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    isDraggingRef.current = true;

    const handleMouseMove = (moveEvent: MouseEvent) => {
      if (!isDraggingRef.current || !containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      const offsetX = moveEvent.clientX - rect.left;
      const percentage = Math.max(20, Math.min(80, (offsetX / rect.width) * 100));
      setLeftWidthPercentage(percentage);
    };

    const handleMouseUp = () => {
      isDraggingRef.current = false;
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
  };

  const refItems = sortedReferences.map((refItem) => ({
    id: refItem.id,
    name: refItem.name,
    category: refItem.category || 'General',
    emoji: refItem.emoji || '📄',
    sizeKb: refItem.sizeKb,
    isSelected: selectedRefIds.has(refItem.id),
  }));

  return (
    <div ref={containerRef} className="flex flex-row w-full h-full min-h-0 overflow-hidden relative">
      {/* Left Panel: Codebase Selected Files */}
      <div style={{ width: `${leftWidthPercent}%` }} className="flex min-w-0 h-full overflow-hidden">
        <FileListView
          title="Codebase Selected Files"
          icon={<Code2 size={12} className="text-indigo-400" />}
          customContent={<FilesContextPanel />}
        />
      </div>

      {/* Draggable Vertical Splitter Bar */}
      <div
        onMouseDown={handleMouseDown}
        className="group flex justify-center items-center w-2 hover:bg-primary/20 bg-muted/40 cursor-col-resize shrink-0 transition-colors z-10"
        data-tooltip="Drag to resize Codebase vs Reference Files width"
      >
        <GripVertical size={12} className="text-muted-foreground group-hover:text-primary" />
      </div>

      {/* Right Panel: Reference Files */}
      <div style={{ width: `${100 - leftWidthPercent}%` }} className="flex min-w-0 h-full overflow-hidden">
        <FileListView
          title="Reference Files"
          icon={<FileText size={12} className="text-primary" />}
          badgeText={`${selectedReferencesCount}/${totalReferencesCount}`}
          items={refItems}
          onToggleItem={(item) => {
            const orig = sortedReferences.find((r) => r.id === item.id);
            if (orig) onToggleReference(orig);
          }}
          onSelectAll={onSelectAllReferences}
          onDeselectAll={onDeselectAllReferences}
          emptyMessage="No reference files available."
        />
      </div>
    </div>
  );
};

export default ContextFilesSplitView;
