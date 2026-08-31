// AUTO-GENERATED FILE. DO NOT EDIT DIRECTLY.
// Rebuild using: npm run generate:settings

export class VsCodeSettings {
    pinApplication = true;

    codebaseScanEachTimeAppIsDisplayed = false;

    tooltipDelay = 2000;

    geminiApiKey = "";

    backendWorkspacePath = ".token-razor";

    forceScriptSync = false;

    logFileEnabled = true;

    logFileMaxSize = 5;

    logFileMaxCountRetention = 5;

    processTimeout = 10000;

    processSoundPath = "/System/Library/Sounds/Glass.aiff";

    processSoundDelay = 10000;

    graphRagExplorer = {
        entitiesTypesList: ["file","class","method","document"],
        regexFilterEnabled: false,
        treeFilterEnabled: true,
        graphLegendEnabled: true,
        callersDepth: 1,
        calleesDepth: 1,
        backendWorkspacePath: "${tokenRazor.backendWorkspacePath}/graph-rag-explorer-v2",
        includePathsRegex: "",
        includeExtensionsRegex: ".*\\.(java|ts|tsx|js|html|css|json|xml|yaml|yml|py|md|properties)$",
        excludePathsRegex: "(^|.*/)(node_modules|\\.git|\\.github|dist|.*-tmp|.*-out|\\.idea|\\.vscode|\\.history|exported-files|\\.[^/]+)(/.*|$)",
        excludeExtensionsRegex: "",
        neo4j: {
            version: "5.26.0",
            host: "localhost",
            port: {
                bolt: 7687,
                http: 7474
            },
            uri: "bolt://${tokenRazor.graphRagExplorer.neo4j.host}:${tokenRazor.graphRagExplorer.neo4j.port.bolt}",
            url: "http://${tokenRazor.graphRagExplorer.neo4j.host}:${tokenRazor.graphRagExplorer.neo4j.port.http}/browser/preview/",
            username: "neo4j",
            password: "password"
        },
        jqassistant: {
            version: "2.9.1",
            downloadUrl: "https://github.com/jQAssistant/jqassistant/releases/download/${tokenRazor.graphRagExplorer.jqassistant.version}/jqassistant-commandline-neo4jv5-${tokenRazor.graphRagExplorer.jqassistant.version}-distribution.zip",
            graphRagLLM: {
                downloadUrl: "https://huggingface.co/sentence-transformers",
                model: "all-MiniLM-L6-v2",
                method: {
                    minCyclomatic: 30
                },
                maxAnalyzerCall: 5,
                maxSummarizerCall: 5,
                mcp: {
                    host: "127.0.0.1",
                    port: 8800
                }
            },
            xmlReportPath: "./target/site/jacoco/jacoco.xml"
        },
        dependencyCruiser: {
            configFile: ".dependency-cruiser.json"
        },
        graphify: {
            arguments: "--deep-scan"
        },
        userPreferences: ["{","}"]
    };

