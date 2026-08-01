import { create } from 'zustand';
import type { AppServices } from '@/common/services/registry/services.types';

export interface ServiceState {
    services: Partial<AppServices>;
    registerService: <K extends keyof AppServices>(key: K, service: AppServices[K]) => void;
    getService: <K extends keyof AppServices>(key: K) => AppServices[K];
}

export const useServiceStore = create<ServiceState>((set, get) => ({
    services: {},

    registerService: (key, service) => {
        set((state) => ({
            services: {
                ...state.services,
                [key]: service
            }
        }));
    },

    getService: (key) => {
        const service = get().services[key];
        if (!service) {
            throw new Error(`[ServiceStore] Service "${String(key)}" has not been registered in Zustand store.`);
        }
        return service;
    }
}));
