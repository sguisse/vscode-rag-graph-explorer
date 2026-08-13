import os
import sys
from analyser.base import BaseAnalyser
from analyser.registry import AnalyserRegistry
from analyser.tools.neo4j.neo4j_client import Neo4jClient
from core.utils import info, error, debug, execute_tracked_command, success, warn
from core.context import EnvironmentContext
from core.VsCodeSettings_gen import vsCodeSettings
from install.modules.java.jqassistant_graph_rag.context import JQAssistantGraphRagContext


@AnalyserRegistry.register_analyser
class JQAssistantGraphRagAnalyzer(BaseAnalyser):

    def __init__(self, context: EnvironmentContext):
        # 1. Call the parent class (BaseAnalyser) to store global context
        super().__init__(context)
        # 2. Compose the specific jQAssistant Graph RAG context
        self.jqa_gr = JQAssistantGraphRagContext(context)

    @property
    def name(self) -> str:
        return "02-java_jqassistant_graph_rag_analyzer"

    def _get_venv_python(self, git_clone_dir: str) -> str:
        """Locates the Python binary within the graph-rag tool virtual environment."""
        if os.name == "nt":
            python_bin = os.path.join(git_clone_dir, ".venv", "Scripts", "python.exe")
        else:
            python_bin = os.path.join(git_clone_dir, ".venv", "bin", "python")

        if not os.path.exists(python_bin):
            warn(
                f"Dedicated virtualenv python missing at '{python_bin}'. Falling back to default system Python.",
                component=self.name,
            )
            return sys.executable
        return python_bin

    def run_analysis(self, neo4j_client: Neo4jClient) -> None:
        """Main orchestrator for the jQAssistant Graph RAG analysis pipeline using local LLM and local embeddings."""
        os.makedirs(self.jqa_gr.raw_outputs_dir, exist_ok=True)
        info("Starting jQAssistant Graph RAG analysis (Local LLM)...", component=self.name)

        git_clone_dir = os.path.abspath(self.jqa_gr.tools_git_clone)
        main_py = os.path.join(git_clone_dir, "main.py")

        if not os.path.exists(main_py):
            error(f"Target main.py script missing at: '{main_py}'", component=self.name)
            return

        python_bin = self._get_venv_python(git_clone_dir)

        # Retrieve Neo4j credentials and configuration settings
        neo4j_host = vsCodeSettings.graphRagExplorer.neo4j.host or "localhost"
        neo4j_bolt_port = vsCodeSettings.graphRagExplorer.neo4j.port.bolt or 7688
        neo4j_http_port = vsCodeSettings.graphRagExplorer.neo4j.port.http or 7777
        neo4j_user = vsCodeSettings.graphRagExplorer.neo4j.username or ""
        neo4j_pass = vsCodeSettings.graphRagExplorer.neo4j.password or ""
        neo4j_uri = f"bolt://{neo4j_host}:{neo4j_bolt_port}"

        workspace_root = self.context.workspace_root or os.getcwd()
        project_name = os.path.basename(workspace_root)

        # Populate JQA_XXX and Neo4j environment variables
        env = os.environ.copy()
        env["JQA_HOST"] = str(neo4j_host)
        env["JQA_HTTP_PORT"] = str(neo4j_http_port)
        env["JQA_BOLT_PORT"] = str(neo4j_bolt_port)
        env["JQA_URI"] = neo4j_uri
        env["JQA_USER"] = str(neo4j_user)
        env["JQA_PASSWORD"] = str(neo4j_pass)
        env["NEO4J_URI"] = neo4j_uri
        env["NEO4J_USER"] = str(neo4j_user)
        env["NEO4J_PASSWORD"] = str(neo4j_pass)

        env["PROJECT_ROOT"] = workspace_root
        env["PROJECT_NAME"] = project_name

        # Resolve local sentence transformer model directory
        model_name = (
            vsCodeSettings.graphRagExplorer.jqassistant.graphRagLLM.model
            or "all-MiniLM-L6-v2"
        )
        min_cyclomatic = (
            vsCodeSettings.graphRagExplorer.jqassistant.graphRagLLM.method.minCyclomatic
        )

        local_model_dir = os.path.join(self.jqa_gr.tools_models_dir, model_name)
        if not os.path.exists(local_model_dir):
            local_model_dir = os.path.join(git_clone_dir, "models", "all-MiniLM-L6-v2")

        if os.path.exists(local_model_dir):
            info(f"Detected local embedding model at: '{local_model_dir}'", component=self.name)
            env["SENTENCE_TRANSFORMER_MODEL"] = local_model_dir
            env["JQA_SENTENCE_TRANSFORMER_LOCAL_MODEL"] = local_model_dir
            env["HF_HUB_OFFLINE"] = "1"
            env["TRANSFORMERS_OFFLINE"] = "1"
        else:
            warn(
                f"Local embedding model directory '{local_model_dir}' not found. Falling back to default identifier.",
                component=self.name,
            )
            env["SENTENCE_TRANSFORMER_MODEL"] = model_name
            env["JQA_SENTENCE_TRANSFORMER_LOCAL_MODEL"] = f"models/{model_name}"

        env["JQA_METHOD_MIN_CYCLOMATIC"] = str(min_cyclomatic)

        # Configure Local LLM API (defaults to 'ollama', overridable via JQA_LLM_API)
        llm_api = "fake"  # os.environ.get("JQA_LLM_API", "ollama")
        env["JQA_OLLAMA_MODEL"] = os.environ.get(
            "JQA_OLLAMA_MODEL", "deepseek-coder:6.7b"
        )
        env["JQA_COPILOT_MODEL"] = os.environ.get("JQA_COPILOT_MODEL", "gpt-5-mini")
        env["JQA_COPILOT_MODEL_EFFORT"] = os.environ.get(
            "JQA_COPILOT_MODEL_EFFORT", "medium"
        )

        # Assemble CLI invocation with local LLM API
        cmd_args = [
            python_bin,
            "main.py",
            "--generate-summary",
            "--llm-api",
            llm_api,
            "--repo-root",
            "",
            "--uri",
            neo4j_uri,
            "--user",
            neo4j_user,
            "--password",
            neo4j_pass,
            "--min-cyclomatic",
            str(min_cyclomatic),
        ]

        info(
            f"Invoking graph-rag enrichment script in '{git_clone_dir}' with python binary '{python_bin}' (LLM API: '{llm_api}')",
            component=self.name,
        )

        return_code = execute_tracked_command(
            cmd_args=cmd_args,
            tool_name="jqassistant_graph_rag_analyzer",
            cwd=git_clone_dir,
            env=env,
        )

        if return_code == 0:
            success("jQAssistant Graph RAG analysis completed successfully.", component=self.name)
        else:
            error(
                f"jQAssistant Graph RAG analysis failed with exit status code {return_code}.",
                component=self.name,
            )
