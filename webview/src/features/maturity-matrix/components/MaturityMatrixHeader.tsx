import React from 'react';
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
  const [extractDate, extractTime] = lastUpdated.includes(' -- ')
    ? lastUpdated.split(' -- ')
    : [lastUpdated, ''];

  return (
    <header className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-2xs">
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
            <Button data-tooltip="Refresh data from Maturity Matrix Repository, it will create a new snapshot view of Assessments" onClick={onRefresh} size="sm" title="Refresh data from Maturity Matrix Repository, it will create a new snapshot view of Assessments" type="button" variant="default">
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
    <span className="h-2.5 w-2.5 shrink-0 rounded-full bg-emerald-500" />
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
    </header>
  );
}

export default MaturityMatrixHeader;
