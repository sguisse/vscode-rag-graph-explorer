import type { KpiMetric } from '../types';
import { KpiCard } from './KpiCard';

interface MonthlySupportProductPerformanceDashboardSummaryProps {
  metrics: KpiMetric[];
}

export function MonthlySupportProductPerformanceDashboardSummary({ metrics }: MonthlySupportProductPerformanceDashboardSummaryProps) {
  return (
    <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
      {metrics.map((metric) => (
        <KpiCard key={metric.label} metric={metric} />
      ))}
    </section>
  );
}
