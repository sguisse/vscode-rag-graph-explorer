import { BackendServices } from './services.types';

export class ServiceRegistry {
    private services = new Map<keyof BackendServices, any>();

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
            throw new Error(`[ServiceRegistry] Le service "${String(key)}" n'a pas été enregistré.`);
        }
        return service;
    }
}
