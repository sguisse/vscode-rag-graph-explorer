# Token Razor SDLC — Comprehensive User Guide

## 1. Navigating the Extension
Navigation is managed through the **Left Sidebar Menu** (`SdlcSidebarMenu`).

### A. SDLC Workflow Menu Group
1. **1. Codebase Context:** Select target files or classes from the tree or Neo4j dependency graph. Configure callers (upstream) and callees (downstream) search depth.
2. **2. Instructions:** Define the execution instructions using one of three tabs:
   * **Vibe Coding:** Plain text description of the desired change.
   * **BMad Agent:** Select an AI Agent role (e.g., `SecurityAuditAgent`) from the dropdown.
   * **SpecKit:** Paste formal Markdown or Gherkin specifications.
3. **3. LLM Chat:** Select the model provider (Ollama, Gemini, Copilot) and model name. Click **Send** to stream the response.
4. **4. Results Manager:** View execution history, status badges, and error diagnostics.

### B. Configuration Menu Group
* **App Configuration:** Adjust global parameters, default models, temperature, jQAssistant parser settings, and regex anonymization rules.

---

## 2. Step-by-Step Workflows

### Scenario 1: Refactoring a Java Service with Impact Analysis
1. Open **Codebase Context**.
2. Locate `FundTransferServiceImpl.java` in the tree or graph.
3. Set **Upstream Depth** to `2` and **Downstream Depth** to `2`.
4. Click **Fetch Impacts**. Token Razor highlights all dependent controllers and repositories.
5. Switch to **Instructions**, choose **BMad Agent**, and select `CodeRefactoringAgent`.
6. Switch to **LLM Chat**, select `Copilot` / `gpt-4o`, and click **Execute**.

### Scenario 2: Recovering from a Failed Script Execution
1. If an AI-generated script fails during execution, open **Results Manager**.
2. Locate the failed session (marked with a red warning badge).
3. Click **Reload Session**.
4. The application automatically reloads your context pointers and prompt, transitioning you back to **LLM Chat**.
5. Paste the build error into the chat and ask the LLM to patch the issue.

---

## 3. Privacy & Security Policies
To protect sensitive credentials:
1. Go to **Configuration > Policies & Security**.
2. Enable default anonymization rules or click **Add Rule**.
3. Define a regex pattern (e.g., `(?i)(password|secret)\s*=\s*['"][^'"]+['"]`).
4. Set the replacement token (e.g., `ANONYMIZED_SECRET`).
5. All matching credentials will be masked automatically before context is sent to external LLMs.