    exporter = {
        scriptPythonPath: "",
        historyYamlPath: "~/files-exporter/.files-exporter-history.yaml",
        maxFileSizeKb: 50,
        includePathsRegex: ".*",
        includeExtensionsRegex: ".*\\.(java|ts|tsx|js|html|css|json|xml|yaml|yml|py|md|properties)$",
        excludePathsRegex: ".*/node_modules/.*|.*/target/.*|.*/\\.git/.*|.*/dist/.*|.*/.idea/.*|.*/.vscode/.*|.*/.history/.*|.*/exported-files/.*,/\\.[^/]+",
        excludeExtensionsRegex: "^[^.]+$|.*\\.(?:log|tmp|lock|zip|tar|png|jpg|gif|pyc|vsix)$",
        defaultFormat: "yaml",
        maxChunkSizeKb: 500,
        splitChunkByFileExtension: false,
        copyGeneratedFilesToClipboard: true,
        generateTreeView: true,
        generateLogConsole: true,
        generateLogFile: false,
        tooltipDelay: 2000,
        copyFilesToClipboardTimeout: 10000,
        pinFilesExporter: true,
        pinBrowserTab: true,
        exchange: [{"icon":"assets/brands/gemini.svg","url":"https://gemini.google.com/","tooltip":"Open Gemini","height":"45px","width":"45px","openInVSCode":true},{"icon":"assets/brands/notebookLM.svg","url":"https://notebooklm.google.com/","tooltip":"Open NotebookLM","height":"45px","width":"45px","openInVSCode":false}],
        fileExtsCategoryGroups: [{"label":"No Extension","excludeExtsMenuEnabled":true,"extensions":["^[^.]+$|.*\\."]},{"label":"CONFIG -  YAML","includeExtsMenuEnabled":true,"extensions":[".*\\.yaml$",".*\\.yml$"]},{"label":"CONFIG -  XML","includeExtsMenuEnabled":true,"extensions":[".*\\.xml$",".*\\.xsd$"]},{"label":"CONFIG -  JSON","includeExtsMenuEnabled":true,"extensions":[".*\\.json$",".*\\.jsonc$",".*\\.json5$"]},{"label":"CONFIG -  TOML","includeExtsMenuEnabled":true,"extensions":[".*\\.toml$"]},{"label":"CONFIG -  Props & Env","includeExtsMenuEnabled":true,"extensions":[".*\\.properties$",".*\\.prop$",".*\\.env$"]},{"label":"CONFIG -  Generic & INI","includeExtsMenuEnabled":true,"extensions":[".*\\.conf$",".*\\.cfg$",".*\\.config$",".*\\.ini$",".*\\.prefs$"]},{"label":"DOC -    Markdown & Tech","includeExtsMenuEnabled":true,"extensions":[".*\\.md$",".*\\.txt$",".*\\.rst$",".*\\.adoc$"]},{"label":"DOC -    Office & PDF","excludeExtsMenuEnabled":true,"extensions":[".*\\.pdf$",".*\\.docx$",".*\\.doc$",".*\\.odt$"]},{"label":"DOC -    Spreadsheets & Data Sheets","excludeExtsMenuEnabled":true,"extensions":[".*\\.xlsx$",".*\\.xls$",".*\\.csv$"]},{"label":"FE - Web Markup","includeExtsMenuEnabled":true,"extensions":[".*\\.html$",".*\\.htm$"]},{"label":"FE - CSS & Preprocessors","includeExtsMenuEnabled":true,"extensions":[".*\\.css$",".*\\.scss$",".*\\.sass$",".*\\.less$"]},{"label":"FE - JavaScript & TypeScript","includeExtsMenuEnabled":true,"extensions":[".*\\.js$",".*\\.ts$"]},{"label":"FE - React Components","includeExtsMenuEnabled":true,"extensions":[".*\\.jsx$",".*\\.tsx$"]},{"label":"FE - Modern UI Fwks","includeExtsMenuEnabled":true,"extensions":[".*\\.vue$",".*\\.svelte$",".*\\.astro$"]},{"label":"BE - Python","includeExtsMenuEnabled":true,"extensions":[".*\\.py$",".*\\.pyw$",".*\\.pyx$"]},{"label":"BE - Java & JVM","includeExtsMenuEnabled":true,"extensions":[".*\\.java$",".*\\.kt$",".*\\.kts$",".*\\.scala$",".*\\.groovy$"]},{"label":"BE - Node.js (TS/JS)","includeExtsMenuEnabled":true,"extensions":[".*\\.ts$",".*\\.js$",".*\\.mjs$",".*\\.cjs$"]},{"label":"BE - .NET (C# / F#)","includeExtsMenuEnabled":true,"extensions":[".*\\.cs$",".*\\.fs$"]},{"label":"BE - Go & Rust","includeExtsMenuEnabled":true,"extensions":[".*\\.go$",".*\\.rs$"]},{"label":"BE - C & C++","includeExtsMenuEnabled":true,"extensions":[".*\\.c$",".*\\.cpp$",".*\\.h$",".*\\.hpp$"]},{"label":"BE - PHP & Ruby","includeExtsMenuEnabled":true,"extensions":[".*\\.php$",".*\\.rb$"]},{"label":"ARCH -  Standard","excludeExtsMenuEnabled":true,"extensions":[".*\\.zip$",".*\\.rar$",".*\\.7z$",".*\\.tar$",".*\\.gz$",".*\\.bz2$",".*\\.xz$",".*\\.tgz$",".*\\.zipx$"]},{"label":"ARCH -  Img & Virtual","excludeExtsMenuEnabled":true,"extensions":[".*\\.iso$",".*\\.dmg$",".*\\.cab$",".*\\.vhd$",".*\\.vmdk$"]},{"label":"ARCH -  Java & Deployment","excludeExtsMenuEnabled":true,"extensions":[".*\\.jar$",".*\\.war$",".*\\.ear$"]},{"label":"IMG -Web & Standard","excludeExtsMenuEnabled":true,"extensions":[".*\\.jpg$",".*\\.jpeg$",".*\\.png$",".*\\.webp$",".*\\.gif$",".*\\.bmp$"]},{"label":"IMG -Vector Graphics","excludeExtsMenuEnabled":true,"extensions":[".*\\.svg$",".*\\.ai$",".*\\.eps$"]},{"label":"IMG -Design & Editing","excludeExtsMenuEnabled":true,"extensions":[".*\\.psd$",".*\\.xcf$",".*\\.tiff$",".*\\.tif$"]},{"label":"IMG -Camera RAW & HE","excludeExtsMenuEnabled":true,"extensions":[".*\\.heic$",".*\\.heif$",".*\\.raw$",".*\\.cr2$",".*\\.nef$",".*\\.arw$"]},{"label":"LOG -  Standard","excludeExtsMenuEnabled":true,"extensions":[".*\\.log$",".*\\.out$",".*\\.err$",".*\\.syslog$"]},{"label":"LOG -  Structured & Event","excludeExtsMenuEnabled":true,"extensions":[".*\\.jsonl$",".*\\.ndjson$",".*\\.event$",".*\\.evtx$"]},{"label":"LOG -  Diagnostic & Trace","excludeExtsMenuEnabled":true,"extensions":[".*\\.trace$",".*\\.audit$",".*\\.dump$",".*\\.crash$"]},{"label":"LOG -  Level Specifics","excludeExtsMenuEnabled":true,"extensions":[".*\\.info$",".*\\.warn$",".*\\.error$"]},{"label":"TMP - Standard","excludeExtsMenuEnabled":true,"extensions":[".*\\.tmp$",".*\\.temp$"]},{"label":"TMP - Backup & Cache","excludeExtsMenuEnabled":true,"extensions":[".*\\.bak$",".*\\.old$",".*\\.cache$",".*\\.swp$",".*\\.~$"]},{"label":"TMP - Lock & Process","excludeExtsMenuEnabled":true,"extensions":[".*\\.lock$",".*\\.pid$"]},{"label":"TMP - Placeholder & Keep","excludeExtsMenuEnabled":true,"extensions":[".*\\.keep$",".*\\.gitkeep$"]},{"label":"TEMPLATE - Logicless & Handlebars","includeExtsMenuEnabled":true,"extensions":[".*\\.mustache$",".*\\.hbs$",".*\\.handlebars$"]},{"label":"TEMPLATE - Generic Engine","includeExtsMenuEnabled":true,"extensions":[".*\\.template$",".*\\.tpl$",".*\\.tmpl$"]},{"label":"TEMPLATE - JavaScript & Web","includeExtsMenuEnabled":true,"extensions":[".*\\.ejs$",".*\\.pug$",".*\\.jade$",".*\\.twig$",".*\\.liquid$"]},{"label":"TEMPLATE - Python & Polyglot ","includeExtsMenuEnabled":true,"extensions":[".*\\.jinja$",".*\\.jinja2$",".*\\.j2$",".*\\.ftl$",".*\\.erb$"]}]
    };

