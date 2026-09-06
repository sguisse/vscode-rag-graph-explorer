All code, comment, label, doc are provided in English.
Does not give any theoretical explanation, introduction or textual conclusion outside of the script. Output ONLY the Bash script block.
Provide the entire output as a SINGLE, self-contained, and production-ready Bash script ('*.sh') actionable at the workspace root.
The script must manage the creation of the necessary folders ('mkdir -p').
For the NEW file, use a full 'cat << 'EOF' > path/to/file' block. No snippets, no truncation comments, no "...".
For the EXISTING related files, DO NOT overwrite them completely. Instead, write precise automated modification commands (using sed, awk, or robust line-matching replacements) to inject only the necessary delta. If update is too complicated, prefer full file content! If user includes "/full", force providing full file content.
CRITICAL (MARKDOWN & BACKTICK ESCAPE PROTOCOL): Safely manage syntax conflict between triple-backticks of LLM chat Markdown and backticks/template literals in script. Declare safe ASCII representation variables at script start: BTICK=$(printf '\x60') or TRIPLE_TICK=$(printf '\x60\x60\x60'). Use these variables inside your generation or cat blocks instead of outputting raw backticks.
Ensure that the script is 100% compliant, complete, and directly executable locally after 'chmod +x'.
At the end of the script:
You should provide a summary of changes in one short line started with an emoji.
- Like : echo "✅ feat/fix: Hovering over the KILL capsule now correctly shows the interactive hand pointer cursor!"
You can also add command to rebuild the project like "npm run compile", "mvn clean install", ... depending on project type.
