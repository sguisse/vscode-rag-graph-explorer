import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import type { MaturityMatrixTabId } from '../types/maturity-matrix.types';

interface MaturityMatrixHeaderProps {
  activeTab?: MaturityMatrixTabId;
  lastUpdated: string;
  todayDate?: string;
  onTabChange?: (nextTab: MaturityMatrixTabId) => void;
  onRefresh: () => void;
}

export function MaturityMatrixHeader({
  lastUpdated,
  todayDate = '2026-09-16',
  onRefresh,
}: MaturityMatrixHeaderProps) {
  const [showConfirmModal, setShowConfirmModal] = useState(false);

  const [extractDate, extractTime] = lastUpdated.includes(' -- ')
    ? lastUpdated.split(' -- ')
    : [lastUpdated, ''];

  const diffDays = (() => {
    if (!extractDate || extractDate === 'Not synced') return null;
    const cleanExtract = extractDate.replace(/\//g, '-');
    const cleanToday = todayDate.replace(/\//g, '-');
    const extractMs = new Date(cleanExtract).getTime();
    const todayMs = new Date(cleanToday).getTime();
    if (isNaN(extractMs) || isNaN(todayMs)) return null;
    return Math.max(0, Math.floor((todayMs - extractMs) / (1000 * 60 * 60 * 24)));
  })();

  const isOutdated = diffDays !== null && diffDays > 30;
  const dotColorClass = isOutdated ? 'bg-rose-500' : 'bg-emerald-500';

  const lastAssessmentText = (() => {
    if (diffDays === null) return 'N/A';
    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return '1 day ago';
    return `${diffDays} days ago`;
  })();

  const handleConfirmRefresh = () => {
    setShowConfirmModal(false);
    onRefresh();
  };

  return (
    <header className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-2xs relative">
      <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
        {/* Header Title Section */}
        <div className="flex items-center gap-3.5">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-indigo-50/80 text-indigo-600 border border-indigo-100/60 shadow-2xs">
            <svg
              className="h-5 w-5"
              fill="none"
              stroke="currentColor"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              viewBox="0 0 24 24"
            >
              <polygon points="12 2 2 7 12 12 22 7 12 2" />
              <polyline points="2 17 12 22 22 17" />
              <polyline points="2 12 12 17 22 12" />
            </svg>
          </div>

          <div>
            <h1 className="text-xl font-extrabold tracking-tight text-slate-950 sm:text-2xl">
              Maturity Matrix Evolution Dashboard
            </h1>
            <p className="mt-0.5 text-xs text-slate-500 font-normal">
              Tracking Pillar Progress between Assessments &amp; Extracts
            </p>
          </div>
        </div>

        {/* Global Action Controls & Date Info */}
        <div className="flex flex-col xl:items-end gap-2">
          <div className="flex flex-wrap items-center gap-2">
            <Button data-tooltip="Refresh data from Maturity Matrix Repository, it will create a new snapshot view of Assessments" onClick={() => setShowConfirmModal(true)}
              size="sm"
              title="Refresh data from Maturity Matrix Repository, it will create a new snapshot view of Assessments"
              type="button"
              variant="default"
            >
              Refresh Data
            </Button>

            <div className="flex flex-col items-end gap-1">
              <div className="flex items-center justify-between gap-2 rounded-lg border border-slate-200 bg-slate-50 px-3 py-1 text-[11px] font-medium text-slate-600 w-[180px]">
                <span className="h-2.5 w-2.5 shrink-0 rounded-full bg-blue-500" />
                <span className="text-right">
                  Today:{' '}
                  <span className="font-bold text-slate-800 cursor-help">
                    {todayDate}
                  </span>
                </span>
              </div>
              <div className="flex items-center justify-between gap-2 rounded-lg border border-slate-200 bg-slate-50 px-3 py-1 text-[11px] font-medium text-slate-600 w-[180px]">
                <span className={`h-2.5 w-2.5 shrink-0 rounded-full ${dotColorClass}`} />
                <span className="text-right">
                  Last extract:{' '}
                  <span
                    className="font-bold text-slate-800 cursor-help"
                    data-tooltip={extractTime ? `Time: ${extractTime}` : extractDate}
                  >
                    {extractDate}
                  </span>
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Confirmation Modal */}
      {showConfirmModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-xs p-4">
          <div className="w-full max-w-md rounded-xl border border-slate-200 bg-white p-6 shadow-xl animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center gap-3 text-indigo-600 mb-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-indigo-50 border border-indigo-100">
                <svg
                  className="h-5 w-5"
                  fill="none"
                  stroke="currentColor"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  viewBox="0 0 24 24"
                >
                  <circle
                    cx="12"
                    cy="12"
                    r="10"
                  />
                  <line
                    x1="12"
                    y1="8"
                    x2="12"
                    y2="12"
                  />
                  <line
                    x1="12"
                    y1="16"
                    x2="12.01"
                    y2="16"
                  />
                </svg>
              </div>
              <h3 className="text-base font-bold text-slate-900">
                Confirm Data Refresh
              </h3>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed mb-6">
              The last assessment has been done <strong className="text-slate-900 font-semibold">{lastAssessmentText}</strong>, confirm the reloading of information from the Maturity Matrix Repository?
            </p>

            <div className="flex items-center justify-end gap-2">
              <Button onClick={() => setShowConfirmModal(false)}
                size="sm"
                type="button"
                variant="outline"
              >
                Cancel
              </Button>
              <Button onClick={handleConfirmRefresh} size="sm" type="button" variant="default">
                Confirm Reload
              </Button>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}

export default MaturityMatrixHeader;