const fs = require('fs');
const path = require('path');

const rootDir = path.resolve(__dirname, '../');
const sharedDir = path.join(rootDir, 'shared');
const sharedServicesDir = path.join(sharedDir, 'services');
const outputDir = path.join(rootDir, 'webview/src/services/api');

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

function camelToKebab(str) {
    return str
        .replace(/([a-z0-9])([A-Z])/g, '$1-$2')
        .replace(/[-_\s]+/g, '-')
        .toLowerCase();
}

function parseParamNames(rawParams) {
    if (!rawParams || !rawParams.trim()) return [];

    const params = [];
    let current = '';
    let depthAngle = 0;
    let depthParen = 0;
    let depthCurly = 0;
    let depthSquare = 0;

    for (let i = 0; i < rawParams.length; i++) {
        const char = rawParams[i];
        if (char === '<') depthAngle++;
        else if (char === '>') depthAngle--;
        else if (char === '(') depthParen++;
        else if (char === ')') depthParen--;
        else if (char === '{') depthCurly++;
        else if (char === '}') depthCurly--;
        else if (char === '[') depthSquare++;
        else if (char === ']') depthSquare--;

        if (char === ',' && depthAngle === 0 && depthParen === 0 && depthCurly === 0 && depthSquare === 0) {
            params.push(current.trim());
            current = '';
        } else {
            current += char;
        }
    }
    if (current.trim()) {
        params.push(current.trim());
    }

    return params
        .map(p => p.replace(/\s+/g, ' '))
        .map(p => p.split(':')[0].trim().replace(/\?$/, ''))
        .filter(Boolean);
}

function resolveSharedImport(importLine, portFilePath) {
    const match = importLine.match(/import\s+(?:type\s+)?({[^}]+}|[^*'{}\s]+)\s+from\s+['"]([^'"]+)['"]/);
    if (!match) return null;

    const importedItems = match[1];
    const rawPath = match[2];

    if (importedItems.includes('IBackendService')) return null;

    const portFileDir = path.dirname(portFilePath);
    const absoluteImportPath = path.resolve(portFileDir, rawPath);
    const relToShared = path.relative(sharedDir, absoluteImportPath).replace(/\\/g, '/');

    return `import ${importedItems} from '@/shared/${relToShared}';`;
}

function generateWebviewApiServices() {
    const portFiles = findPortFiles(sharedServicesDir);

    for (const filePath of portFiles) {
        const content = fs.readFileSync(filePath, 'utf-8');
        const fileName = path.basename(filePath, '.ts').replace(/(-service)?\.port$/, '');
        const rpcPrefix = fileName.replace(/[^a-zA-Z0-9]/g, '').toUpperCase();

        const interfaceMatch = content.match(/export\s+interface\s+I([A-Za-z0-9]+)ServicePort/);
        let serviceBaseName = '';
        if (interfaceMatch) {
            serviceBaseName = interfaceMatch[1];
        } else {
            serviceBaseName = fileName.split('-').map(p => p.charAt(0).toUpperCase() + p.slice(1)).join('');
        }

        const portInterfaceName = interfaceMatch ? `I${serviceBaseName}ServicePort` : `I${serviceBaseName}Port`;
        const className = `${serviceBaseName}ApiService`;
        const instanceName = `${serviceBaseName.charAt(0).toLowerCase()}${serviceBaseName.slice(1)}ApiService`;
        const outFileName = `${camelToKebab(serviceBaseName)}-api.service.gen.ts`;

        const lines = content.split('\n');
        const convertedImports = [];
        for (const line of lines) {
            if (line.trim().startsWith('import ')) {
                const converted = resolveSharedImport(line, filePath);
                if (converted) convertedImports.push(converted);
            }
        }

        const portRelPath = path.relative(sharedDir, filePath).replace(/\\/g, '/').replace(/\.ts$/, '');
        convertedImports.push(`import { ${portInterfaceName} } from '@/shared/${portRelPath}';`);

        const methodRegex = /^\s*([a-zA-Z0-9_]+)\s*\(([\s\S]*?)\)\s*:\s*([^;]+);/gm;
        let match;
        const methodDeclarations = [];

        while ((match = methodRegex.exec(content)) !== null) {
            const methodName = match[1];
            const rawParams = match[2].trim();
            let rawReturnType = match[3].trim();

            const methodUpperSnake = camelToUpperSnake(methodName);
            const rpcEnumKey = `${rpcPrefix}_${methodUpperSnake}`;

            const paramNames = parseParamNames(rawParams);

            let returnType = rawReturnType;
            if (!returnType.startsWith('Promise<')) {
                returnType = `Promise<${returnType}>`;
            }

            const cleanParamsSingleLine = rawParams.replace(/\s+/g, ' ');

            const rpcCallArgs = [
                `RpcMethodEnum.${rpcEnumKey}`,
                ...paramNames
            ].join(', ');

            const methodCode = `    public async ${methodName}(${cleanParamsSingleLine}): ${returnType} {\n        return await this.rpc.call(${rpcCallArgs});\n    }`;
            methodDeclarations.push(methodCode);
        }

        const fileContent = `// AUTO-GENERATED FILE. DO NOT EDIT DIRECTLY.
// Rebuild using: npm run generate:webview-api-services

import { RpcMethodEnum } from '@/shared/config/rpc-methods.enum.gen';
import { AbstractApiService } from './abstract-api.service';
${convertedImports.join('\n')}

class ${className} extends AbstractApiService implements ${portInterfaceName} {
    constructor() {
        super();
    }

${methodDeclarations.join('\n\n')}
}

export const ${instanceName} = new ${className}();
`;

        fs.mkdirSync(outputDir, { recursive: true });
        const targetFilePath = path.join(outputDir, outFileName);
        fs.writeFileSync(targetFilePath, fileContent, 'utf-8');
        console.log(`✅ Successfully generated Webview API Service at:\n   ${targetFilePath}`);
    }
}

generateWebviewApiServices();
