import React, { useState } from 'react';
import { useBookmarksStore } from '../../store/useBookmarksStore';
import { useTreeStore } from '../../store/useTreeStore';
import { BookmarkTreeview } from './BookmarkTreeview';

export const SidebarRightPanel: React.FC = () => {
  const { isSidebarOpen } = useBookmarksStore();
  const { treeNodes, setTreeNodes } = useTreeStore();
  const [sidebarWidth, setSidebarWidth] = useState(320);

  if (!isSidebarOpen) return null;

  const startResizing = (e: React.MouseEvent) => {
    e.preventDefault();
    const startX = e.clientX;
    const startWidth = sidebarWidth;

    const doDrag = (moveEvent: MouseEvent) => {
      const delta = startX - moveEvent.clientX;
      const newWidth = Math.max(260, Math.min(550, startWidth + delta));
      setSidebarWidth(newWidth);
    };

    const stopDrag = () => {
      window.removeEventListener('mousemove', doDrag);
      window.removeEventListener('mouseup', stopDrag);
    };

    window.addEventListener('mousemove', doDrag);
    window.addEventListener('mouseup', stopDrag);
  };

  return (
    <>
      <div
        onMouseDown={startResizing}
        className="w-1.5 bg-slate-200 dark:bg-slate-800 hover:bg-brand-500 cursor-col-resize transition-colors z-10 flex-shrink-0"
        title="Drag to resize sidebar"
      />
      <aside
        style={{ width: `${sidebarWidth}px` }}
        className="flex-shrink-0 h-full overflow-hidden"
      >
        <BookmarkTreeview
          treeNodes={treeNodes}
          onTreeNodesChange={setTreeNodes}
          onImportChromeHtml={(parsed) => setTreeNodes([...treeNodes, ...parsed])}
        />
      </aside>
    </>
  );
};
