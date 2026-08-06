const fs = require('fs');
const path = require('path');

const rootDir = path.resolve(__dirname, '../');
const servicesDir = path.join(rootDir, 'shared/services');
const outputPath = path.join(rootDir, 'shared/config/service-enum.gen.ts');

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

function generateServiceEnum() {
    const portFiles = findPortFiles(servicesDir);
    const enumEntries = [];

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

        const enumKey = camelToUpperSnake(serviceBaseName);
        const enumValue = `${serviceBaseName}Service`;

        enumEntries.push(`    ${enumKey} = '${enumValue}'`);
    }

    const fileContent = `// AUTO-GENERATED FILE. DO NOT EDIT DIRECTLY.
// Rebuild using: npm run generate:service-enum

export enum ServiceEnum {
${enumEntries.join(',\n')}
}
`;

    fs.mkdirSync(path.dirname(outputPath), { recursive: true });
    fs.writeFileSync(outputPath, fileContent, 'utf-8');
    console.log(`✅ Successfully generated ServiceEnum at:\n   ${outputPath}`);
}

generateServiceEnum();
