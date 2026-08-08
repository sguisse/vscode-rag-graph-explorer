# ⚒️ Development TOOLS

## 💡 generate-xxxxx.js
These scripts are used at build time to reconstruct objects depending on the project configuration and other files content.
It uses in output a suffix `.gen.ts` to the generated file to distinguish it from the source files.

## 🏗️ Building the Extension
The extension is built using the `npm run compile` command, which:
  * Call the `generate-all.js` script to generate the necessary files,
  * Compiles TypeScript files including the generated files into JavaScript files in the `dist-xxx` folder.
