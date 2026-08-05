import * as vscode from 'vscode';
import { serviceRegistry } from '../../core/ServiceRegistry';

import { LoggerService } from '../../services/logger.service';
import { ServiceEnum } from '../../../../shared/config/service-enum';
import { ILoggerService } from '../../../../shared/services/logger-service.interface';


export interface BackendServicesMap {
    [ServiceEnum.LOGGER]: ILoggerService;
}

/**
 * Instantiates and registers all backend application services into the ServiceRegistry container.
 */
export function registerServices(context: vscode.ExtensionContext): void {
    const loggerService = new LoggerService(context);

    serviceRegistry
        .register(ServiceEnum.LOGGER, loggerService);
        //.register(SERVICE_KEYS.GRAPH_RAG_INSTALLER, graphRagInstallerService);

    // Track disposables in VS Code extension context
    context.subscriptions.push(loggerService);
}
