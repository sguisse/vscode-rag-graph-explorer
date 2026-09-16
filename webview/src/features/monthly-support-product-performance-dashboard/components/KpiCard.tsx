import type { KpiMetric } from '../types';

interface KpiCardProps {
  metric: KpiMetric;
}

export function KpiCard({ metric }: KpiCardProps) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-center justify-between gap-3">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">{metric.label}</p>
        <span className={`h-2.5 w-2.5 rounded-full ${metric.accent}`} />
      </div>

      <p className="mt-4 text-3xl font-bold tracking-tight text-slate-900">{metric.value}</p>
      <p className="mt-1 text-sm text-slate-500">{metric.context}</p>
    </div>
  );
}
