import { BackendServices } from './services.types';

export class ServiceRegistry {
    private static instance: ServiceRegistry;
    private services = new Map<keyof BackendServices, any>();

    private constructor() {

    }

    public static getInstance(): ServiceRegistry {
        if (!ServiceRegistry.instance) {
            ServiceRegistry.instance = new ServiceRegistry();
        }
        return ServiceRegistry.instance;
    }

    /**
     * Registers a service implementation
     */
    public register<K extends keyof BackendServices>(key: K, service: BackendServices[K]): this {
        this.services.set(key, service);
        return this; // Allows chaining (.register().register())
    }

    /**
     * Retrieves a registered service
     */
    public get<K extends keyof BackendServices>(key: K): BackendServices[K] {
        const service = this.services.get(key);
        if (!service) {
            throw new Error(`[ServiceRegistry] The service "${String(key)}" has not been registered.`);
        }
        return service;
    }

    public has<K extends keyof BackendServices>(key: K): boolean {
        return this.services.has(key);
    }

    public count(): number {
        return this.services.size;
    }
}

export const serviceRegistry = ServiceRegistry.getInstance();
