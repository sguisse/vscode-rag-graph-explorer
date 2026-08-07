# AUTO-GENERATED FILE. DO NOT EDIT DIRECTLY.
from dataclasses import dataclass, field
from typing import List, Dict, Any

@dataclass
class PortSettings:
    bolt: int = 7687
    http: int = 7474

    @classmethod
    def from_dict(cls, data: dict) -> "PortSettings":
        obj = cls()
        if not isinstance(data, dict): return obj
        if "bolt" in data:
            obj.bolt = data["bolt"]
        if "http" in data:
            obj.http = data["http"]
        return obj

@dataclass
class Neo4jSettings:
    version: str = "5.26.0"
    host: str = "localhost"
    port: "PortSettings" = field(default_factory=PortSettings)
    uri: str = "bolt://${tokenRazor.graphRagExplorer.neo4j.host}:${tokenRazor.graphRagExplorer.neo4j.port.bolt}"
    url: str = "http://${tokenRazor.graphRagExplorer.neo4j.host}:${tokenRazor.graphRagExplorer.neo4j.port.http}/browser/preview/"
    username: str = "neo4j"
    password: str = "password"

    @classmethod
    def from_dict(cls, data: dict) -> "Neo4jSettings":
        obj = cls()
        if not isinstance(data, dict): return obj
        if "version" in data:
            obj.version = data["version"]
        if "host" in data:
            obj.host = data["host"]
        if "port" in data:
            obj.port = PortSettings.from_dict(data["port"])
        if "uri" in data:
            obj.uri = data["uri"]
        if "url" in data:
            obj.url = data["url"]
        if "username" in data:
            obj.username = data["username"]
        if "password" in data:
            obj.password = data["password"]
        return obj

@dataclass
class McpSettings:
    host: str = "127.0.0.1"
    port: int = 8800

    @classmethod
    def from_dict(cls, data: dict) -> "McpSettings":
        obj = cls()
        if not isinstance(data, dict): return obj
        if "host" in data:
            obj.host = data["host"]
        if "port" in data:
            obj.port = data["port"]
        return obj

@dataclass
class JqassistantSettings:
    version: str = "2.9.1"
    downloadUrl: str = "https://github.com/jQAssistant/jqassistant/releases/download/${tokenRazor.graphRagExplorer.jqassistant.version}/jqassistant-commandline-neo4jv5-${tokenRazor.graphRagExplorer.jqassistant.version}-distribution.zip"
    mcp: "McpSettings" = field(default_factory=McpSettings)
    xmlReportPath: str = "./target/site/jacoco/jacoco.xml"

    @classmethod
    def from_dict(cls, data: dict) -> "JqassistantSettings":
        obj = cls()
        if not isinstance(data, dict): return obj
        if "version" in data:
            obj.version = data["version"]
        if "downloadUrl" in data:
            obj.downloadUrl = data["downloadUrl"]
        if "mcp" in data:
            obj.mcp = McpSettings.from_dict(data["mcp"])
        if "xmlReportPath" in data:
            obj.xmlReportPath = data["xmlReportPath"]
        return obj

@dataclass
class DependencyCruiserSettings:
    configFile: str = ".dependency-cruiser.json"

    @classmethod
    def from_dict(cls, data: dict) -> "DependencyCruiserSettings":
        obj = cls()
        if not isinstance(data, dict): return obj
        if "configFile" in data:
            obj.configFile = data["configFile"]
        return obj

@dataclass
class GraphifySettings:
    arguments: str = "--deep-scan"

    @classmethod
    def from_dict(cls, data: dict) -> "GraphifySettings":
        obj = cls()
        if not isinstance(data, dict): return obj
        if "arguments" in data:
            obj.arguments = data["arguments"]
        return obj

