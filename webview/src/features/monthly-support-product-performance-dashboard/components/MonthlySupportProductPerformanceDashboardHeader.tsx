import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import type { DomainFilter } from '../types';

interface MonthlySupportProductPerformanceDashboardHeaderProps {
  domainFilter: DomainFilter;
  searchQuery: string;
  showCellOrigins: boolean;
  isSpecsOpen: boolean;
  onDomainChange: (value: DomainFilter) => void;
  onSearchChange: (value: string) => void;
  onToggleCellOrigins: () => void;
  onToggleSpecs: () => void;
}

export function MonthlySupportProductPerformanceDashboardHeader({
  domainFilter,
  searchQuery,
  showCellOrigins,
  isSpecsOpen,
  onDomainChange,
  onSearchChange,
  onToggleCellOrigins,
  onToggleSpecs,
}: MonthlySupportProductPerformanceDashboardHeaderProps) {
  return (
    <header className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-100 text-xl text-blue-700 shadow-sm">
            📈
          </div>
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.24em] text-blue-600">Support & Product</p>
            <h1 className="mt-1 text-2xl font-bold tracking-tight text-slate-900">Monthly Performance Dashboard</h1>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <select
            value={domainFilter}
            onChange={(event) => onDomainChange(event.target.value as DomainFilter)}
            className="h-9 rounded-md border border-slate-200 bg-slate-50 px-2.5 text-sm text-slate-700 outline-none focus:border-blue-500"
          >
            <option value="Tous">Tous</option>
            <option value="Helpdesk">Helpdesk</option>
            <option value="Produit">Produit</option>
            <option value="Support">Support</option>
          </select>

          <Input
            value={searchQuery}
            onChange={(event) => onSearchChange(event.target.value)}
            placeholder="Search services"
            className="w-52"
          />

          <label className="inline-flex cursor-pointer items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-[11px] font-semibold text-slate-700">
            <Checkbox checked={showCellOrigins} onCheckedChange={onToggleCellOrigins} />
            <span>Cell Origins</span>
          </label>

          <Button type="button" variant="outline" size="sm" onClick={onToggleSpecs}>
            {isSpecsOpen ? 'Hide Specs' : 'Specs'}
          </Button>
        </div>
      </div>
    </header>
  );
}
