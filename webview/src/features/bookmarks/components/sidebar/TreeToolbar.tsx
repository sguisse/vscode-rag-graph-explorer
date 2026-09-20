import React, { useRef } from 'react';
import { Search, Upload, X } from 'lucide-react';
import { parseNetscapeHtml } from '../../utils/chromeBookmarkParser';
import { TreeBookmarkNode } from '../../types/bookmarks.types';

interface TreeToolbarProps {
  searchTerm: string;
  setSearchTerm: (term: string) => void;
  onImportChromeHtml: (parsed: TreeBookmarkNode[]) => void;
  setExpandedFolders: (updater: (prev: Set<string>) => Set<string>) => void;
  importStatus: { type: string, message: string } | null;
  setImportStatus: (status: { type: string, message: string } | null) => void;
}

export const TreeToolbar: React.FC<TreeToolbarProps> = ({
  searchTerm, setSearchTerm, onImportChromeHtml, setExpandedFolders, importStatus, setImportStatus
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const html = event.target?.result as string;
        if (typeof html === 'string') {
          const { nodes, expandIds, totalCount } = parseNetscapeHtml(html);
          if (nodes && nodes.length > 0) {
            setExpandedFolders(prev => {
              const next = new Set(prev);
              expandIds.forEach(id => next.add(id));
              return next;
            });
            onImportChromeHtml(nodes);
            setImportStatus({ type: 'success', message: `Imported ${totalCount} bookmarks!` });
            setTimeout(() => setImportStatus(null), 4500);
          } else {
            setImportStatus({ type: 'warning', message: 'No bookmarks found.' });
            setTimeout(() => setImportStatus(null), 4000);
          }
        }
      } catch (err) {
        setImportStatus({ type: 'error', message: 'Failed to parse HTML.' });
        setTimeout(() => setImportStatus(null), 4000);
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  return (
    <div className="p-3 border-b border-slate-200 dark:border-slate-800">
      <div className="flex items-center justify-between mb-2">
        <h4 className="font-semibold text-xs tracking-wider uppercase text-slate-500 dark:text-slate-400">
          Chrome Treeview
        </h4>
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          className="flex items-center gap-1 text-xs font-semibold text-brand-600 bg-brand-50 hover:bg-brand-100 px-2.5 py-1 rounded-md transition-colors"
        >
          <Upload className="w-3.5 h-3.5"/>
          <span>Import</span>
        </button>
        <input
          ref={fileInputRef}
          type="file"
          accept=".html"
          className="hidden"
          onChange={handleFileChange}
        />
      </div>
      <div className="relative">
        <Search className="absolute inset-y-0 left-2 top-1.5 w-3 h-3 text-slate-400 pointer-events-none"/>
        <input
          type="text"
          placeholder="Filter tree nodes..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full pl-8 pr-2.5 py-1 text-xs rounded-md bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
        />
      </div>
      {importStatus && (
        <div className={`mt-2 px-2.5 py-1.5 rounded-md text-[11px] font-medium flex justify-between ${
          importStatus.type === 'success' ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'
        }`}>
          <span>{importStatus.message}</span>
          <button onClick={() => setImportStatus(null)}><X className="w-3 h-3"/></button>
        </div>
      )}
    </div>
  );
};
