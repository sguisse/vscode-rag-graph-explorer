#!/usr/bin/env bash
set -e

CODEBASE_MOCK_FILE="backend/src/services/graph-rag-explorer/codebase-service.adapter-mock.ts"
SERVICE_REGISTRATOR_FILE="backend/src/config/service-registrator.gen.ts"
UTILS_LOG_FILE="backend/src/utils/utils-log.ts"

# 1. Update CodebaseMockAdapter to lazily resolve GraphRagInstallerService on demand rather than in constructor
if [ -f "$CODEBASE_MOCK_FILE" ]; then
    node -e '
    const fs = require("fs");
    const filePath = process.argv[1];
    let content = fs.readFileSync(filePath, "utf8");

    const oldCode = `  private currentCodebase: CodebaseData = initialCodebase;
  private graphRagInstallerService: IGraphRagInstallerServicePort ;

constructor() {
    super();
    this.graphRagInstallerService = serviceRegistry.get(ServiceEnum.GRAPH_RAG_INSTALLER);
}`;

    const newCode = `  private currentCodebase: CodebaseData = initialCodebase;
  private _graphRagInstallerService?: IGraphRagInstallerServicePort;

  private get graphRagInstallerService(): IGraphRagInstallerServicePort {
      if (!this._graphRagInstallerService) {
          this._graphRagInstallerService = serviceRegistry.get(ServiceEnum.GRAPH_RAG_INSTALLER);
      }
      return this._graphRagInstallerService;
  }

  constructor() {
      super();
  }`;

    if (content.includes("this.graphRagInstallerService = serviceRegistry.get(ServiceEnum.GRAPH_RAG_INSTALLER);")) {
        content = content.replace(oldCode, newCode);
        fs.writeFileSync(filePath, content, "utf8");
    }
    ' "$CODEBASE_MOCK_FILE"
fi

# 2. Update service registrator to register VsCodeService first so logging works cleanly during activation
if [ -f "$SERVICE_REGISTRATOR_FILE" ]; then
    node -e '
    const fs = require("fs");
    const filePath = process.argv[1];
    let content = fs.readFileSync(filePath, "utf8");

    const newRegistrator = `export function registerServices(context: vscode.ExtensionContext): void {
    const vsCodeService = new VsCodeServiceAdapter();
    serviceRegistry.register(ServiceEnum.VS_CODE, vsCodeService);
    context.subscriptions.push(vsCodeService);

    const graphRagInstallerService = new GraphRagInstallerAdapter();
    serviceRegistry.register(ServiceEnum.GRAPH_RAG_INSTALLER, graphRagInstallerService);
    context.subscriptions.push(graphRagInstallerService);

    const codebaseService = new CodebaseMockAdapter();
    serviceRegistry.register(ServiceEnum.CODEBASE, codebaseService);
    context.subscriptions.push(codebaseService);
}`;

    const regRegex = /export function registerServices[\s\S]*?}/;
    if (regRegex.test(content)) {
        content = content.replace(regRegex, newRegistrator);
        fs.writeFileSync(filePath, content, "utf8");
    }
    ' "$SERVICE_REGISTRATOR_FILE"
fi

# 3. Guard utils-log against unhandled ServiceRegistry lookups before services finish registration
if [ -f "$UTILS_LOG_FILE" ]; then
    node -e '
    const fs = require("fs");
    const filePath = process.argv[1];
    let content = fs.readFileSync(filePath, "utf8");

    const oldSendLog = `function sendLog(level: LogLevel, message: string, details?: any): void {
    // Resolve service lazily when a log function is invoked
    if (!vscodeService) {
        vscodeService = serviceRegistry.get(ServiceEnum.VS_CODE);
    }`;

    const newSendLog = `function sendLog(level: LogLevel, message: string, details?: any): void {
    // Resolve service lazily when a log function is invoked
    if (!vscodeService) {
        if (serviceRegistry.has(ServiceEnum.VS_CODE)) {
            vscodeService = serviceRegistry.get(ServiceEnum.VS_CODE);
        } else {
            console.log(\`[\${level}] \${message}\`, details !== undefined ? details : "");
            return;
        }
    }`;

    if (content.includes("vscodeService = serviceRegistry.get(ServiceEnum.VS_CODE);")) {
        content = content.replace(oldSendLog, newSendLog);
        fs.writeFileSync(filePath, content, "utf8");
    }
    ' "$UTILS_LOG_FILE"
fi

echo "✅ ServiceRegistry lookup fixed! GraphRagInstallerService and VsCodeService are now lazily resolved safely during extension activation!"
