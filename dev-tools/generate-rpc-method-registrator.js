const fs = require('fs');
const path = require('path');

const rootDir = path.resolve(__dirname, '../');
const sharedServicesDir = path.join(rootDir, 'shared/services');
const rpcDir = path.join(rootDir, 'backend/src/config');
const outputPath = path.join(rpcDir, 'rpc-method-registrator.gen.ts');

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

function generateRpcMethodRegistrator() {
    const portFiles = findPortFiles(sharedServicesDir);
    const serviceMap = new Map();

    for (const filePath of portFiles) {
        const content = fs.readFileSync(filePath, 'utf-8');
        const interfaceMatch = content.match(/export\s+interface\s+I([A-Za-z0-9]+)ServicePort/);

        let serviceBaseName = '';
        if (interfaceMatch) {
            serviceBaseName = interfaceMatch[1];
        } else {
            const fileName = path.basename(filePath, '.ts').replace(/(-service)?\.port$/, '');
            serviceBaseName = fileName.split('-').map(p => p.charAt(0).toUpperCase() + p.slice(1)).join('');
        }

        const serviceEnumKey = camelToUpperSnake(serviceBaseName);
        const varName = `${serviceBaseName.charAt(0).toLowerCase()}${serviceBaseName.slice(1)}Service`;

        const fileName = path.basename(filePath, '.ts').replace(/(-service)?\.port$/, '');
        const rpcPrefix = fileName.replace(/[^a-zA-Z0-9]/g, '').toUpperCase();

        const methodRegex = /^\s*(?:public\s+|async\s+)?([a-zA-Z0-9_]+)\??\s*(?:<[^>]+>)?\s*\(/gm;
        let match;
        const methods = [];

        while ((match = methodRegex.exec(content)) !== null) {
            const methodName = match[1];
            if (IGNORED_KEYWORDS.has(methodName)) continue;

            const methodUpperSnake = camelToUpperSnake(methodName);
            const rpcEnumKey = `${rpcPrefix}_${methodUpperSnake}`;
            methods.push({ enumKey: rpcEnumKey, methodName });
        }

        if (methods.length > 0) {
            serviceMap.set(serviceEnumKey, { varName, methods });
        }
    }

    const registrationBlocks = [];

    for (const [serviceEnumKey, { varName, methods }] of serviceMap.entries()) {
        let block = `    const ${varName} = serviceRegistry.get(ServiceEnum.${serviceEnumKey});\n`;
        for (const { enumKey, methodName } of methods) {
            block += `    rpc.register(RpcMethodEnum.${enumKey}, ${varName}.${methodName}.bind(${varName}));\n`;
        }
        registrationBlocks.push(block.trimEnd());
    }

    const fileContent = `// AUTO-GENERATED FILE. DO NOT EDIT DIRECTLY.
// Rebuild using: npm run generate:rpc-registrator

import { serviceRegistry } from '../core/ServiceRegistry';
import { ServiceEnum } from '../../../shared/config/service-enum.gen';
import { RpcMethodEnum } from '../../../shared/config/rpc-methods.enum.gen';
import { RpcProtocol } from '../../../shared/rpc/rpc-protocol';

/**
 * Resolves services from the ServiceRegistry and registers all RPC protocol handlers.
 */
export function registerRpcMethods(rpc: RpcProtocol): void {
${registrationBlocks.join('\n\n')}
}
`;

    fs.mkdirSync(rpcDir, { recursive: true });
    fs.writeFileSync(outputPath, fileContent, 'utf-8');
    console.log(`✅ Successfully generated rpc-method-registrator.gen.ts at:\n   ${outputPath}`);
}

generateRpcMethodRegistrator();
