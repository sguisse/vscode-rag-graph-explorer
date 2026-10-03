# ⚒️ Development TOOLS

## 💡 generate-xxxxx.js
These scripts are used at build time to reconstruct objects depending on the project configuration and other files content.
It uses in output a suffix `.gen.ts` to the generated file to distinguish it from the source files.

---

## ⚙️ Code Generation Tools

Scripts under this section extract configuration definitions, type schemas, or service interfaces and emit auto-generated TypeScript/Python artifacts (`.gen.ts` or `_gen.py`).

### 🏗️ Building the Extension
The extension is built using the `npm run compile` command, which:
* Call the `generate-all.js` script to generate the necessary files,
* Compiles TypeScript files including the generated files into JavaScript files in the `dist-xxx` folder.

### 📦 generate-types.js + generate-types.json
Generates strongly-typed string-union `.gen.ts` files (list constant, icon map, type alias, type guard,
and getter) from a single declarative JSON config, so a new enum-like type only needs an entry added to
`generate-types.json` instead of hand-writing the same TypeScript boilerplate every time.

`generate-types.json` is an array of type definitions:
```json
[
{
    "name": "ExportFormat",
    "path": "shared/services/codebase-exporter/types/type-export-format.gen.ts",
    "values": [
    { "value": "yaml", "label": "YAML", "icon": "📄" },
    { "value": "json", "label": "JSON", "icon": "🟦" }
    ]
}
]
```
- `name`: the generated TypeScript type name (e.g. `ExportFormat`).
- `path`: workspace-relative output path for the `.gen.ts` file (parent directories are created automatically).
- `values`: the union members; each `value` becomes a string-union member, `label` is the display text, and
`icon` (optional) feeds the generated icon map.

For each entry, `generate-types.js` emits:
- `{NAME}_LIST`: the readonly array of raw string values.
- `{NAME}_ICON_MAP`: a map from value to `{ icon, label }`.
- `type {Name}`: the string-union type derived from `{NAME}_LIST`.
- `is{Name}(value)`: a type-guard runtime check.
- `get{Name}(value)`: a safe cast helper returning `{Name} | undefined`.

It runs automatically as part of `npm run generate:code` (called by `generate-all.js`), so it never needs to
be invoked manually — just edit `generate-types.json` and rebuild.
