import { ServiceEnum } from "../../../shared/config/service-enum";
import { BackendServicesMap } from "../config/registry/service-registrator";

export class ServiceRegistry {
    private static instance: ServiceRegistry;
    private services = new Map<ServiceEnum, BackendServicesMap[ServiceEnum]>();

    private constructor() {}

    public static getInstance(): ServiceRegistry {
        if (!ServiceRegistry.instance) {
            ServiceRegistry.instance = new ServiceRegistry();
        }
        return ServiceRegistry.instance;
    }

    public register<K extends ServiceEnum>(key: K, service: BackendServicesMap[K]): this {
        this.services.set(key, service);
        return this;
    }

    public get<K extends ServiceEnum>(key: K): BackendServicesMap[K] {
        const service = this.services.get(key) as BackendServicesMap[K];
        if (!service) {
            throw new Error(`[ServiceRegistry] The service "${key}" has not been registered.`);
        }
        return service;
    }

    public has(key: ServiceEnum): boolean {
        return this.services.has(key);
    }

    public count(): number {
        return this.services.size;
    }
}

export const serviceRegistry = ServiceRegistry.getInstance();
