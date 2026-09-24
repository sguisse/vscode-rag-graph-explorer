import { create } from 'zustand';
import { maturityMatrixApiService } from '@/services/api/maturity-matrix-api.service.gen';
import type { MaturityMatrixData } from '@/shared/services/maturity-matrix/model/assessments-json';
import type { DateStatus, MaturityMatrixTabId } from '../types/maturity-matrix.types';

export interface MaturityMatrixState {
  data: MaturityMatrixData;
  isLoading: boolean;
  error: string | null;
  activeTab: MaturityMatrixTabId;
  filterToGenerate: boolean;
  showCellOrigins: boolean;
  selectedLeader: string;
  selectedAssessor: string;
  selectedPillar: string;
  selectedDateStatus: DateStatus | 'ALL';
  searchQuery: string;
  lastUpdated: string;
  expandedAppCodes: Record<string, boolean>;

  // Actions
  fetchLastAssessments: () => Promise<void>;
  setActiveTab: (tab: MaturityMatrixTabId) => void;
  setFilterToGenerate: (value: boolean | ((current: boolean) => boolean)) => void;
  setShowCellOrigins: (value: boolean | ((current: boolean) => boolean)) => void;
  setSelectedLeader: (leader: string) => void;
  setSelectedAssessor: (assessor: string) => void;
  setSelectedPillar: (pillar: string) => void;
  setSelectedDateStatus: (status: DateStatus | 'ALL') => void;
  setSearchQuery: (query: string) => void;
  setLastUpdated: (lastUpdated: string) => void;
  updateLeader: (appCode: string, leader: string) => void;
  toggleToGenerate: (appCode: string) => void;
  toggleTarget: (appCode: string, pillarKey: string) => void;
  updateCommentary: (appCode: string, commentary: string) => void;
  expandAll: () => void;
  collapseAll: () => void;
  toggleExpandApp: (appCode: string) => void;
}

const EMPTY_MATURITY_DATA: MaturityMatrixData = {
  updatedAt: '',
  generatedAt: '',
  pillars: [],
  applications: [],
};

export const useMaturityMatrixStore = create<MaturityMatrixState>((set, get) => ({
  data: EMPTY_MATURITY_DATA,
  isLoading: false,
  error: null,
  activeTab: 'matrix',
  filterToGenerate: true,
  showCellOrigins: false,
  selectedLeader: 'ALL',
  selectedAssessor: 'ALL',
  selectedPillar: 'ALL',
  selectedDateStatus: 'ALL',
  searchQuery: '',
  lastUpdated: 'Not synced',
  expandedAppCodes: { AVAILABLE_SHIPMENT: true },

  fetchLastAssessments: async () => {
    set({ isLoading: true, error: null });
    try {
      const data = await maturityMatrixApiService.getLastAssessments();
      const updatedTime = data.updatedAt
        ? new Date(data.updatedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })
        : new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });

      set({
        data,
        isLoading: false,
        lastUpdated: updatedTime,
      });
    } catch (err) {
      set({
        isLoading: false,
        error: err instanceof Error ? err.message : 'Failed to fetch last assessments',
      });
    }
  },

  setActiveTab: (activeTab) => set({ activeTab }),

  setFilterToGenerate: (value) =>
    set((state) => ({
      filterToGenerate: typeof value === 'function' ? value(state.filterToGenerate) : value,
    })),

  setShowCellOrigins: (value) =>
    set((state) => ({
      showCellOrigins: typeof value === 'function' ? value(state.showCellOrigins) : value,
    })),

  setSelectedLeader: (selectedLeader) => set({ selectedLeader }),
  setSelectedAssessor: (selectedAssessor) => set({ selectedAssessor }),
  setSelectedPillar: (selectedPillar) => set({ selectedPillar }),
  setSelectedDateStatus: (selectedDateStatus) => set({ selectedDateStatus }),
  setSearchQuery: (searchQuery) => set({ searchQuery }),
  setLastUpdated: (lastUpdated) => set({ lastUpdated }),

  updateLeader: (appCode, leader) =>
    set((state) => ({
      data: {
        ...state.data,
        applications: state.data.applications.map((app) =>
          app.code === appCode || app.id === appCode ? { ...app, leader } : app,
        ),
      },
    })),

  toggleToGenerate: (appCode) =>
    set((state) => ({
      data: {
        ...state.data,
        applications: state.data.applications.map((app) =>
          app.code === appCode || app.id === appCode ? { ...app, toGenerate: !app.toGenerate } : app,
        ),
      },
    })),

  toggleTarget: (appCode, pillarKey) =>
    set((state) => ({
      data: {
        ...state.data,
        applications: state.data.applications.map((app) => {
          if (app.code === appCode || app.id === appCode) {
            const currentPillar = app.pillars[pillarKey];
            if (!currentPillar) return app;
            return {
              ...app,
              pillars: {
                ...app.pillars,
                [pillarKey]: {
                  ...currentPillar,
                  target: !currentPillar.target,
                },
              },
            };
          }
          return app;
        }),
      },
    })),

  updateCommentary: (appCode, commentary) =>
    set((state) => ({
      data: {
        ...state.data,
        applications: state.data.applications.map((app) =>
          app.code === appCode || app.id === appCode ? { ...app, commentary } : app,
        ),
      },
    })),

  expandAll: () =>
    set((state) => {
      const expanded: Record<string, boolean> = {};
      state.data.applications.forEach((app) => {
        if (app.code) expanded[app.code] = true;
        if (app.id) expanded[app.id] = true;
      });
      return { expandedAppCodes: expanded };
    }),

  collapseAll: () => set({ expandedAppCodes: {} }),

  toggleExpandApp: (appCode) =>
    set((state) => ({
      expandedAppCodes: {
        ...state.expandedAppCodes,
        [appCode]: !state.expandedAppCodes[appCode],
      },
    })),
}));