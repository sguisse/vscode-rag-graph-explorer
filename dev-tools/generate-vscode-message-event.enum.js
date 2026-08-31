const fs = require('fs');
const path = require('path');

// Resolve path relative to project root
const rootDir = path.resolve(__dirname, '../');
const payloadFilePath = path.join(rootDir, 'shared/services/vscode/model/vscode-message-payload.ts');
const outputPath = path.join(rootDir, 'shared/config/vscode-message-event.enum.gen.ts');

function generateVsCodeMessageEventsEnum() {
    if (!fs.existsSync(payloadFilePath)) {
        console.error(`❌ Payload interface file not found at: ${payloadFilePath}`);
        process.exit(1);
    }

    const fileContent = fs.readFileSync(payloadFilePath, 'utf-8');
    const interfaceRegex = /export\s+interface\s+([A-Za-z0-9_]+)/g;
    const enumEntries = [];
    let match;

    // Extract all interface names and replace 'Payload' suffix with 'Message'
    while ((match = interfaceRegex.exec(fileContent)) !== null) {
        const interfaceName = match[1];
        const enumKey = interfaceName.endsWith('Payload')
            ? interfaceName.replace(/Payload$/, 'Message')
            : `${interfaceName}Message`;

        enumEntries.push(`    ${enumKey} = '${enumKey}'`);
    }

    const generatedEnum = `// AUTO-GENERATED FILE. DO NOT EDIT DIRECTLY.
// Rebuild using: npm run generate:message-events

export enum VsCodeMessageEventEnum {
${enumEntries.join(',\n')}
}
`;

    fs.mkdirSync(path.dirname(outputPath), { recursive: true });
    fs.writeFileSync(outputPath, generatedEnum, 'utf-8');
    console.log(`✅ Successfully generated VsCodeMessageEventEnum at:\n   ${outputPath}`);
}

generateVsCodeMessageEventsEnum();
