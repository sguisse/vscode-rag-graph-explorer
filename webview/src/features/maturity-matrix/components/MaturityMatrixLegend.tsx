import { Button } from '@/components/ui/button';
import type { DateStatus } from '../types/maturity-matrix.types';

interface MaturityMatrixLegendProps {
  selectedDateStatus: DateStatus | 'ALL';
  statusCounts: Record<DateStatus | 'ALL', number>;
  onStatusClick: (value: DateStatus | 'ALL') => void;
}

const statusStyles: Record<DateStatus, string> = {
  yellow: 'bg-yellow-100 text-yellow-900 border-yellow-300',
  green: 'bg-emerald-100 text-emerald-900 border-emerald-300',
  blue: 'bg-blue-100 text-blue-900 border-blue-300',
  red: 'bg-rose-100 text-rose-900 border-rose-300',
};

export function MaturityMatrixLegend({
  selectedDateStatus,
  statusCounts,
  onStatusClick,
}: MaturityMatrixLegendProps) {
  const statuses: Array<{ key: DateStatus; label: string; text: string }> = [
    { key: 'yellow', label: 'Yellow', text: `No assessment (${statusCounts.yellow})` },
    { key: 'green', label: 'Green', text: `≤ 15 days (${statusCounts.green})` },
    { key: 'blue', label: 'Blue', text: `Valid (${statusCounts.blue})` },
    { key: 'red', label: 'Red', text: `Outdated > 6M (${statusCounts.red})` },
  ];

  return (
    <section className="rounded-xl border border-slate-200 bg-slate-100/80 p-4 shadow-sm">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Readme color rules for assessment dates</div>
        <div className="flex flex-wrap gap-2">
          {statuses.map((status) => {
            const isActive = selectedDateStatus === status.key;
            return (
              <Button
                key={status.key}
                type="button"
                size="sm"
                variant={isActive ? 'secondary' : 'outline'}
                onClick={() => onStatusClick(status.key)}
                className={isActive ? statusStyles[status.key] : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'}
              >
                {status.label}: {status.text}
              </Button>
            );
          })}
        </div>
      </div>
    </section>
  );
}