@dataclass
class GraphRagExplorerSettings:
    entitiesTypesList: list = field(default_factory=lambda: ["file","class","method","document"])
    regexFilterEnabled: bool = False
    treeFilterEnabled: bool = True
    graphLegendEnabled: bool = True
    callersDepth: int = 1
    calleesDepth: int = 1
    backendWorkspacePath: str = "${tokenRazor.backendWorkspacePath}/graph-rag-explorer-v2"
    includePathsRegex: str = ""
    includeExtensionsRegex: str = ".*\\.(java|ts|tsx|js|html|css|json|xml|yaml|yml|py|md|properties)$"
    excludePathsRegex: str = "(^|.*/)(node_modules|\\.git|\\.github|dist|.*-tmp|.*-out|\\.idea|\\.vscode|\\.history|exported-files|\\.[^/]+)(/.*|$)"
    excludeExtensionsRegex: str = ""
    neo4j: "Neo4jSettings" = field(default_factory=Neo4jSettings)
    jqassistant: "JqassistantSettings" = field(default_factory=JqassistantSettings)
    dependencyCruiser: "DependencyCruiserSettings" = field(default_factory=DependencyCruiserSettings)
    graphify: "GraphifySettings" = field(default_factory=GraphifySettings)

    @classmethod
    def from_dict(cls, data: dict) -> "GraphRagExplorerSettings":
        obj = cls()
        if not isinstance(data, dict): return obj
        if "entitiesTypesList" in data:
            obj.entitiesTypesList = data["entitiesTypesList"]
        if "regexFilterEnabled" in data:
            obj.regexFilterEnabled = data["regexFilterEnabled"]
        if "treeFilterEnabled" in data:
            obj.treeFilterEnabled = data["treeFilterEnabled"]
        if "graphLegendEnabled" in data:
            obj.graphLegendEnabled = data["graphLegendEnabled"]
        if "callersDepth" in data:
            obj.callersDepth = data["callersDepth"]
        if "calleesDepth" in data:
            obj.calleesDepth = data["calleesDepth"]
        if "backendWorkspacePath" in data:
            obj.backendWorkspacePath = data["backendWorkspacePath"]
        if "includePathsRegex" in data:
            obj.includePathsRegex = data["includePathsRegex"]
        if "includeExtensionsRegex" in data:
            obj.includeExtensionsRegex = data["includeExtensionsRegex"]
        if "excludePathsRegex" in data:
            obj.excludePathsRegex = data["excludePathsRegex"]
        if "excludeExtensionsRegex" in data:
            obj.excludeExtensionsRegex = data["excludeExtensionsRegex"]
        if "neo4j" in data:
            obj.neo4j = Neo4jSettings.from_dict(data["neo4j"])
        if "jqassistant" in data:
            obj.jqassistant = JqassistantSettings.from_dict(data["jqassistant"])
        if "dependencyCruiser" in data:
            obj.dependencyCruiser = DependencyCruiserSettings.from_dict(data["dependencyCruiser"])
        if "graphify" in data:
            obj.graphify = GraphifySettings.from_dict(data["graphify"])
        return obj

@dataclass
class VsCodeSettings:
    workspaceRoot: str = ""
    pinApplication: bool = True
    tooltipDelay: int = 2000
    geminiApiKey: str = ""
    backendWorkspacePath: str = ".token-razor"
    forceScriptSync: bool = False
    logFileEnabled: bool = True
    logFileMaxSize: int = 5
    logFileMaxCountRetention: int = 5
    graphRagExplorer: "GraphRagExplorerSettings" = field(default_factory=GraphRagExplorerSettings)

    @classmethod
    def from_dict(cls, data: dict) -> "VsCodeSettings":
        obj = cls()
        if not isinstance(data, dict): return obj
        if "workspaceRoot" in data:
            obj.workspaceRoot = data["workspaceRoot"]
        if "pinApplication" in data:
            obj.pinApplication = data["pinApplication"]
        if "tooltipDelay" in data:
            obj.tooltipDelay = data["tooltipDelay"]
        if "geminiApiKey" in data:
            obj.geminiApiKey = data["geminiApiKey"]
        if "backendWorkspacePath" in data:
            obj.backendWorkspacePath = data["backendWorkspacePath"]
        if "forceScriptSync" in data:
            obj.forceScriptSync = data["forceScriptSync"]
        if "logFileEnabled" in data:
            obj.logFileEnabled = data["logFileEnabled"]
        if "logFileMaxSize" in data:
            obj.logFileMaxSize = data["logFileMaxSize"]
        if "logFileMaxCountRetention" in data:
            obj.logFileMaxCountRetention = data["logFileMaxCountRetention"]
        if "graphRagExplorer" in data:
            obj.graphRagExplorer = GraphRagExplorerSettings.from_dict(data["graphRagExplorer"])
        return obj

    def inject_vscode_settings(self, data: dict) -> None:
        root_key = next(iter(data.keys()), "tokenRazor") if data else "tokenRazor"
        root_data = data.get(root_key, {})
        if not isinstance(root_data, dict): root_data = data
        parsed = self.from_dict(root_data)
        self.__dict__.update(parsed.__dict__)
