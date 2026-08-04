import { create } from 'zustand';
import type { BackendServices } from '@/backend/config/registry/services.types';
import { CodebaseAdapter } from '@/backend/services/codebase/infrastructure/codebase-service.adapter-mock';
import { LoggerAdapter } from '@/backend/services/vscode/infrastructure/logger-service.adpter';

export interface BackendServiceState {
  services: Partial<BackendServices>;
  registerService: <K extends keyof BackendServices>(key: K, service: BackendServices[K]) => void;
  getBackendService: <K extends keyof BackendServices>(key: K) => BackendServices[K];
}

export const useBackendServiceStore = create<BackendServiceState>((set, get) => ({
  services: {
    codebaseService: new CodebaseAdapter(),
    logger: new LoggerAdapter('token-razor'),
  },
  registerService: (key, service) =>
    set((state) => ({
      services: { ...state.services, [key]: service },
    })),
  getBackendService: <K extends keyof BackendServices>(key: K): BackendServices[K] => {
    const service = get().services[key];
    if (!service) {
      throw new Error(`[BackendServiceStore] Service "${String(key)}" has not been registered.`);
    }
    return service as BackendServices[K];
  },
}));
