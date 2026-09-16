import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import type { MaturityMatrixTabId } from '../types/maturity-matrix.types';

interface MaturityMatrixHeaderProps {
  activeTab?: MaturityMatrixTabId;
  lastUpdated: string;
  filterToGenerate: boolean;
  showCellOrigins: boolean;
  onTabChange?: (nextTab: MaturityMatrixTabId) => void;
  onRefresh: () => void;
  onExtractAll: () => void;
  onToggleFilter: () => void;
  onToggleCellOrigins: () => void;
}

export function MaturityMatrixHeader({
  lastUpdated,
  filterToGenerate,
  showCellOrigins,
  onRefresh,
  onExtractAll,
  onToggleFilter,
  onToggleCellOrigins,
}: MaturityMatrixHeaderProps) {
  return (
    <header className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-2xs">
      <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
        {/* Header Title Section */}
        <div className="flex items-center gap-3.5">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-indigo-50/80 text-indigo-600 border border-indigo-100/60 shadow-2xs">
            <svg
              className="h-5 w-5"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
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
              Tracking Pillar Progress between Assessments &amp; Extracts • Specification from{' '}
              <strong className="font-bold text-slate-700">"Readme"</strong> Sheet
            </p>
          </div>
        </div>

        {/* Global Action Controls */}
        <div className="flex flex-wrap items-center gap-2">
          <Button type="button" variant="default" size="sm" onClick={onRefresh}>
            Refresh Data
          </Button>

          <Button type="button" variant="secondary" size="sm" onClick={onExtractAll}>
            Extract ALL
          </Button>

          <label className="inline-flex cursor-pointer items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-[11px] font-semibold text-slate-700">
            <Checkbox checked={filterToGenerate} onCheckedChange={onToggleFilter} />
            <span>Filter: TO Generate = TRUE</span>
          </label>

          <label className="inline-flex cursor-pointer items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-[11px] font-semibold text-slate-700">
            <Checkbox checked={showCellOrigins} onCheckedChange={onToggleCellOrigins} />
            <span>Show Cell Origins</span>
          </label>

          <div className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-[11px] font-medium text-slate-600">
            <span className="inline-block h-2.5 w-2.5 rounded-full bg-emerald-500" />
            <span>Last extract: {lastUpdated}</span>
          </div>
        </div>
      </div>
    </header>
  );
}

export default MaturityMatrixHeader;
