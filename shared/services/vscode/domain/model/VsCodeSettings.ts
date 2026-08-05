import * as vscode from 'vscode';

export class VsCodeSettings {
    private static referenceRegex = /\${([^}]+)}/g;
    private static baseScope: string = '';

    /**
     * Initializes the static settings utility with your extension's main prefix.
     */
    public static init(baseScope: string): void {
        this.baseScope = baseScope && !baseScope.endsWith('.') ? `${baseScope}.` : baseScope;
    }

    /**
     * Checks if a specific configuration key exists within the scope.
     */
    public static containsKey(relativeKey: string): boolean {
        const absoluteKey = (this.baseScope && !relativeKey.startsWith(this.baseScope))
            ? `${this.baseScope}${relativeKey}`
            : relativeKey;

        // Returns true if the key has a defined workspace configuration value
        return vscode.workspace.getConfiguration().has(absoluteKey);
    }

    /**
     * Retrieves the fully-resolved configuration map.
     * Direct alias to toJson() for clean object mapping.
     */
    public static getMap(): Record<string, any> {
        return this.toJson();
    }

    /**
     * Retrieves a configuration value by its relative key and resolves internal references.
     */
    public static get<T>(relativeKey: string, defaultValue?: T): T {
        const absoluteKey = (this.baseScope && !relativeKey.startsWith(this.baseScope))
            ? `${this.baseScope}${relativeKey}`
            : relativeKey;

        return this.resolveValue(absoluteKey, new Set<string>(), defaultValue);
    }

    /**
     * Exports all configuration keys under the initialized scope into a clean,
     * fully resolved JSON object ready to be passed to your Python backend.
     */
    public static toJson(): Record<string, any> {
        const scopeClean = this.baseScope.endsWith('.') ? this.baseScope.slice(0, -1) : this.baseScope;
        const config = vscode.workspace.getConfiguration(scopeClean);

        const configMap: Record<string, any> = {};

        // Extract plain values from the VS Code WorkspaceConfiguration proxy object
        for (const key of Object.keys(config)) {
            if (typeof config[key] !== 'function') {
                configMap[key] = this.resolveAllPlaceholders(config[key]);
            }
        }

        // Nest inside the root scope key so absolute dictionary paths are preserved in Python
        return scopeClean ? { [scopeClean]: configMap } : configMap;
    }

    /**
     * Deep recursive walker to evaluate and resolve strings anywhere inside arrays or objects.
     */
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
            console.warn(`[VsCodeSettings] Circular reference detected for: "${absoluteKey}".`);
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
