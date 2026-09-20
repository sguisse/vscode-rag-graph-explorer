```yaml
instructions: "When notebook generates a new response, it MUST be a single YAML document wrapped in a 4-tilde code block (`~~~~yaml`)."
output: |-
      - Language: All code, variables, comments, documentation, and log statements MUST be in English.
      - Format: Output MUST be a SINGLE YAML document wrapped in a 4-tilde code block (`~~~~yaml`). Do NOT output a bash script — this pipeline is applied by `node dev-tools/apply-generation-manifest.js <manifest.yaml>`, which parses this YAML directly and writes files itself.
      - Schema (strict): every entry under `generation.files` MUST have exactly these keys:
        ```yaml
        generation:
          files:
            - filename: "BookmarksFeature"   # no extension, no path separators
              extension: "tsx"                # no leading dot
              path: "webview/src/features/bookmarks"   # workspace-relative directory
              action: create                  # create | update | delete
              content: |-                     # required for create/update, omitted for delete
                import React from 'react';
                ...full file content, unindented relative to this block...
        commit:
          message: "✅ feat(bookmarks): short conventional-commit summary"
        ```
      - Directories are created automatically by the applier (`mkdir -p` equivalent) — do not emit shell commands.
      - Never use snippets, placeholders, or truncation comments (`// ... rest of code`) inside `content` — always the full file.
      - Never escape or quote-wrap the `content` block scalar — YAML literal block (`|-`) content is taken verbatim; do not add backslash escapes for `$`, backticks, or quotes that would be needed in a shell heredoc.

      - JSX/TSX Integrity Safeguards (apply to any `content` for a `.tsx`/`.jsx` entry):
        - MANDATORY ONE-PROP-PER-LINE FORMAT: any JSX tag with 2+ attributes MUST place exactly one `propName={expression}` (or `propName="literal string"`) per line, with the tag's closing `>` or `/>` alone on its own line. NEVER place two or more attributes on the same line, and NEVER split a single attribute across multiple lines.
        - NEVER alphabetize, reorder, or "tidy" a JSX tag's attributes from however they are first authored — emit them in logical/semantic order and never do a second reformatting pass over already-emitted JSX.
        - NEVER wrap a JSX expression container in string quotes. `prop="{value}"` is INVALID; it MUST be emitted as `prop={value}`. A quote character (`"` or `'`) immediately followed by `{` is ALWAYS a corruption signature.
        - Every JSX opening tag must have a matching closing tag or be self-closing (`/>`); verify tag nesting is balanced before finalizing each file's `content`.
        - The applier runs a real TypeScript-parser syntax check on every `.ts`/`.tsx`/`.js`/`.jsx` entry BEFORE writing anything to disk, and rejects the ENTIRE manifest (zero files written) if any entry fails to parse. If you are unsure a block is syntactically valid, prefer emitting it more verbosely (one prop per line, fully expanded) rather than compacting it.

      - Batching: prefer smaller manifests (one file, or a handful of tightly-coupled files) over one giant manifest covering dozens of files, to keep each generation's cognitive load low and failures easy to localize.

      - Completion Verification:
        - The applier automatically runs `npm run build` after a successful write; do not duplicate this in the manifest.
        - Set `commit.message` to a single conventional-commit-style summary line prefixed with an emoji, e.g. `"✅ feat(ui): Added interactive hand pointer cursor to action buttons"`.
```
