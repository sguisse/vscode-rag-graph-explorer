export interface ModuleSummary {
  globalStatus: string;
  stepsCount: string;
  koCount: number;
  okCount: number;
}

export interface CheckStepResult {
  status: string;
  version?: string;
  path?: string;
  location?: string;
  message?: string;
}

export interface InstallModuleStatus {
  summary: ModuleSummary;
  [stepName: string]: CheckStepResult | ModuleSummary;
}

export interface FinalInstallStatusReport {
  summary: ModuleSummary;
  '01_system_core'?: InstallModuleStatus;
  '01_system_neo4j'?: InstallModuleStatus;
  'java_jqassistant_graph_rag'?: InstallModuleStatus;
  'java_jqassistant'?: InstallModuleStatus;
  'java_jacoco'?: InstallModuleStatus;
  'node_dependency_cruiser'?: InstallModuleStatus;
  'node_swc'?: InstallModuleStatus;
  'python_graphify'?: InstallModuleStatus;
  [moduleName: string]: InstallModuleStatus | ModuleSummary | undefined;
}
