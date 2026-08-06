const fs = require('fs');
const path = require('path');

const rootDir = path.resolve(__dirname, '../');
const backendServicesDir = path.join(rootDir, 'backend/src/services');
const sharedServicesDir = path.join(rootDir, 'shared/services');
const registryDir = path.join(rootDir, 'backend/src/config/registry');
const outputPath = path.join(registryDir, 'service-registrator.gen.ts');

function findFiles(dir, filter, fileList = []) {
    if (!fs.existsSync(dir)) return fileList;
    const files = fs.readdirSync(dir);
    for (const file of files) {
        const filePath = path.join(dir, file);
        const stat = fs.statSync(filePath);
        if (stat.isDirectory()) {
            findFiles(filePath, filter, fileList);
        } else if (filter(file)) {
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

function getRelativeImportPath(fromDir, toFile) {
    let relPath = path.relative(fromDir, toFile).replace(/\\/g, '/');
    if (relPath.endsWith('.ts')) relPath = relPath.slice(0, -3);
    return relPath.startsWith('.') ? relPath : `./${relPath}`;
}

function generateServiceRegistrator() {
    // Match any adapter file (*.adapter.ts, *.adapter-mock.ts, etc.)
    const adapterFiles = findFiles(backendServicesDir, (f) => f.includes('.adapter') && f.endsWith('.ts'));
    const portFiles = findFiles(sharedServicesDir, (f) => f.endsWith('.port.ts') || f.endsWith('-service.port.ts'));

    const serviceRegistrations = [];
    const adapterImports = [];
    const portImports = [];
    const mapEntries = [];

    for (const adapterPath of adapterFiles) {
        const adapterContent = fs.readFileSync(adapterPath, 'utf-8');

        // Match adapter class and implemented port
        const classMatch = adapterContent.match(/export\s+class\s+([A-Za-z0-9_]+)/);
        const portMatch = adapterContent.match(/implements\s+([I][A-Za-z0-9_]+Port)/);

        if (!classMatch || !portMatch) continue;

        const adapterClass = classMatch[1];
        const portInterface = portMatch[1];

        // Find corresponding port file
        const portFilePath = portFiles.find((p) => {
            const pContent = fs.readFileSync(p, 'utf-8');
            return pContent.includes(`interface ${portInterface}`);
        });

        if (!portFilePath) continue;

        // Derive ServiceEnum key name (e.g., ICodebaseServicePort -> CODEBASE)
        const cleanPortName = portInterface
            .replace(/^I/, '')
            .replace(/ServicePort$/, '')
            .replace(/Port$/, '');
        const enumKey = camelToUpperSnake(cleanPortName);

        // Derive variable name (e.g., codebaseService)
        const instanceVar = `${cleanPortName.charAt(0).toLowerCase()}${cleanPortName.slice(1)}Service`;

        // Determine constructor arguments
        const needsContext = adapterContent.includes('constructor(') && adapterContent.includes('vscode.ExtensionContext');
        const instantiator = needsContext ? `new ${adapterClass}(context)` : `new ${adapterClass}()`;

        // Determine disposable tracking
        const isDisposable = adapterContent.includes('Disposable') || adapterContent.includes('dispose()');

        // Relative import paths
        const adapterImportPath = getRelativeImportPath(registryDir, adapterPath);
        const portImportPath = getRelativeImportPath(registryDir, portFilePath);

        adapterImports.push(`import { ${adapterClass} } from '${adapterImportPath}';`);
        portImports.push(`import { ${portInterface} } from '${portImportPath}';`);

        mapEntries.push(`    [ServiceEnum.${enumKey}]: ${portInterface};`);

        let regCode = `    const ${instanceVar} = ${instantiator};\n`;
        regCode += `    serviceRegistry.register(ServiceEnum.${enumKey}, ${instanceVar});`;
        if (isDisposable) {
            regCode += `\n    context.subscriptions.push(${instanceVar});`;
        }
        serviceRegistrations.push(regCode);
    }

    const fileContent = `// AUTO-GENERATED FILE. DO NOT EDIT DIRECTLY.
// Rebuild using: npm run generate:service-registrator

import * as vscode from 'vscode';
import { serviceRegistry } from '../../core/ServiceRegistry';
import { ServiceEnum } from '../../../../shared/config/service-enum.gen';

${adapterImports.join('\n')}
${portImports.join('\n')}

export interface BackendServicesMap {
${mapEntries.join('\n')}
}

/**
 * Instantiates and registers all backend application services into the ServiceRegistry container.
 */
export function registerServices(context: vscode.ExtensionContext): void {
${serviceRegistrations.join('\n\n')}
}
`;

    fs.mkdirSync(registryDir, { recursive: true });
    fs.writeFileSync(outputPath, fileContent, 'utf-8');
    console.log(`✅ Successfully generated service-registrator.gen.ts at:\n   ${outputPath}`);
}

generateServiceRegistrator();
