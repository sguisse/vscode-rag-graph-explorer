// AUTO-GENERATED FILE. DO NOT EDIT DIRECTLY.
// Rebuild using: npm run generate:settings

export class VsCodeSettings {
    pinApplication = true;

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
    }
} as const;
