import React, { useState } from 'react';
import { BookOpen, X, Volume2, ExternalLink } from 'lucide-react';
import { Bookmark } from '../types/bookmarks.types';

interface ReaderViewDrawerProps {
  bookmark: Bookmark | null;
  onClose: () => void;
}

export const ReaderViewDrawer: React.FC<ReaderViewDrawerProps> = ({ bookmark, onClose }) => {
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);

  if (!bookmark) return null;

  const handleReadAloud = () => {
    if (!('speechSynthesis' in window)) return;
    if (isPlayingAudio) {
      window.speechSynthesis.cancel();
      setIsPlayingAudio(false);
    } else {
      const textToSpeak = `${bookmark.name}. ${bookmark.description || ''}. Source article at ${bookmark.url}`;
      const utterance = new SpeechSynthesisUtterance(textToSpeak);
      utterance.onend = () => setIsPlayingAudio(false);
      utterance.onerror = () => setIsPlayingAudio(false);
      window.speechSynthesis.speak(utterance);
      setIsPlayingAudio(true);
    }
  };

  return (
    <div className="fixed inset-y-0 right-0 z-50 w-full max-w-xl bg-white dark:bg-slate-900 shadow-2xl border-l border-slate-200 dark:border-slate-800 flex flex-col animate-in slide-in-from-right duration-200">
      <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <BookOpen className="w-5 h-5 text-indigo-500"/>
          <div>
            <h3 className="font-semibold text-sm text-slate-900 dark:text-slate-100">
              Reader View Drawer
            </h3>
            <p className="text-xs text-slate-400">
              Distraction-free article preview & audio synthesis
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={() => {
            if (isPlayingAudio && ('speechSynthesis' in window)) window.speechSynthesis.cancel();
            onClose();
          }}
          className="p-1.5 rounded-md text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
        >
          <X className="w-4 h-4"/>
        </button>
      </div>

      <div className="p-6 flex-1 overflow-y-auto space-y-6">
        <div>
          <span className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider">
            Web Article Snapshot
          </span>
          <h1 className="text-2xl font-bold mt-1 text-slate-900 dark:text-slate-50 leading-snug">
            {bookmark.name}
          </h1>
          <div className="flex items-center gap-3 mt-2 text-xs text-slate-400">
            <span>Reading Time: 3 mins</span>
            <span>•</span>
            <span>Cached: Today</span>
            <span>•</span>
            <span className="font-mono truncate">{bookmark.url}</span>
          </div>
        </div>

        <div className="prose prose-slate dark:prose-invert max-w-none text-sm leading-relaxed space-y-4 text-slate-700 dark:text-slate-300">
          <p className="font-medium text-base text-slate-800 dark:text-slate-200">
            {bookmark.description || "No preview summary extracted for this source. The web snapshot engine automatically captures clean readable content from modern HTML5 websites."}
          </p>
          <p>
            Enterprise web environments frequently require fast, low-friction reference checks without context switching into cluttered browser tabs. This snapshot view preserves typography focus and enables instant auditory synthesis for hands-free workflow verification.
          </p>
          <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
            <h4 className="font-semibold text-xs text-slate-500 uppercase tracking-wide mb-2">
              Metadata Details
            </h4>
            <ul className="space-y-1 text-xs font-mono">
              <li>Status: <span className="text-emerald-500 font-semibold">{bookmark.healthStatus}</span></li>
              <li>Total Click Telemetry: {bookmark.clickCount} views</li>
              <li>Tags: {bookmark.tags?.join(', ') || 'None'}</li>
            </ul>
          </div>
        </div>
      </div>

      <div className="p-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 flex items-center justify-between">
        <button
          type="button"
          onClick={handleReadAloud}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
            isPlayingAudio
              ? 'bg-rose-600 text-white animate-pulse'
              : 'bg-indigo-600 hover:bg-indigo-700 text-white'
          }`}
        >
          <Volume2 className="w-4 h-4"/>
          <span>{isPlayingAudio ? 'Stop Reading' : 'Read Aloud'}</span>
        </button>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => window.open(bookmark.url, '_blank')}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
          >
            <ExternalLink className="w-3.5 h-3.5"/>
            <span>Open Link</span>
          </button>
        </div>
      </div>
    </div>
  );
};