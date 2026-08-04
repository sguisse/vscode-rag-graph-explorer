import type { BackendServices } from '@/backend/config/registry/services.types';
import { useBackendServiceStore } from '@/store/useBackendServiceStore';

/**
 * Pure React Custom Hook to inject a specific service from the Zustand store.
 * Subscribes the React component to the requested service.
 */
export function useBackendService<K extends keyof BackendServices>(key: K): BackendServices[K] {
    return useBackendServiceStore((state) => {
        const service = state.services[key];
        if (!service) {
            throw new Error(`[useBackendService] Service "${String(key)}" is not registered in the Zustand store.`);
        }
        return service;
    });
}

/**
 * Pure React Custom Hook for registering services and accessing store actions.
 */
export function useBackendServiceRegistry() {
    const registerService = useBackendServiceStore((state) => state.registerService);
    const services = useBackendServiceStore((state) => state.services);

    return {
        registerService,
        services
    };
}
