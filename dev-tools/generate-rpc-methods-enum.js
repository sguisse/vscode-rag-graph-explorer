const fs = require('fs');
const path = require('path');

const rootDir = path.resolve(__dirname, '../');
const servicesDir = path.join(rootDir, 'shared/services');
const outputPath = path.join(rootDir, 'shared/config/rpc-methods.enum.gen.ts');

const IGNORED_KEYWORDS = new Set([
    'export', 'interface', 'import', 'type', 'from', 'return',
    'if', 'for', 'while', 'switch', 'function', 'const', 'let', 'var'
]);

function findPortFiles(dir, fileList = []) {
    if (!fs.existsSync(dir)) return fileList;
    const files = fs.readdirSync(dir);
    for (const file of files) {
        const filePath = path.join(dir, file);
        const stat = fs.statSync(filePath);
        if (stat.isDirectory()) {
            findPortFiles(filePath, fileList);
        } else if (file.endsWith('-service.port.ts') || file.endsWith('.port.ts')) {
            fileList.push(filePath);
        }
    }
    return fileList;
}

function camelToUpperSnake(str) {
    return str
        .replace(/([a-z0-9])([A-Z])/g, '$1_$2')
        .replace(/[-_\s]+/g, '_')
        .toUpperCase();
}

function generateRpcMethodsEnum() {
    const portFiles = findPortFiles(servicesDir);
    const enumEntries = [];

    for (const filePath of portFiles) {
        const content = fs.readFileSync(filePath, 'utf-8');
        const fileName = path.basename(filePath, '.ts').replace(/(-service)?\.port$/, '');
        const prefix = fileName.replace(/[^a-zA-Z0-9]/g, '').toUpperCase();

        // Updated regex to support modifiers, optional methods (?) and generics (<...>)
        const methodRegex = /^\s*(?:public\s+|async\s+)?([a-zA-Z0-9_]+)\??\s*(?:<[^>]+>)?\s*\(/gm;
        let match;

        while ((match = methodRegex.exec(content)) !== null) {
            const methodName = match[1];
            if (IGNORED_KEYWORDS.has(methodName)) continue;

            const methodUpperSnake = camelToUpperSnake(methodName);
            const enumKey = `${prefix}_${methodUpperSnake}`;

            enumEntries.push(`    ${enumKey} = '${methodName}'`);
        }
    }

    const fileContent = `// AUTO-GENERATED FILE. DO NOT EDIT DIRECTLY.
// Rebuild using: npm run generate:rpc-methods

export enum RpcMethodEnum {
${enumEntries.join(',\n')}
}
`;

    fs.mkdirSync(path.dirname(outputPath), { recursive: true });
    fs.writeFileSync(outputPath, fileContent, 'utf-8');
    console.log(`✅ Successfully generated RpcMethodEnum at:\n   ${outputPath}`);
}

generateRpcMethodsEnum();
