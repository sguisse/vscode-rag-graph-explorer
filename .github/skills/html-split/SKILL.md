---
name: html-split
description: Extract inline CSS, JavaScript, and HTML content into modular files with isolated dependency lifecycle and optional head tag commenting for rendering tests.
license: MIT
metadata:
  version: "1.4.0"
  author: sguisse
---

# 🚀 Agent Skill: HTML Split (`html-split`)

Automated protocol for splitting monolithic HTML files into modular architectural files (`index.html`, `styles.css`, and `script.js`) while ensuring zero functional regression.

---

## 🛑 MANDATORY AGENT DIRECTIVES (STRICT TOOL EXECUTION)

- **NEVER SIMULATE OR MANUALLY GENERATE FILES**: The agent MUST NOT attempt to parse HTML, extract scripts/styles, or generate output files (`index.html`, `styles.css`, `script.js`) using LLM text generation or file-creation tools (`create_file`, `write_file`).
- **MUST EXECUTE VIA TERMINAL**: The agent MUST execute the shell script using the workspace terminal/command execution tool (`run_in_terminal` or equivalent bash tool).
- **PARAMETER PARSING**:
  - If the user specifies "rendering", "only for rendering", "rendering test", or "layout preview", append `--rendering-only` to the command execution.

---

## 🎯 When to Use This Skill

Use this skill whenever:
- Refactoring single-file HTML components or web applications into clean, modular files.
- Safe extraction of inline CSS and JavaScript while preserving script load order, CSS `@import` rules, and script module tags.
- Performing visual rendering tests by enabling **Rendering-Only Mode** (comments out non-stylesheet head tags like `<meta>`, `<script>`, and `<title>`).
- Running in automated agent pipelines requiring ephemeral dependency management with zero leftover environment artifacts.

---

## 🛠️ Execution Protocol

The main entry point for the agent is the self-cleaning shell runner script `scripts/run-split.sh`.

### 1. Standard Extraction
Extracts inline styles to `styles.css`, scripts to `script.js`, and updates the HTML file accordingly in the target output directory:
```bash
bash .github/skills/html-split/scripts/run-split.sh <inputFile> <outputDir>
```

### 2. Rendering-Only Mode
Extracts assets and comments out non-style tags in `<head>` (useful for static visual layout inspection):
```bash
bash .github/skills/html-split/scripts/run-split.sh <inputFile> <outputDir> --rendering-only
```

---

## ⚠️ Anti-Regression & Architectural Guarantees

- **Ephemeral Dependency Management**: Dependencies (`jsdom`) are installed inside a temporary lifecycle in the script directory and purged automatically via `trap` cleanup upon execution finish or failure.
- **CSS `@import` Order Integrity**: CSS `@import` statements extracted from `<style>` tags are automatically hoisted to the top of `styles.css` to comply with standard CSS syntax requirements.
- **Script DOM Sequence Retention**: The extracted external `<script src="script.js">` tag replaces the exact position of the first inline `<script>` tag in the DOM to preserve document load sequence and execution timing.
- **Asset Co-location Guarantee**: All generated split assets (`styles.css`, `script.js`, and output HTML) are written together to `<outputDir>`, ensuring relative script and link path references remain strictly valid.
- **Module Attribute Retention**: If any extracted script block utilizes `type="module"`, the attribute is preserved on the external script tag.
- **Non-JS Script Tag Exclusion**: Non-executable template or data scripts (e.g., `<script type="application/json">`) are preserved intact inside the HTML file.
- **Rendering-Only Comments**: When `--rendering-only` is provided, non-style tags in `<head>` (such as `<meta>`, `<script>`, `<title>`, `<base>`) are converted into HTML comments (`<!-- ... -->`) while leaving `<style>` and `<link rel="stylesheet">` active.