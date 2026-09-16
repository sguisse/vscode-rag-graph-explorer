import { Button } from '@/components/ui/button';
import type { DateStatus } from '../types/maturity-matrix.types';

interface MaturityMatrixLegendProps {
  selectedDateStatus: DateStatus | 'ALL';
  statusCounts: Record<DateStatus | 'ALL', number>;
  onStatusClick: (value: DateStatus | 'ALL') => void;
}

interface StatusConfig {
  key: DateStatus;
  label: string;
  countKey: DateStatus;
  dotColor: string;
  selectedStyles: string;
  unselectedStyles: string;
}

const statusConfigs: StatusConfig[] = [
  {
    key: 'yellow',
    label: 'Yellow: No assessment',
    countKey: 'yellow',
    dotColor: 'bg-amber-500',
    selectedStyles: 'border-2 border-amber-400 bg-amber-100 text-amber-950 font-bold shadow-xs hover:bg-amber-150',
    unselectedStyles: 'border border-amber-300/80 bg-amber-50/50 text-amber-900 font-medium hover:bg-amber-100/70',
  },
  {
    key: 'green',
    label: 'Green: ≤ 15 Days',
    countKey: 'green',
    dotColor: 'bg-emerald-500',
    selectedStyles: 'border-2 border-emerald-400 bg-emerald-100 text-emerald-950 font-bold shadow-xs hover:bg-emerald-150',
    unselectedStyles: 'border border-emerald-300/80 bg-emerald-50/50 text-emerald-900 font-medium hover:bg-emerald-100/70',
  },
  {
    key: 'blue',
    label: 'Blue: Valid',
    countKey: 'blue',
    dotColor: 'bg-blue-500',
    selectedStyles: 'border-2 border-blue-400 bg-blue-100 text-blue-950 font-bold shadow-xs hover:bg-blue-150',
    unselectedStyles: 'border border-blue-300/80 bg-blue-50/50 text-blue-900 font-medium hover:bg-blue-100/70',
  },
  {
    key: 'orange',
    label: 'Orange: todo if >5M',
    countKey: 'orange',
    dotColor: 'bg-orange-500',
    selectedStyles: 'border-2 border-orange-400 bg-orange-100 text-orange-950 font-bold shadow-xs hover:bg-orange-150',
    unselectedStyles: 'border border-orange-300/80 bg-orange-50/50 text-orange-900 font-medium hover:bg-orange-100/70',
  },
  {
    key: 'red',
    label: 'Red: Outdated >6M',
    countKey: 'red',
    dotColor: 'bg-rose-500',
    selectedStyles: 'border-2 border-rose-400 bg-rose-100 text-rose-950 font-bold shadow-xs hover:bg-rose-150',
    unselectedStyles: 'border border-rose-300/80 bg-rose-50/50 text-rose-900 font-medium hover:bg-rose-100/70',
  },
];

export function MaturityMatrixLegend({
  selectedDateStatus,
  statusCounts,
  onStatusClick,
}: MaturityMatrixLegendProps) {
  const isFiltered = selectedDateStatus !== 'ALL';

  return (
    <section className="rounded-xl border border-slate-200 bg-slate-50/80 p-3 shadow-xs">
      <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
        <div className="flex flex-wrap items-center gap-2.5">
          <div className="flex items-center gap-1.5 text-xs font-bold text-slate-800">
            <svg
              className="h-4 w-4 shrink-0 text-indigo-600"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              viewBox="0 0 24 24"
            >
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="16" x2="12" y2="12" />
              <line x1="12" y1="8" x2="12.01" y2="8" />
            </svg>
            <span>Readme Color Rules for Assessment Dates (compared to TODAY):</span>
          </div>

          <div className="rounded-md border border-indigo-200 bg-white px-2.5 py-0.5 text-xs font-bold text-indigo-700 shadow-2xs">
            Today: 2026–09–16
          </div>

          {isFiltered && (
            <Button
              type="button"
              size="xs"
              onClick={() => onStatusClick('ALL')}
              className="h-6 rounded-md bg-indigo-600 px-2.5 text-xs font-semibold text-white hover:bg-indigo-700"
            >
              Reset Filter
            </Button>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {statusConfigs.map((status) => {
            const isActive = selectedDateStatus === status.key;
            const count = statusCounts[status.countKey] ?? 0;

            return (
              <Button
                key={status.key}
                type="button"
                size="sm"
                variant="outline"
                onClick={() => onStatusClick(isActive ? 'ALL' : status.key)}
                className={`flex h-8 items-center gap-1.5 rounded-lg px-3 text-xs transition-colors ${
                  isActive ? status.selectedStyles : status.unselectedStyles
                }`}
              >
                <span className={`h-2.5 w-2.5 shrink-0 rounded-full ${status.dotColor}`} />
                <span>
                  {status.label} ({count})
                </span>
                {isActive && (
                  <svg
                    className="ml-0.5 h-3.5 w-3.5 shrink-0 stroke-[2.5]"
                    fill="none"
                    stroke="currentColor"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    viewBox="0 0 24 24"
                  >
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                )}
              </Button>
            );
          })}
        </div>
      </div>
    </section>
  );
}

export default MaturityMatrixLegend;