    /**
     * Instantiates VsCodeSettings populated with transposed nested object values.
     */
    public static fromMap(data: Record<string, any>): VsCodeSettings {
        const settings = new VsCodeSettings();
        return Object.assign(settings, data);
    }
}

export const VsCodeSettingsKeys = {
    pinApplication: "tokenRazor.pinApplication",
    codebaseScanEachTimeAppIsDisplayed: "tokenRazor.codebaseScanEachTimeAppIsDisplayed",
    tooltipDelay: "tokenRazor.tooltipDelay",
    geminiApiKey: "tokenRazor.geminiApiKey",
    backendWorkspacePath: "tokenRazor.backendWorkspacePath",
    forceScriptSync: "tokenRazor.forceScriptSync",
    logFileEnabled: "tokenRazor.logFileEnabled",
    logFileMaxSize: "tokenRazor.logFileMaxSize",
    logFileMaxCountRetention: "tokenRazor.logFileMaxCountRetention",
    processTimeout: "tokenRazor.processTimeout",
    processSoundPath: "tokenRazor.processSoundPath",
    processSoundDelay: "tokenRazor.processSoundDelay",
    graphRagExplorer: {
        entitiesTypesList: "tokenRazor.graphRagExplorer.entitiesTypesList",
        regexFilterEnabled: "tokenRazor.graphRagExplorer.regexFilterEnabled",
        treeFilterEnabled: "tokenRazor.graphRagExplorer.treeFilterEnabled",
        graphLegendEnabled: "tokenRazor.graphRagExplorer.graphLegendEnabled",
        callersDepth: "tokenRazor.graphRagExplorer.callersDepth",
        calleesDepth: "tokenRazor.graphRagExplorer.calleesDepth",
        backendWorkspacePath: "tokenRazor.graphRagExplorer.backendWorkspacePath",
        includePathsRegex: "tokenRazor.graphRagExplorer.includePathsRegex",
        includeExtensionsRegex: "tokenRazor.graphRagExplorer.includeExtensionsRegex",
        excludePathsRegex: "tokenRazor.graphRagExplorer.excludePathsRegex",
        excludeExtensionsRegex: "tokenRazor.graphRagExplorer.excludeExtensionsRegex",
        neo4j: {
            version: "tokenRazor.graphRagExplorer.neo4j.version",
            host: "tokenRazor.graphRagExplorer.neo4j.host",
            port: {
                bolt: "tokenRazor.graphRagExplorer.neo4j.port.bolt",
                http: "tokenRazor.graphRagExplorer.neo4j.port.http"
            },
            uri: "tokenRazor.graphRagExplorer.neo4j.uri",
            url: "tokenRazor.graphRagExplorer.neo4j.url",
            username: "tokenRazor.graphRagExplorer.neo4j.username",
            password: "tokenRazor.graphRagExplorer.neo4j.password"
        },
        jqassistant: {
            version: "tokenRazor.graphRagExplorer.jqassistant.version",
            downloadUrl: "tokenRazor.graphRagExplorer.jqassistant.downloadUrl",
            graphRagLLM: {
                downloadUrl: "tokenRazor.graphRagExplorer.jqassistant.graphRagLLM.downloadUrl",
                model: "tokenRazor.graphRagExplorer.jqassistant.graphRagLLM.model",
                method: {
                    minCyclomatic: "tokenRazor.graphRagExplorer.jqassistant.graphRagLLM.method.minCyclomatic"
                },
                maxAnalyzerCall: "tokenRazor.graphRagExplorer.jqassistant.graphRagLLM.maxAnalyzerCall",
                maxSummarizerCall: "tokenRazor.graphRagExplorer.jqassistant.graphRagLLM.maxSummarizerCall",
                mcp: {
                    host: "tokenRazor.graphRagExplorer.jqassistant.graphRagLLM.mcp.host",
                    port: "tokenRazor.graphRagExplorer.jqassistant.graphRagLLM.mcp.port"
                }
            },
            xmlReportPath: "tokenRazor.graphRagExplorer.jqassistant.xmlReportPath"
        },
        dependencyCruiser: {
            configFile: "tokenRazor.graphRagExplorer.dependencyCruiser.configFile"
        },
        graphify: {
            arguments: "tokenRazor.graphRagExplorer.graphify.arguments"
        },
        userPreferences: "tokenRazor.graphRagExplorer.userPreferences"
    },
    exporter: {
        scriptPythonPath: "tokenRazor.exporter.scriptPythonPath",
        historyYamlPath: "tokenRazor.exporter.historyYamlPath",
        maxFileSizeKb: "tokenRazor.exporter.maxFileSizeKb",
        includePathsRegex: "tokenRazor.exporter.includePathsRegex",
        includeExtensionsRegex: "tokenRazor.exporter.includeExtensionsRegex",
        excludePathsRegex: "tokenRazor.exporter.excludePathsRegex",
        excludeExtensionsRegex: "tokenRazor.exporter.excludeExtensionsRegex",
        defaultFormat: "tokenRazor.exporter.defaultFormat",
        maxChunkSizeKb: "tokenRazor.exporter.maxChunkSizeKb",
        splitChunkByFileExtension: "tokenRazor.exporter.splitChunkByFileExtension",
        copyGeneratedFilesToClipboard: "tokenRazor.exporter.copyGeneratedFilesToClipboard",
        generateTreeView: "tokenRazor.exporter.generateTreeView",
        generateLogConsole: "tokenRazor.exporter.generateLogConsole",
        generateLogFile: "tokenRazor.exporter.generateLogFile",
        tooltipDelay: "tokenRazor.exporter.tooltipDelay",
        copyFilesToClipboardTimeout: "tokenRazor.exporter.copyFilesToClipboardTimeout",
        pinFilesExporter: "tokenRazor.exporter.pinFilesExporter",
        pinBrowserTab: "tokenRazor.exporter.pinBrowserTab",
        exchange: "tokenRazor.exporter.exchange",
        fileExtsCategoryGroups: "tokenRazor.exporter.fileExtsCategoryGroups"
    }
} as const;
