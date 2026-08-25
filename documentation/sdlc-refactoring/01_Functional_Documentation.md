# Token Razor SDLC - Functional Documentation

## Overview
The Token Razor extension accelerates the Software Development Life Cycle (SDLC) by deeply integrating the codebase context (via Neo4j and jQAssistant) with Large Language Models (LLMs). This refactoring pivots the application from a monolithic, single-session tool into a robust, multi-session workflow engine.

## The SDLC Workflow Domains
1. **Codebase Context:** Users visualize their project architecture and select the specific files, methods, and components impacted by their target feature or bug fix.
2. **Instructions:** Users define their coding strategy (e.g., Vibe coding, Skill-driven BMad, or SpecKit) and inject specific prompts.
3. **LLM Chat:** The interface where the optimized context and instructions are sent to an LLM (Ollama, Gemini, Copilot).
4. **Results Manager:** Tracks the execution of LLM-generated actionable scripts. If a build fails or tests do not pass, the session is flagged with an error.

## The Multi-Session Paradigm
Previously, losing connection or hitting an error meant losing the carefully crafted context and prompt.
With the new **Results Manager**, every workflow execution is saved as a discrete "Session".
If a script fails:
1. The user views the error in the Results Manager.
2. They click "Reload Session".
3. The exact codebase selection and prompt are restored.
4. The user is taken back to the LLM Chat to see the error output and iterate immediately.

## Global Configuration vs. Session Policies
* **Global Config:** Settings like API keys, default models, and UI themes apply across the entire extension.
* **Session Policies:** Specific context minification rules and anonymization regexes (to strip passwords/PII) can be configured globally but apply dynamically to the payload of the active session.
