import { AppServices } from './services.types';

export class ServiceRegistry {
    private services = new Map<keyof AppServices, any>();

    /**
     * Enregistre une implémentation de service
     */
    public register<K extends keyof AppServices>(key: K, service: AppServices[K]): this {
        this.services.set(key, service);
        return this; // Permet le chaînage (.register().register())
    }

    /**
     * Récupère un service enregistré
     */
    public get<K extends keyof AppServices>(key: K): AppServices[K] {
        const service = this.services.get(key);
        if (!service) {
            throw new Error(`[ServiceRegistry] Le service "${String(key)}" n'a pas été enregistré.`);
        }
        return service;
    }
}
