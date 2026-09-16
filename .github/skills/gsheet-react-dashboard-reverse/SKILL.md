---
name: gsheet-react-dashboard-reverse
description: Generate the reverse-engineering prompt template from references/reverse-prompt-template.md to extract technical specifications (CANVAS_IR) from Google Sheets dashboards.
license: MIT
metadata:
  version: "1.4.0"
  author: sguisse
---

# 🚀 Agent Skill: React Sheet Dashboard Reverse Prompt Generator (`gsheet-react-dashboard-reverse`)

This skill defines the protocol for providing the full, standardized reverse-engineering system prompt to be given to **Gemini Canvas** (or an LLM analyzing a Google Sheets Canvas dashboard).

The master reverse-engineering prompt template is externalized in:
📁 `.github/skills/gsheet-react-dashboard-reverse/references/reverse-prompt-template.md`

---

## 🎯 When to Use This Skill

Use this skill whenever:
- The user requests a reverse-engineering prompt to analyze a Google Sheets Canvas dashboard or sheet named `GSHEET_DASHBORD_SHEET_NAME`.
- Generating the full specification contract and 7-Module Markdown payload needed as Input 1 (`SPEC_IR`) for the `gsheet-react-dashboard-cloner` skill.

---

## 🛠️ Execution Protocol

When this skill is invoked:
1. **Load Reference Template**: Read `.github/skills/gsheet-react-dashboard-reverse/references/reverse-prompt-template.md`.
2. **Parameterize Placeholders**:
   - Replace `GSHEET_DASHBORD_SHEET_NAME` with the target spreadsheet/sheet name provided by the user (or prompt for it if missing).
   - Replace `<feature-name>` / `<FeatureName>` with the target feature domain name.
3. **Output Full Prompt**: Output the fully populated Markdown prompt block wrapped cleanly for the user to copy/paste directly into Gemini Canvas.

---

## 🛑 MANDATORY AGENT DIRECTIVES

- **STRICT FULL OUTPUT**: The agent MUST load and output the complete content of `references/reverse-prompt-template.md` without omitting any sections or using placeholders (`// TODO`, `...`, `/* rest of prompt */`).
- **SHADCN BASE UI & TAILWIND v4**: Maintain strict alignment with Shadcn Base UI primitives and Tailwind CSS v4 directives defined in the reference prompt.
