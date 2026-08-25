# Token Razor SDLC - User Guide

## Navigating the Application
The primary way to navigate the Token Razor extension is via the **Left Sidebar**.

### 1. SDLC Workflow Steps
Expand the **SDLC Workflow** menu in the sidebar to move through your coding task:
* **Codebase Context:** Start here. Use the tree or graph to find the files you want to modify. Check the boxes to include them in your context.
* **Instructions:** Switch to this tab to tell the LLM what to do. Choose between *Vibe* (quick chat), *BMad* (agent-based), or *SpecKit* (strict specification) panels.
* **LLM Chat:** Review the final payload and send it to your chosen AI model.
* **Results Manager:** View your past and current task executions.

### 2. Handling Errors & Iterating
If an AI-generated script fails to build:
1. Go to **Results Manager** via the sidebar.
2. Find the failed session in the table (it will have an Error status).
3. Click **Reload Session**.
4. The app will automatically switch you to the **LLM Chat**, restoring your exact files and prompt.
5. Ask the LLM to fix the specific build error shown in the chat history.

### 3. Configuration
Expand the **Configuration** menu in the sidebar to adjust how the extension behaves:
* **Global:** Set your API keys and default models.
* **Codebase Parsers:** Tweak how the app reads your Neo4j graph.
* **Policies:** Define regex rules to hide sensitive data (like passwords) before it ever leaves your machine.
