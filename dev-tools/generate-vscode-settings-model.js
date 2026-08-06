const fs = require('fs');
const path = require('path');

// Resolve workspace root directory relative to scripts/dev-tools/
const rootDir = path.resolve(__dirname, '../');
const packageJsonPath = path.join(rootDir, 'package.json');
const outputPath = path.join(rootDir, 'shared/services/vscode/domain/model/VsCodeSettings.gen.ts');

const SCOPE_PREFIX = 'tokenRazor.';

function generateVsCodeSettingsModel() {
    if (!fs.existsSync(packageJsonPath)) {
        console.error(`❌ package.json not found at: ${packageJsonPath}`);
        process.exit(1);
    }

    const pkg = JSON.parse(fs.readFileSync(packageJsonPath, 'utf-8'));
    const properties = pkg.contributes?.configuration?.properties || {};

    const nestedObj = {};

    // 1. Unflatten dot-separated keys into a nested structure
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

    // 2. Format nested object literals (key: value,)
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

    // 3. Format top-level class properties (key = value;)
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

    const fileContent = `// AUTO-GENERATED FILE. DO NOT EDIT DIRECTLY.
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

    fs.mkdirSync(path.dirname(outputPath), { recursive: true });
    fs.writeFileSync(outputPath, fileContent, 'utf-8');
    console.log(`✅ Successfully rebuilt VsCodeSettings model at:\n   ${outputPath}`);
}

generateVsCodeSettingsModel();
