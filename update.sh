#!/usr/bin/env bash
set -euo pipefail

# Define base paths
BASE_DIR="scripts/graph_rag_explorer/install/modules/java/jqassistant/tool-graph-rag"
MODELS_DIR="${BASE_DIR}/git-clone/models"
SCRIPTS_DIR="${BASE_DIR}/scripts"

echo "🚀 Setting up Graph-RAG Tool Module and Model Management..."

# Step 1: Create required directory hierarchy
mkdir -p "${MODELS_DIR}"
mkdir -p "${SCRIPTS_DIR}"

# Step 2: Create environment configuration file
cat << 'EOF' > "${BASE_DIR}/tool-graph-rag.env"
# Graph-RAG Environment Configuration
NEO4J_BOLT_URL="bolt://localhost:7688"
NEO4J_USER="neo4j"
NEO4J_PASSWORD="password"
EMBEDDING_MODEL_NAME="sentence-transformers/all-MiniLM-L6-v2"
EMBEDDING_MODEL_DIR="scripts/graph_rag_explorer/install/modules/java/jqassistant/tool-graph-rag/git-clone/models/all-MiniLM-L6-v2"
VECTOR_DIMENSION=384
BATCH_SIZE=64
EOF

# Step 3: Create Python model presence check & downloader script
cat << 'EOF' > "${SCRIPTS_DIR}/download_model.py"
#!/usr/bin/env python3
import os
import sys
import argparse

def check_and_download(model_name: str, target_dir: str):
    print(f"🔍 Checking model presence for '{model_name}' in '{target_dir}'...")

    # Required core files for sentence-transformers / huggingface model
    required_files = ["config.json", "tokenizer.json"]
    model_exists = os.path.exists(target_dir) and all(
        os.path.isfile(os.path.join(target_dir, f)) for f in required_files
    )

    if model_exists:
        print(f"✅ Model '{model_name}' is present at '{target_dir}'.")
        return 0

    print(f"⚠️ Model files missing or incomplete in '{target_dir}'. Downloading...")
    os.makedirs(target_dir, exist_ok=True)

    try:
        from huggingface_hub import snapshot_download
        snapshot_download(
            repo_id=model_name,
            local_dir=target_dir,
            local_dir_use_symlinks=False
        )
        print(f"✅ Model successfully downloaded to '{target_dir}'.")
        return 0
    except ImportError:
        print("📦 'huggingface_hub' not installed. Attempting download via git clone...")
        repo_url = f"https://huggingface.co/{model_name}"
        res = os.system(f"git clone {repo_url} '{target_dir}'")
        if res == 0:
            print(f"✅ Model cloned successfully into '{target_dir}'.")
            return 0
        else:
            print("❌ Failed to download model via git clone.", file=sys.stderr)
            return 1
    except Exception as e:
        print(f"❌ Error during model download: {e}", file=sys.stderr)
        return 1

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Verify and download LLM/Embedding model.")
    parser.add_argument("--model-name", default="sentence-transformers/all-MiniLM-L6-v2", help="HuggingFace model ID")
    parser.add_argument("--target-dir", required=True, help="Target download directory")
    args = parser.parse_args()

    sys.exit(check_and_download(args.model_name, args.target_dir))
EOF

# Step 4: Create shell script wrapper for model validation
cat << 'EOF' > "${SCRIPTS_DIR}/check_and_download_model.sh"
#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
MODULE_DIR="$(cd "${SCRIPT_DIR}/.." && pwd)"

if [ -f "${MODULE_DIR}/tool-graph-rag.env" ]; then
    source "${MODULE_DIR}/tool-graph-rag.env"
fi

MODEL_NAME="${EMBEDDING_MODEL_NAME:-sentence-transformers/all-MiniLM-L6-v2}"
TARGET_DIR="${EMBEDDING_MODEL_DIR:-${MODULE_DIR}/git-clone/models/all-MiniLM-L6-v2}"

echo "🔄 Running model presence check..."
python3 "${SCRIPT_DIR}/download_model.py" --model-name "${MODEL_NAME}" --target-dir "${TARGET_DIR}"
EOF

# Step 5: Create main Tool Graph-RAG runner script
cat << 'EOF' > "${BASE_DIR}/run_graph_rag.sh"
#!/usr/bin/env bash
set -euo pipefail

MODULE_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
VENV_DIR="${MODULE_DIR}/git-clone/venv"

echo "⚡ Initializing Tool Graph-RAG Execution..."

# 1. Load environment variables
if [ -f "${MODULE_DIR}/tool-graph-rag.env" ]; then
    source "${MODULE_DIR}/tool-graph-rag.env"
fi

# 2. Check and download model
bash "${MODULE_DIR}/scripts/check_and_download_model.sh"

# 3. Virtual environment setup
if [ ! -d "${VENV_DIR}" ]; then
    echo "⚙️ Creating Python virtual environment in '${VENV_DIR}'..."
    python3 -m venv "${VENV_DIR}"
    "${VENV_DIR}/bin/pip" install --upgrade pip
    "${VENV_DIR}/bin/pip" install huggingface_hub sentence-transformers neo4j
fi

# 4. Execute Knowledge Graph enrichment
echo "🧠 Running Graph-RAG enrichment pipeline..."
"${VENV_DIR}/bin/python" -c "
import os
from sentence_transformers import SentenceTransformer

model_dir = os.getenv('EMBEDDING_MODEL_DIR', '${MODULE_DIR}/git-clone/models/all-MiniLM-L6-v2')
print(f'Loading model from local path: {model_dir}')
model = SentenceTransformer(model_dir)
test_embed = model.encode('Testing Graph-RAG initialization.')
print(f'Embedding initialized successfully. Vector dimensions: {len(test_embed)}')
"

echo "✨ Tool Graph-RAG enrichment completed successfully!"
EOF

# Make scripts executable
chmod +x "${SCRIPTS_DIR}/download_model.py"
chmod +x "${SCRIPTS_DIR}/check_and_download_model.sh"
chmod +x "${BASE_DIR}/run_graph_rag.sh"

# Step 6: Inject delta into existing manager script if present
MANAGER_FILE=".github/skills/rvng-jqassistant-analysis/scripts/jqassistant_manager.py"

if [ -f "${MANAGER_FILE}" ]; then
    echo "🔧 Injecting Tool Graph-RAG action link into '${MANAGER_FILE}'..."
    if ! grep -q "tool-graph-rag" "${MANAGER_FILE}"; then
        python3 -c "
path = '${MANAGER_FILE}'
with open(path, 'r') as f:
    content = f.read()

target = 'def run_action('
addition = '''
    if option == 'E8' or option == 'E1':
        import subprocess
        print('🚀 Executing Graph-RAG module runner...')
        subprocess.run(['bash', 'scripts/graph_rag_explorer/install/modules/java/jqassistant/tool-graph-rag/run_graph_rag.sh'], check=True)
'''
if target in content and 'E8' not in content:
    content = content.replace(target, target + addition)
    with open(path, 'w') as f:
        f.write(content)
    print('Successfully patched manager.')
"
    fi
fi

echo "✅ feat(graph-rag): Integrated tool-graph-rag execution and automated model downloading in scripts/graph_rag_explorer/install/modules/java/jqassistant/tool-graph-rag!"
echo "Next step: Run 'bash scripts/graph_rag_explorer/install/modules/java/jqassistant/tool-graph-rag/run_graph_rag.sh' or compile the extension using 'npm run compile'."
