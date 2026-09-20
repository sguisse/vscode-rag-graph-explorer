import React from 'react';
import { Copy, X, Check } from 'lucide-react';

interface DuplicateResolverModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const DuplicateResolverModal: React.FC<DuplicateResolverModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="w-full max-w-xl bg-white dark:bg-slate-900 rounded-xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Copy className="w-5 h-5 text-amber-500"/>
            <h3 className="font-bold text-base text-slate-900 dark:text-slate-100">Duplicate URL Resolver</h3>
          </div>
          <button type="button" onClick={onClose} className="p-1 rounded-md text-slate-400 hover:text-slate-600 dark:hover:text-slate-200">
            <X className="w-4 h-4"/>
          </button>
        </div>
        <div className="p-5 text-center">
          <div className="w-12 h-12 bg-emerald-100 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 rounded-full flex items-center justify-center mx-auto mb-3">
             <Check className="w-6 h-6"/>
          </div>
          <h4 className="text-sm font-semibold text-slate-800 dark:text-slate-200 mb-1">No Duplicates Found</h4>
          <p className="text-xs text-slate-500">Your workspace is perfectly organized across all tabs and cards.</p>
        </div>
        <div className="px-5 py-3 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 flex items-center justify-end">
          <button onClick={onClose} className="px-4 py-1.5 rounded-lg text-xs font-medium bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-300 dark:hover:bg-slate-700 transition-colors">Close</button>
        </div>
      </div>
    </div>
  );
};
