import React, { useEffect, useMemo } from 'react';
import { useLayoutStore } from '@/store/useLayoutStore';
import { useBreadcrumbNavigation } from '@/hooks/useBreadcrumbNavigation';
import { useMonthlySupportProductPerformanceDashboardStore } from './state/useMonthlySupportProductPerformanceDashboardStore';
import { MonthlySupportProductPerformanceDashboardHeader } from './components/MonthlySupportProductPerformanceDashboardHeader';
import { MonthlySupportProductPerformanceDashboardSummary } from './components/MonthlySupportProductPerformanceDashboardSummary';
import { MonthlySupportProductPerformanceDashboardCardGrid } from './components/MonthlySupportProductPerformanceDashboardCardGrid';
import type { KpiMetric } from './types';

export function MonthlySupportProductPerformanceDashboardFeature() {
  const setLayoutContainers = useLayoutStore((s) => s.setLayoutContainers);
  useBreadcrumbNavigation('feature-monthly-support-product-performance-dashboard');

  useEffect(() => {
    setLayoutContainers({
      header: { visible: true, isResizable: false, isHiddable: false },
      sidebarLeft: { visible: true, isResizable: true, isHiddable: true },
      workspace: {
        top: { visible: false },
        left: { visible: false },
        center: {
          visible: true,
          container: (
            <div className="flex h-full w-full flex-col overflow-hidden bg-slate-50">
              <MonthlySupportProductPerformanceDashboardFeatureContent />
            </div>
          ),
          isHiddable: false,
          maximizeContainer: { isMaximizable: true, isMaximized: false, maximizeScope: 'Main' },
        },
        right: { visible: false },
        bottom: { visible: false },
      },
      sidebarRight: { visible: false },
      footer: { visible: true, isResizable: false, isHiddable: false },
    });
  }, [setLayoutContainers]);

  return null;
}

function MonthlySupportProductPerformanceDashboardFeatureContent() {
  const domainFilter = useMonthlySupportProductPerformanceDashboardStore((state) => state.domainFilter);
  const searchQuery = useMonthlySupportProductPerformanceDashboardStore((state) => state.searchQuery);
  const showCellOrigins = useMonthlySupportProductPerformanceDashboardStore((state) => state.showCellOrigins);
  const isSpecsOpen = useMonthlySupportProductPerformanceDashboardStore((state) => state.isSpecsOpen);
  const setDomainFilter = useMonthlySupportProductPerformanceDashboardStore((state) => state.setDomainFilter);
  const setSearchQuery = useMonthlySupportProductPerformanceDashboardStore((state) => state.setSearchQuery);
  const toggleCellOrigins = useMonthlySupportProductPerformanceDashboardStore((state) => state.toggleCellOrigins);
  const toggleSpecs = useMonthlySupportProductPerformanceDashboardStore((state) => state.toggleSpecs);
  const getFilteredData = useMonthlySupportProductPerformanceDashboardStore((state) => state.getFilteredData);

  const filteredData = getFilteredData();

  const metrics = useMemo<KpiMetric[]>(() => {
    const totalTickets = filteredData.reduce((sum, item) => sum + item.volumeTickets, 0);
    const olaValues = filteredData.filter((item) => item.respectOLA > 0).map((item) => item.respectOLA);
    const availabilityValues = filteredData.filter((item) => item.disponibilite > 0).map((item) => item.disponibilite);
    const ftfValues = filteredData.filter((item) => item.firstTimeFix > 0).map((item) => item.firstTimeFix);

    const averageOla = olaValues.length ? olaValues.reduce((sum, value) => sum + value, 0) / olaValues.length : 0;
    const averageAvailability = availabilityValues.length ? availabilityValues.reduce((sum, value) => sum + value, 0) / availabilityValues.length : 0;
    const averageFtf = ftfValues.length ? ftfValues.reduce((sum, value) => sum + value, 0) / ftfValues.length : 0;

    return [
      { label: 'Total Ticket Volume', value: totalTickets.toLocaleString(), context: 'Filtered ticket volume', accent: 'bg-blue-500' },
      { label: 'Average OLA', value: `${(averageOla * 100).toFixed(1)}%`, context: 'Service SLA compliance', accent: 'bg-emerald-500' },
      { label: 'Average Availability', value: `${(averageAvailability * 100).toFixed(1)}%`, context: 'System uptime', accent: 'bg-amber-500' },
      { label: 'First Time Fix', value: `${(averageFtf * 100).toFixed(1)}%`, context: 'Issue resolution efficiency', accent: 'bg-violet-500' },
    ];
  }, [filteredData]);

  return (
    <div className="flex h-full w-full flex-col gap-4 overflow-auto bg-slate-50 p-4 text-slate-800">
      <MonthlySupportProductPerformanceDashboardHeader
        domainFilter={domainFilter}
        searchQuery={searchQuery}
        showCellOrigins={showCellOrigins}
        isSpecsOpen={isSpecsOpen}
        onDomainChange={setDomainFilter}
        onSearchChange={setSearchQuery}
        onToggleCellOrigins={toggleCellOrigins}
        onToggleSpecs={toggleSpecs}
      />

      <MonthlySupportProductPerformanceDashboardSummary metrics={metrics} />

      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="mb-4 flex items-center justify-between gap-2">
          <h2 className="text-lg font-semibold text-slate-900">Service Detail</h2>
          <span className="text-sm text-slate-500">{filteredData.length} services</span>
        </div>

        <MonthlySupportProductPerformanceDashboardCardGrid records={filteredData} />
      </section>

      {isSpecsOpen && (
        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <h3 className="mb-3 text-lg font-semibold text-slate-900">Dashboard specs</h3>
          <div className="space-y-3 text-sm text-slate-600">
            <p><strong>Layout:</strong> Header with domain filter and search, KPI summary, service cards grid.</p>
            <p><strong>State:</strong> Filtered by domain and free-text search, with in-memory persistence target.</p>
            <p><strong>Upgrades:</strong> Cell origins toggle and embedded specs panel enabled.</p>
          </div>
        </section>
      )}
    </div>
  );
}

export default MonthlySupportProductPerformanceDashboardFeature;
