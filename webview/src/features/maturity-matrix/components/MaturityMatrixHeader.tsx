import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import type { MaturityMatrixTabId } from '../types/maturity-matrix.types';

const tabs: Array<{ key: MaturityMatrixTabId; label: string; accent: string }> = [
  { key: 'matrix', label: 'Matrix View', accent: 'text-indigo-600' },
  { key: 'compare', label: 'Pillar Delta Analytics', accent: 'text-violet-600' },
  { key: 'extracts', label: 'Extracts & Assessors', accent: 'text-emerald-600' },
];

interface MaturityMatrixHeaderProps {
  activeTab: MaturityMatrixTabId;
  lastUpdated: string;
  filterToGenerate: boolean;
  showCellOrigins: boolean;
  onTabChange: (nextTab: MaturityMatrixTabId) => void;
  onRefresh: () => void;
  onExtractAll: () => void;
  onToggleFilter: () => void;
  onToggleCellOrigins: () => void;
}

export function MaturityMatrixHeader({
  activeTab,
  lastUpdated,
  filterToGenerate,
  showCellOrigins,
  onTabChange,
  onRefresh,
  onExtractAll,
  onToggleFilter,
  onToggleCellOrigins,
}: MaturityMatrixHeaderProps) {
  return (
    <header className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-indigo-100 text-xl text-indigo-700 shadow-sm">
            🧭
          </div>
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.24em] text-indigo-600">Maturity Matrix</p>
            <h1 className="mt-1 text-2xl font-bold tracking-tight text-slate-900">Evolution Dashboard</h1>
          </div>
        </div>

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

      <div className="mt-4 flex flex-wrap gap-2">
        {tabs.map((tab) => {
          const isActive = tab.key === activeTab;

          return (
            <Button
              key={tab.key}
              type="button"
              variant={isActive ? 'secondary' : 'outline'}
              size="sm"
              onClick={() => onTabChange(tab.key)}
              className={isActive ? 'shadow-sm' : ''}
            >
              <span className={tab.accent}>{tab.label}</span>
            </Button>
          );
        })}
      </div>
    </header>
  );
}
