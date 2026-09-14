import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import type { MaturityMatrixTabId, DateStatus } from '../types/maturity-matrix.types';

interface MaturityMatrixFilterBarProps {
  activeTab: MaturityMatrixTabId;
  selectedLeader: string;
  selectedAssessor: string;
  selectedPillar: string;
  selectedDateStatus: DateStatus | 'ALL';
  searchQuery: string;
  leaderOptions: string[];
  assessorOptions: string[];
  pillarOptions: Array<{ key: string; label: string; icon: string }>;
  statusCounts: Record<DateStatus | 'ALL', number>;
  onTabChange: (tab: MaturityMatrixTabId) => void;
  onSelectedLeaderChange: (value: string) => void;
  onSelectedAssessorChange: (value: string) => void;
  onSelectedPillarChange: (value: string) => void;
  onSelectedDateStatusChange: (value: DateStatus | 'ALL') => void;
  onSearchQueryChange: (value: string) => void;
  onExpandAll: () => void;
  onCollapseAll: () => void;
}

export function MaturityMatrixFilterBar({
  activeTab,
  selectedLeader,
  selectedAssessor,
  selectedPillar,
  selectedDateStatus,
  searchQuery,
  leaderOptions,
  assessorOptions,
  pillarOptions,
  statusCounts,
  onTabChange,
  onSelectedLeaderChange,
  onSelectedAssessorChange,
  onSelectedPillarChange,
  onSelectedDateStatusChange,
  onSearchQueryChange,
  onExpandAll,
  onCollapseAll,
}: MaturityMatrixFilterBarProps) {
  const tabs: Array<{ key: MaturityMatrixTabId; label: string }> = [
    { key: 'matrix', label: 'Maturity Matrix View' },
    { key: 'compare', label: 'Pillar Delta Analytics' },
    { key: 'extracts', label: 'Extracts & Assessors' },
  ];

  return (
    <section className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
        <div className="flex flex-wrap gap-2">
          {tabs.map((tab) => {
            const isActive = tab.key === activeTab;
            return (
              <Button
                key={tab.key}
                type="button"
                variant={isActive ? 'secondary' : 'outline'}
                size="sm"
                onClick={() => onTabChange(tab.key)}
              >
                {tab.label}
              </Button>
            );
          })}
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {activeTab === 'matrix' && (
            <>
              <Button type="button" variant="outline" size="sm" onClick={onExpandAll}>
                Expand All
              </Button>
              <Button type="button" variant="outline" size="sm" onClick={onCollapseAll}>
                Collapse All
              </Button>
            </>
          )}
        </div>
      </div>

      <div className="mt-4 flex flex-col gap-3 lg:flex-row lg:flex-wrap lg:items-center">
        <div className="flex items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1.5 text-[11px] text-slate-700">
          <span className="font-semibold text-slate-500">Leader:</span>
          <Select value={selectedLeader} onValueChange={(value) => onSelectedLeaderChange(value || 'ALL')}>
            <SelectTrigger className="h-7 w-auto border-0 bg-transparent p-0 shadow-none text-[11px] font-semibold text-slate-800">
              <SelectValue placeholder="All Leaders" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">All Leaders</SelectItem>
              {leaderOptions.map((leader) => (
                <SelectItem key={leader} value={leader}>
                  {leader}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="flex items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1.5 text-[11px] text-slate-700">
          <span className="font-semibold text-slate-500">Assessor:</span>
          <Select value={selectedAssessor} onValueChange={(value) => onSelectedAssessorChange(value || 'ALL')}>
            <SelectTrigger className="h-7 w-auto border-0 bg-transparent p-0 shadow-none text-[11px] font-semibold text-slate-800">
              <SelectValue placeholder="All Assessors" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">All Assessors</SelectItem>
              {assessorOptions.map((assessor) => (
                <SelectItem key={assessor} value={assessor}>
                  {assessor}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="flex items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1.5 text-[11px] text-slate-700">
          <span className="font-semibold text-slate-500">Pillar:</span>
          <Select value={selectedPillar} onValueChange={(value) => onSelectedPillarChange(value || 'ALL')}>
            <SelectTrigger className="h-7 w-auto border-0 bg-transparent p-0 shadow-none text-[11px] font-semibold text-slate-800">
              <SelectValue placeholder="All Pillars" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">All Pillars</SelectItem>
              {pillarOptions.map((pillar) => (
                <SelectItem key={pillar.key} value={pillar.key}>
                  {pillar.icon} {pillar.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="flex items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1.5 text-[11px] text-slate-700">
          <span className="font-semibold text-slate-500">Date Status:</span>
          <Select value={selectedDateStatus} onValueChange={(value) => onSelectedDateStatusChange((value as DateStatus | 'ALL') || 'ALL')}>
            <SelectTrigger className="h-7 w-auto border-0 bg-transparent p-0 shadow-none text-[11px] font-semibold text-slate-800">
              <SelectValue placeholder="All Statuses" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">All Statuses ({statusCounts.ALL})</SelectItem>
              <SelectItem value="yellow">Yellow ({statusCounts.yellow})</SelectItem>
              <SelectItem value="green">Green ({statusCounts.green})</SelectItem>
              <SelectItem value="blue">Blue ({statusCounts.blue})</SelectItem>
              <SelectItem value="red">Red ({statusCounts.red})</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="relative min-w-[200px] flex-1 lg:max-w-[240px]">
          <Input
            type="text"
            value={searchQuery}
            onChange={(event) => onSearchQueryChange(event.target.value)}
            placeholder="Search app or leader..."
            className="h-8 border-slate-200 bg-slate-50 text-xs text-slate-800 placeholder:text-slate-400"
          />
        </div>
      </div>
    </section>
  );
}
