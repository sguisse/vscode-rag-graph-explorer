import { create } from 'zustand';
import { initialServiceData } from '../data/serviceData';
import type { DomainFilter, MonthlyServiceRecord } from '../types';

interface MonthlySupportProductPerformanceDashboardState {
  data: MonthlyServiceRecord[];
  domainFilter: DomainFilter;
  searchQuery: string;
  showCellOrigins: boolean;
  isSpecsOpen: boolean;
  setDomainFilter: (value: DomainFilter) => void;
  setSearchQuery: (value: string) => void;
  toggleCellOrigins: () => void;
  toggleSpecs: () => void;
  getFilteredData: () => MonthlyServiceRecord[];
}

export const useMonthlySupportProductPerformanceDashboardStore = create<MonthlySupportProductPerformanceDashboardState>((set, get) => ({
  data: initialServiceData,
  domainFilter: 'Tous',
  searchQuery: '',
  showCellOrigins: false,
  isSpecsOpen: false,
  setDomainFilter: (value) => set({ domainFilter: value }),
  setSearchQuery: (value) => set({ searchQuery: value }),
  toggleCellOrigins: () => set((state) => ({ showCellOrigins: !state.showCellOrigins })),
  toggleSpecs: () => set((state) => ({ isSpecsOpen: !state.isSpecsOpen })),
  getFilteredData: () => {
    const { data, domainFilter, searchQuery } = get();
    const normalizedQuery = searchQuery.trim().toLowerCase();

    return data.filter((record) => {
      const matchesDomain = domainFilter === 'Tous' || record.domaine === domainFilter;
      const matchesSearch =
        normalizedQuery.length === 0 ||
        record.serviceProduit.toLowerCase().includes(normalizedQuery) ||
        record.faitsMarquants.toLowerCase().includes(normalizedQuery);

      return matchesDomain && matchesSearch;
    });
  },
}));
