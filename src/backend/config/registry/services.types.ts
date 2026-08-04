import { ICodebaseServicePort } from "@/backend/services/codebase/domain/port-out/codebase-service.port";
import type { ILoggerServicePort } from "@/backend/services/vscode/domain/port-out/logger-service.port";

// Global contract for application backend services
export interface BackendServices {
    logger: ILoggerServicePort;
    codebaseService : ICodebaseServicePort;
}
