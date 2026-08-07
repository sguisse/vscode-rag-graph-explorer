const fs = require('fs');
const path = require('path');

const rootDir = path.resolve(__dirname, '../');
const packageJsonPath = path.join(rootDir, 'package.json');
const tsOutputPath = path.join(rootDir, 'shared/services/vscode/domain/model/VsCodeSettings.gen.ts');
const pyOutputPath = path.join(rootDir, 'scripts/core/VsCodeSettings_gen.py');

const SCOPE_PREFIX = 'tokenRazor.';

function generateModels() {
    if (!fs.existsSync(packageJsonPath)) {
        console.error(`❌ package.json not found at: ${packageJsonPath}`);
        process.exit(1);
    }

    const pkg = JSON.parse(fs.readFileSync(packageJsonPath, 'utf-8'));
    const properties = pkg.contributes?.configuration?.properties || {};

    const nestedObj = {};

    for (const [fullKey, spec] of Object.entries(properties)) {
        const relativeKey = fullKey.startsWith(SCOPE_PREFIX)
            ? fullKey.slice(SCOPE_PREFIX.length)
            : fullKey;

        const parts = relativeKey.split('.');
        let current = nestedObj;

        for (let i = 0; i < parts.length; i++) {
            const part = parts[i];
            if (i === parts.length - 1) {
                current[part] = spec.default !== undefined ? spec.default : null;
            } else {
                if (!current[part] || typeof current[part] !== 'object' || Array.isArray(current[part])) {
                    current[part] = {};
                }
                current = current[part];
            }
        }
    }

    // --- TypeScript Model Generation ---
    function formatObjectLiteral(obj, indentLevel = 2) {
        const indent = '    '.repeat(indentLevel);
        const entries = Object.entries(obj);
        const lines = [];

        for (const [key, val] of entries) {
            if (val !== null && typeof val === 'object' && !Array.isArray(val)) {
                lines.push(`${indent}${key}: {\n${formatObjectLiteral(val, indentLevel + 1)}\n${indent}}`);
            } else {
                lines.push(`${indent}${key}: ${JSON.stringify(val)}`);
            }
        }
        return lines.join(',\n');
    }

    function formatClassBody(obj) {
        const indent = '    ';
        const lines = [];

        for (const [key, val] of Object.entries(obj)) {
            if (val !== null && typeof val === 'object' && !Array.isArray(val)) {
                lines.push(`${indent}${key} = {\n${formatObjectLiteral(val, 2)}\n${indent}};`);
            } else {
                lines.push(`${indent}${key} = ${JSON.stringify(val)};`);
            }
        }
        return lines.join('\n\n');
    }

    const classBody = formatClassBody(nestedObj);
    const tsContent = `// AUTO-GENERATED FILE. DO NOT EDIT DIRECTLY.
// Rebuild using: npm run generate:settings

export class VsCodeSettings {
${classBody}

    /**
     * Instantiates VsCodeSettings populated with transposed nested object values.
     */
    public static fromMap(data: Record<string, any>): VsCodeSettings {
        const settings = new VsCodeSettings();
        return Object.assign(settings, data);
    }
}
`;

    fs.mkdirSync(path.dirname(tsOutputPath), { recursive: true });
    fs.writeFileSync(tsOutputPath, tsContent, 'utf-8');
    console.log(`✅ Successfully rebuilt TypeScript VsCodeSettings model at:\n   ${tsOutputPath}`);

    // --- Python Dataclass Model Generation ---
    function getPythonType(val) {
        if (typeof val === 'boolean') return 'bool';
        if (typeof val === 'number') return Number.isInteger(val) ? 'int' : 'float';
        if (Array.isArray(val)) return 'list';
        if (typeof val === 'string') return 'str';
        return 'Any';
    }

    function formatPythonValue(val) {
        if (typeof val === 'boolean') return val ? 'True' : 'False';
        if (val === null) return 'None';
        if (Array.isArray(val) || typeof val === 'object') return `field(default_factory=lambda: ${JSON.stringify(val)})`;
        return JSON.stringify(val);
    }

    let pyClasses = [];

    function generatePyClass(className, obj) {
        let lines = [];
        lines.push('@dataclass');
        lines.push(`class ${className}:`);
        let hasProps = false;
        let dictAssignments = [];

        if (className === 'VsCodeSettings') {
            lines.push('    workspaceRoot: str = ""');
            dictAssignments.push('        if "workspaceRoot" in data:\n            obj.workspaceRoot = data["workspaceRoot"]');
            hasProps = true;
        }

        for (const [key, val] of Object.entries(obj)) {
            if (val !== null && typeof val === 'object' && !Array.isArray(val)) {
                const nestedClassName = key.charAt(0).toUpperCase() + key.slice(1) + 'Settings';
                generatePyClass(nestedClassName, val);
                lines.push(`    ${key}: "${nestedClassName}" = field(default_factory=${nestedClassName})`);
                dictAssignments.push(`        if "${key}" in data:\n            obj.${key} = ${nestedClassName}.from_dict(data["${key}"])`);
                hasProps = true;
            } else {
                lines.push(`    ${key}: ${getPythonType(val)} = ${formatPythonValue(val)}`);
                dictAssignments.push(`        if "${key}" in data:\n            obj.${key} = data["${key}"]`);
                hasProps = true;
            }
        }
        if (!hasProps) lines.push('    pass');

        lines.push('');
        lines.push('    @classmethod');
        lines.push(`    def from_dict(cls, data: dict) -> "${className}":`);
        lines.push('        obj = cls()');
        lines.push('        if not isinstance(data, dict): return obj');
        if (dictAssignments.length > 0) {
            lines.push(dictAssignments.join('\n'));
        }
        lines.push('        return obj');
        lines.push('');

        if (className === 'VsCodeSettings') {
            lines.push('    def inject_vscode_settings(self, data: dict) -> None:');
            lines.push('        root_key = next(iter(data.keys()), "tokenRazor") if data else "tokenRazor"');
            lines.push('        root_data = data.get(root_key, {})');
            lines.push('        if not isinstance(root_data, dict): root_data = data');
            lines.push('        parsed = self.from_dict(root_data)');
            lines.push('        self.__dict__.update(parsed.__dict__)');
            lines.push('');
        }

        pyClasses.push(lines.join('\n'));
    }

    generatePyClass('VsCodeSettings', nestedObj);

    fs.mkdirSync(path.dirname(pyOutputPath), { recursive: true });
    const pyContent = `# AUTO-GENERATED FILE. DO NOT EDIT DIRECTLY.
from dataclasses import dataclass, field
from typing import List, Dict, Any

` + pyClasses.join('\n')
  + '\n\nvsCodeSettings = VsCodeSettings()';

    fs.writeFileSync(pyOutputPath, pyContent, 'utf-8');
    console.log(`🐍 Successfully rebuilt Python VsCodeSettings model at:\n   ${pyOutputPath}`);
}

generateModels();
