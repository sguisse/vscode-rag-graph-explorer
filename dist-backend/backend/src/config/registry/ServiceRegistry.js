"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.serviceRegistry = exports.ServiceRegistry = void 0;
class ServiceRegistry {
    static instance;
    services = new Map();
    constructor() {
    }
    static getInstance() {
        if (!ServiceRegistry.instance) {
            ServiceRegistry.instance = new ServiceRegistry();
        }
        return ServiceRegistry.instance;
    }
    /**
     * Registers a service implementation
     */
    register(key, service) {
        this.services.set(key, service);
        return this; // Allows chaining (.register().register())
    }
    /**
     * Retrieves a registered service
     */
    get(key) {
        const service = this.services.get(key);
        if (!service) {
            throw new Error(`[ServiceRegistry] The service "${String(key)}" has not been registered.`);
        }
        return service;
    }
    has(key) {
        return this.services.has(key);
    }
    count() {
        return this.services.size;
    }
}
exports.ServiceRegistry = ServiceRegistry;
exports.serviceRegistry = ServiceRegistry.getInstance();
//# sourceMappingURL=ServiceRegistry.js.map