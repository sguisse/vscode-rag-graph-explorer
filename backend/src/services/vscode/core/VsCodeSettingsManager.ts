import * as vscode from 'vscode';
import { VsCodeSettings } from '../../../../../shared/services/vscode/domain/model/VsCodeSettings.gen';

export class VsCodeSettingsManager {
    private static referenceRegex = /\${([^}]+)}/g;
    private static baseScope: string = '';

    public static init(baseScope: string): void {
        this.baseScope = baseScope && !baseScope.endsWith('.') ? `${baseScope}.` : baseScope;
    }

    /**
     * Recursively transforms dot-notated flat keys into a nested object graph.
     */
    public static unflatten(flatObj: Record<string, any>): Record<string, any> {
        const result: Record<string, any> = {};

        for (const key of Object.keys(flatObj)) {
            const value = flatObj[key];
            const parts = key.split('.');
            let current = result;

            for (let i = 0; i < parts.length; i++) {
                const part = parts[i];
                if (i === parts.length - 1) {
                    current[part] = value;
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

    /**
     * Retrieves settings loaded from VS Code workspace configuration, resolves placeholders,
     * unflattens dot keys, and injects them into a new VsCodeSettings instance.
     */
    public static getSettings(): VsCodeSettings {
        const flatMap = this.getResolvedFlatMap();
        const nestedMap = this.unflatten(flatMap);
        return VsCodeSettings.fromMap(nestedMap);
    }

    /**
     * Returns the transposed configuration object as a plain nested dictionary.
     */
    public static getMap(): Record<string, any> {
        return this.unflatten(this.getResolvedFlatMap());
    }

    public static get<T>(relativeKey: string, defaultValue?: T): T {
        const absoluteKey = (this.baseScope && !relativeKey.startsWith(this.baseScope))
            ? `${this.baseScope}${relativeKey}`
            : relativeKey;

        return this.resolveValue(absoluteKey, new Set<string>(), defaultValue);
    }

    private static getResolvedFlatMap(): Record<string, any> {
        const scopeClean = this.baseScope.endsWith('.') ? this.baseScope.slice(0, -1) : this.baseScope;
        const config = vscode.workspace.getConfiguration(scopeClean);
        const configMap: Record<string, any> = {};

        for (const key of Object.keys(config)) {
            if (typeof config[key] !== 'function') {
                configMap[key] = this.resolveAllPlaceholders(config[key]);
            }
        }

        return configMap;
    }

    private static resolveAllPlaceholders(value: any): any {
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

    private static resolveValue<T>(absoluteKey: string, visited: Set<string>, defaultValue?: T): T {
        if (visited.has(absoluteKey)) {
            console.warn(`[VsCodeSettingsManager] Circular reference detected for: "${absoluteKey}".`);
            return defaultValue as T;
        }

        let value = vscode.workspace.getConfiguration().get<any>(absoluteKey);
        if (value === undefined || value === null) {
            return defaultValue as T;
        }

        visited.add(absoluteKey);
        if (typeof value === 'string') {
            value = this.interpolate(value, visited);
        }
        visited.delete(absoluteKey);

        return value as T;
    }

    private static interpolate(input: string, visited: Set<string>): string {
        return input.replace(this.referenceRegex, (match, expression) => {
            const targetKey = expression.trim();
            const resolvedValue = this.resolveValue(targetKey, visited);

            if (resolvedValue !== undefined && resolvedValue !== null) {
                return String(resolvedValue);
            }
            return match;
        });
    }
}
