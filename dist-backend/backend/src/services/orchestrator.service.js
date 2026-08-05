"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.OrchestratorService = void 0;
const vscode = __importStar(require("vscode"));
const python_service_1 = require("./python.service");
class OrchestratorService {
    logChannel;
    pythonService;
    constructor(extensionUri) {
        this.logChannel = vscode.window.createOutputChannel('Token Razor Backend Logs', { log: true });
        this.pythonService = new python_service_1.PythonService(extensionUri);
    }
    formatLogHeader(level) {
        const timestamp = new Date().toISOString().replace('T', ' ').replace('Z', '');
        return `[${timestamp}] [${level.toUpperCase()}]`;
    }
    async logMessage(level, text, details) {
        const header = this.formatLogHeader(level);
        let logLine = `${header} ${text}`;
        if (details !== undefined && details !== null) {
            logLine += typeof details === 'object' ? `\nData:\n${JSON.stringify(details, null, 2)}` : ` | Details: ${details}`;
        }
        if (level === 'warn')
            this.logChannel.warn(logLine);
        else if (level === 'error')
            this.logChannel.error(logLine);
        else
            this.logChannel.info(logLine);
    }
    async runPythonAnalysis(userId) {
        await this.logMessage('info', 'Executing Python script...', { userId });
        return await this.pythonService.executeScript('mon_script.py', ['--user', userId], async (data, isError) => {
            if (data.trim())
                await this.logMessage(isError ? 'error' : 'info', `[Python Process] ${data.trim()}`);
        });
    }
    dispose() {
        this.logChannel.dispose();
    }
}
exports.OrchestratorService = OrchestratorService;
//# sourceMappingURL=orchestrator.service.js.map