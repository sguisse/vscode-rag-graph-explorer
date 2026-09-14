import { create } from 'zustand';
import type { MaturityMatrixData, MaturityMatrixTabId, DateStatus } from '../types/maturity-matrix.types';
import initialData from '../data/maturity-matrix.json';

interface MaturityMatrixState {
  data: MaturityMatrixData;
  activeTab: MaturityMatrixTabId;
  filterToGenerate: boolean;
  showCellOrigins: boolean;
  selectedLeader: string;
  selectedAssessor: string;
  selectedPillar: string;
  selectedDateStatus: DateStatus | 'ALL';
  searchQuery: string;
  lastUpdated: string;

  setActiveTab: (tab: MaturityMatrixTabId) => void;
  setFilterToGenerate: (fn: boolean | ((current: boolean) => boolean)) => void;
  setShowCellOrigins: (fn: boolean | ((current: boolean) => boolean)) => void;
  setSelectedLeader: (leader: string) => void;
  setSelectedAssessor: (assessor: string) => void;
  setSelectedPillar: (pillar: string) => void;
  setSelectedDateStatus: (status: DateStatus | 'ALL') => void;
  setSearchQuery: (query: string) => void;
  setLastUpdated: (time: string) => void;

  updateLeader: (appCode: string, leader: string) => void;
  toggleToGenerate: (appCode: string) => void;
  toggleTarget: (appCode: string, pillarKey: string) => void;
  updateCommentary: (appCode: string, commentary: string) => void;
}

export const useMaturityMatrixStore = create<MaturityMatrixState>((set) => ({
  data: initialData as MaturityMatrixData,
  activeTab: 'matrix',
  filterToGenerate: true,
  showCellOrigins: true,
  selectedLeader: 'ALL',
  selectedAssessor: 'ALL',
  selectedPillar: 'ALL',
  selectedDateStatus: 'ALL',
  searchQuery: '',
  lastUpdated: '09:17:20',

  setActiveTab: (activeTab) => set({ activeTab }),
  setFilterToGenerate: (fn) =>
    set((state) => ({
      filterToGenerate: typeof fn === 'function' ? fn(state.filterToGenerate) : fn,
    })),
  setShowCellOrigins: (fn) =>
    set((state) => ({
      showCellOrigins: typeof fn === 'function' ? fn(state.showCellOrigins) : fn,
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
            const pillar = app.pillars[pillarKey];
            if (!pillar) return app;
            return {
              ...app,
              pillars: {
                ...app.pillars,
                [pillarKey]: {
                  ...pillar,
                  target: !pillar.target,
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
}));
