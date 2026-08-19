'use strict';
import * as vscode from 'vscode';
import { VsCodeSettings } from '../../../shared/services/vscode/domain/model/VsCodeSettings.gen';

export class VsCodeSettingsManager {
    private static instance: VsCodeSettingsManager;
    public static readonly SCOPE = 'tokenRazor';

    private constructor() {}

    public static getInstance(): VsCodeSettingsManager {
        if (!VsCodeSettingsManager.instance) {
            VsCodeSettingsManager.instance = new VsCodeSettingsManager();
        }
        return VsCodeSettingsManager.instance;
    }

    /**
     * Unflattens dot-notated keys into a nested object graph.
     */
    public unflatten(flatObj: Record<string, any>): Record<string, any> {
        const result: Record<string, any> = {};

        for (const key of Object.keys(flatObj)) {
            const parts = key.split('.');
            let current = result;

            for (let i = 0; i < parts.length; i++) {
                const part = parts[i];
                if (i === parts.length - 1) {
                    current[part] = flatObj[key];
                } else {
                    if (!current[part] || typeof current[part] !== 'object' || Array.isArray(current[part])) {
                        current[part] = {};
                    }
                    current = current[part];
                }
            }
        }

        return result;
    }

    public getSettings(): VsCodeSettings {
        const flatMap = this.getResolvedFlatMap();
        return VsCodeSettings.fromMap(this.unflatten(flatMap));
    }

    public getMap(): Record<string, any> {
        return this.unflatten(this.getResolvedFlatMap());
    }

    /**
     * Get a setting by key (e.g. 'pinApplication' or 'tokenRazor.pinApplication')
     */
    public get<T>(key: string, defaultValue?: T, visited = new Set<string>()): T {
        const absoluteKey = key.startsWith(`${VsCodeSettingsManager.SCOPE}.`)
            ? key
            : `${VsCodeSettingsManager.SCOPE}.${key}`;

        return this.resolveValue<T>(absoluteKey, visited, defaultValue);
    }

    private getResolvedFlatMap(): Record<string, any> {
        const config = vscode.workspace.getConfiguration(VsCodeSettingsManager.SCOPE);
        const configMap: Record<string, any> = {};

        for (const key of Object.keys(config)) {
            if (typeof config[key] !== 'function') {
                const value = config.get(key);
                configMap[key] = this.resolveAllPlaceholders(value);
            }
        }

        return configMap;
    }

    private resolveAllPlaceholders(value: any): any {
        if (typeof value === 'string') {
            return this.interpolate(value, new Set<string>());
        }
        if (Array.isArray(value)) {
            return value.map(item => this.resolveAllPlaceholders(item));
        }
        if (value !== null && typeof value === 'object') {
            const resolvedObj: Record<string, any> = {};
            for (const key of Object.keys(value)) {
                resolvedObj[key] = this.resolveAllPlaceholders(value[key]);
            }
            return resolvedObj;
        }
        return value;
    }

    private resolveValue<T>(absoluteKey: string, visited: Set<string>, defaultValue?: T): T {
        if (visited.has(absoluteKey)) {
            console.warn(`[VsCodeSettingsManager] Circular reference detected for: "${absoluteKey}".`);
            return defaultValue as T;
        }

        let value = this.getValueFromVscode(absoluteKey);
        if (value === undefined || value === null) {
            return defaultValue as T;
        }

        visited.add(absoluteKey);
        if (typeof value === 'string') {
            value = this.interpolate(value, visited);
        } else if (value !== null && typeof value === 'object') {
            value = this.resolveAllPlaceholdersInObject(value, visited);
        }
        visited.delete(absoluteKey);

        return value as T;
    }

    /**
     * Attempts direct lookup from VS Code configuration, falling back to nested property path navigation.
     */
    private getValueFromVscode(absoluteKey: string): any {
        // 1. Try direct lookup from root configuration
        let val = vscode.workspace.getConfiguration().get<any>(absoluteKey);
        if (val !== undefined && val !== null) {
            return val;
        }

        // 2. Try direct lookup from scoped configuration
        const relativeKey = absoluteKey.startsWith(`${VsCodeSettingsManager.SCOPE}.`)
            ? absoluteKey.slice(VsCodeSettingsManager.SCOPE.length + 1)
            : absoluteKey;

        const config = vscode.workspace.getConfiguration(VsCodeSettingsManager.SCOPE);
        val = config.get<any>(relativeKey);
        if (val !== undefined && val !== null) {
            return val;
        }

        // 3. Fallback: Navigate dot-path inside scoped configuration object graph
        const parts = relativeKey.split('.');
        if (parts.length > 1) {
            let current = config.get<any>(parts[0]);
            for (let i = 1; i < parts.length; i++) {
                if (current !== null && typeof current === 'object' && parts[i] in current) {
                    current = current[parts[i]];
                } else {
                    return undefined;
                }
            }
            return current;
        }

        return undefined;
    }

    private resolveAllPlaceholdersInObject(obj: Record<string, any>, visited: Set<string>): Record<string, any> {
        const resolvedObj: Record<string, any> = {};
        for (const key of Object.keys(obj)) {
            const val = obj[key];
            if (typeof val === 'string') {
                resolvedObj[key] = this.interpolate(val, visited);
            } else if (Array.isArray(val)) {
                resolvedObj[key] = val.map(item =>
                    typeof item === 'string' ? this.interpolate(item, visited) : item
                );
            } else if (val !== null && typeof val === 'object') {
                resolvedObj[key] = this.resolveAllPlaceholdersInObject(val, visited);
            } else {
                resolvedObj[key] = val;
            }
        }
        return resolvedObj;
    }

    private interpolate(input: string, visited: Set<string>): string {
        const referenceRegex = /\${([^}]+)}/g;
        return input.replace(referenceRegex, (match, expression) => {
            const targetKey = expression.trim();
            const resolvedValue = this.resolveValue(targetKey, visited);

            if (resolvedValue !== undefined && resolvedValue !== null) {
                return String(resolvedValue);
            }
            return match;
        });
    }

    public toJson(): Record<string, any> {
        return { [VsCodeSettingsManager.SCOPE]: this.getResolvedFlatMap() };
    }

    /**
     * Converts a JSON object or JSON string into a formatted string array (one line per element).
     */
    public jsonToStringArray(input: string | object): string[] {
        if (input === undefined || input === null) {
            return [];
        }
        try {
            const parsed = typeof input === 'string' ? JSON.parse(input) : input;
            const formattedString = JSON.stringify(parsed, null, 2);
            return formattedString ? formattedString.split('\n') : [];
        } catch {
            return typeof input === 'string' ? input.split(/\r?\n/) : [];
        }
    }

    /**
     * Reconstructs a string array into a single JSON string and its parsed object representation.
     */
    public stringArrayToJson<T = Record<string, any>>(lines: string[]): { jsonString: string; data: T } {
        if (!Array.isArray(lines) || lines.length === 0) {
            return { jsonString: '{}', data: {} as T };
        }
        try {
            const jsonString = lines.join('\n');
            if (!jsonString.trim()) {
                return { jsonString: '{}', data: {} as T };
            }
            const data = JSON.parse(jsonString) as T;
            return { jsonString, data };
        } catch {
            return { jsonString: '{}', data: {} as T };
        }
    }
}

export const vsCodeSettingsManager = VsCodeSettingsManager.getInstance();
