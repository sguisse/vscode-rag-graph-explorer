import React from 'react';
import { History, X } from 'lucide-react';

interface AuditHistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AuditHistoryModal: React.FC<AuditHistoryModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="w-full max-w-lg bg-white dark:bg-slate-900 rounded-xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <History className="w-5 h-5 text-indigo-500"/>
            <h3 className="font-bold text-base text-slate-900 dark:text-slate-100">Audit History</h3>
          </div>
          <button type="button" onClick={onClose} className="p-1 rounded-md text-slate-400 hover:text-slate-600 dark:hover:text-slate-200">
            <X className="w-4 h-4"/>
          </button>
        </div>
        <div className="p-5 max-h-[60vh] overflow-y-auto">
          <div className="flex flex-col gap-4 relative before:absolute before:inset-y-0 before:left-[11px] before:w-px before:bg-slate-200 dark:before:bg-slate-800">
            <div className="relative pl-6">
              <span className="absolute left-0 top-1.5 w-6 h-6 -translate-x-1/2 rounded-full bg-brand-100 dark:bg-brand-900 border-4 border-white dark:border-slate-900 flex items-center justify-center">
                 <div className="w-1.5 h-1.5 bg-brand-500 rounded-full"/>
              </span>
              <p className="text-sm font-semibold text-slate-800 dark:text-slate-200">System Initialized</p>
              <span className="text-[10px] text-slate-400 font-mono">2026-09-19 08:00:00</span>
            </div>
            <div className="relative pl-6">
              <span className="absolute left-0 top-1.5 w-6 h-6 -translate-x-1/2 rounded-full bg-emerald-100 dark:bg-emerald-900 border-4 border-white dark:border-slate-900 flex items-center justify-center">
                 <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full"/>
              </span>
              <p className="text-sm font-medium text-slate-800 dark:text-slate-200">Imported Chrome Bookmarks</p>
              <span className="text-[10px] text-slate-400 font-mono">2026-09-19 08:15:30</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
