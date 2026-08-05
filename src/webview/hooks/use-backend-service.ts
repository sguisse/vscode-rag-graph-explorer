import type { BackendServices } from '@/backend/config/registry/services.types';
import { serviceRegistry } from '@/backend/config/registry/ServiceRegistry';

/**
 * Pure React Custom Hook to inject a specific service from ServiceRegistry.
 */
export function useBackendService<K extends keyof BackendServices>(key: K): BackendServices[K] {
    return serviceRegistry.get(key);
}

/**
 * Pure React Custom Hook for registering services and accessing ServiceRegistry.
 */
export function useBackendServiceRegistry() {
    return {
        registerService: <K extends keyof BackendServices>(key: K, service: BackendServices[K]) =>
            serviceRegistry.register(key, service),
        services: serviceRegistry
    };
}
