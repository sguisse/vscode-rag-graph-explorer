CORE_MODULE_NAME = "01_system_core"

STATUS_OK = "✅"
STATUS_KO = "❌"

# Prerequisite Status Keys
KEY_PYTHON3_PREREQUISITE = "python3_prerequisite"
KEY_PIP_PREREQUISITE = "pip_prerequisite"
KEY_NODE_PREREQUISITE = "node_prerequisite"
KEY_NPM_PREREQUISITE = "npm_prerequisite"
KEY_JAVA_PREREQUISITE = "java_prerequisite"
KEY_GITIGNORE_RULE_MAPPED = "gitignore_rule_mapped"

# List of prerequisite keys mapped to command display names for verification
PREREQUISITES_VERIFY_LIST = [
    (KEY_PYTHON3_PREREQUISITE, "python3"),
    (KEY_PIP_PREREQUISITE, "pip"),
    (KEY_NODE_PREREQUISITE, "node"),
    (KEY_NPM_PREREQUISITE, "npm"),
    (KEY_JAVA_PREREQUISITE, "java"),
]
