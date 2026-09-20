import React, { useState, useEffect } from 'react';
import { X, Settings } from 'lucide-react';

interface CardConfigDialogProps {
  isOpen: boolean;
  card?: any | null;
  onClose: () => void;
  onSave: (updatedCard: any) => void;
}

export const CardConfigDialog: React.FC<CardConfigDialogProps> = ({
  isOpen,
  card,
  onClose,
  onSave,
}) => {
  const [title, setTitle] = useState('');

  useEffect(() => {
    if (card) {
      setTitle(card.title || '');
    }
  }, [card]);

  if (!isOpen) return null;

  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setTitle(e.target.value);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({ ...card, title });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <form
        className="w-full max-w-md rounded-xl bg-white dark:bg-slate-900 shadow-xl border border-slate-200 dark:border-slate-800 p-6 space-y-4"
        onSubmit={handleSubmit}
      >
        <div className="flex items-center justify-between border-b pb-3 border-slate-200 dark:border-slate-800">
          <div className="flex items-center gap-2">
            <Settings className="w-5 h-5 text-brand-600 dark:text-brand-400"/>
            <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
              Card Configuration
            </h2>
          </div>
          <button
            type="button"
            className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
            onClick={onClose}
          >
            <X className="w-5 h-5"/>
          </button>
        </div>

        <div className="space-y-2">
          <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
            Card Title
          </label>
          <input
            type="text"
            value={title}
            className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
            onChange={handleTitleChange}
          />
        </div>

        <div className="flex justify-end gap-2 pt-3 border-t border-slate-200 dark:border-slate-800">
          <button
            type="button"
            className="px-4 py-2 rounded-lg bg-slate-200 dark:bg-slate-800 text-slate-800 dark:text-slate-200 text-sm font-medium hover:bg-slate-300 dark:hover:bg-slate-700 transition-colors"
            onClick={onClose}
          >
            Cancel
          </button>
          <button
            type="submit"
            className="px-4 py-2 rounded-lg bg-brand-600 text-white text-sm font-semibold hover:bg-brand-700 transition-colors"
          >
            Save Changes
          </button>
        </div>
      </form>
    </div>
  );
};