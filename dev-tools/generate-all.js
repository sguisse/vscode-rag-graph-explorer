const path = require('path');

console.log('🚀 Starting full code generation pipeline...\n');

try {
    require('./generate-vscode-settings-model.js');
    require('./generate-vscode-message-event.enum.js');
    require('./generate-service-enum.js');
    require('./generate-rpc-methods-enum.js');
    require('./generate-service-registrator.js');
    require('./generate-rpc-method-registrator.js');
    require('./generate-webview-api-services.js');

    console.log('\n✨ All 7 code generation tasks completed successfully!');
} catch (error) {
    console.error('\n❌ Code generation failed:', error);
    process.exit(1);
}
