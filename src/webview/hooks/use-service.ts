import type { AppServices } from '@/common/services/registry/services.types';
import { useServiceStore } from '@/webview/store/useServiceStore';

/**
 * Pure React Custom Hook to inject a specific service from the Zustand store.
 * Subscribes the React component to the requested service.
 */
export function useService<K extends keyof AppServices>(key: K): AppServices[K] {
    return useServiceStore((state) => {
        const service = state.services[key];
        if (!service) {
            throw new Error(`[useService] Service "${String(key)}" is not registered in the Zustand store.`);
        }
        return service;
    });
}

/**
 * Pure React Custom Hook for registering services and accessing store actions.
 */
export function useServiceRegistry() {
    const registerService = useServiceStore((state) => state.registerService);
    const services = useServiceStore((state) => state.services);

    return {
        registerService,
        services
    };
}
