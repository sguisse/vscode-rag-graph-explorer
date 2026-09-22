package com.company.auditor.runner;

/**
 * Constants defining configuration step keys and workflow state display labels (Story 12.1).
 * Centralizes process step identifiers across runner orchestrators, sub-processes, and config loaders.
 */
public final class ProcessStepConstants {

    private ProcessStepConstants() {}

    // YAML Configuration Step Keys
    public static final String KEY_PREDICTIVE_BLAST_RADIUS = "predictiveBlastRadius";
    public static final String KEY_STATIC_RULES = "staticRules";
    public static final String KEY_OTEL_HYDRATION = "otelHydration";
    public static final String KEY_K8S_MANIFEST_DRIFT = "k8sManifestDrift";
    public static final String KEY_DOC_AS_CODE_SYNC = "docAsCodeSync";
    public static final String KEY_C4_DIAGRAM_EXPORT = "c4DiagramExport";
    public static final String KEY_BUSINESS_RULE_INVERSION = "businessRuleInversion";
    public static final String KEY_GREEN_IT_PROFILING = "greenItProfiling";
    public static final String KEY_VEX_REACHABILITY = "vexReachability";
    public static final String KEY_ZERO_TRUST_ANONYMIZATION = "zeroTrustAnonymization";
    public static final String KEY_LLM_TRIAGE = "llmTriage";
    public static final String KEY_OPA_POLICY_EVALUATION = "opaPolicyEvaluation";
    public static final String KEY_SHADOW_REMEDIATION = "shadowRemediation";
    public static final String KEY_MODEL_DISTILLATION = "modelDistillation";
    public static final String KEY_SARIF_EXPORT = "sarifExport";
    public static final String KEY_GITHUB_ACTIONS_WORKFLOW = "githubActionsWorkflow";

    // Workflow State Display Names (Recorded in WorkflowStateRenderer & PlantUML)
    public static final String STEP_PREDICTIVE_BLAST_RADIUS = "PredictiveBlastRadius";
    public static final String STEP_STATIC_RULES_EXECUTION = "StaticRulesExecution";
    public static final String STEP_CROSS_STACK_ALIGNER = "CrossStackAligner";
    public static final String STEP_OPENTELEMETRY_HYDRATION = "OpenTelemetryHydration";
    public static final String STEP_K8S_MANIFEST_ANALYZER = "K8sManifestAnalyzer";
    public static final String STEP_DOC_AS_CODE_SYNC = "DocAsCodeSync";
    public static final String STEP_C4_DIAGRAM_EXPORT = "C4DiagramExport";
    public static final String STEP_BUSINESS_RULE_INVERSION = "BusinessRuleInversion";
    public static final String STEP_GREEN_IT_PROFILING = "GreenItProfiling";
    public static final String STEP_VEX_REACHABILITY_ANALYSIS = "VexReachabilityAnalysis";
    public static final String STEP_ZERO_TRUST_ANONYMIZATION = "ZeroTrustAnonymization";
    public static final String STEP_LLM_TRIAGE_AND_METRICS = "LlmTriageAndMetrics";
    public static final String STEP_OPA_POLICY_EVALUATION = "OpaPolicyEvaluation";
    public static final String STEP_EXECUTIVE_COMPLIANCE_REPORT = "ExecutiveComplianceReport";
    public static final String STEP_DOUBLE_LOOP_REMEDIATION = "DoubleLoopRemediation";
    public static final String STEP_MODEL_DISTILLATION_EXPORT = "ModelDistillationExport";
    public static final String STEP_SARIF_REPORT_EXPORT = "SarifReportExport";
    public static final String STEP_GITHUB_ACTIONS_WORKFLOW = "GitHubActionsWorkflow";
}