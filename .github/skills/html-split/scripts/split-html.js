const fs = require('fs');
const path = require('path');
const { JSDOM } = require('jsdom');

/**
 * Splits a single HTML file into separate HTML, CSS, and JS files.
 *
 * @param {string} inputFile - Path to source HTML file.
 * @param {string} outputDir - Path to target output directory.
 * @param {boolean} renderingOnly - Whether to comment out non-style tags in head.
 */
function splitHtmlFile(inputFile, outputDir, renderingOnly = false) {
  if (!fs.existsSync(inputFile)) {
    console.error(`Error: File "${inputFile}" not found.`);
    process.exit(1);
  }

  fs.mkdirSync(outputDir, { recursive: true });

  const htmlContent = fs.readFileSync(inputFile, 'utf-8');
  const dom = new JSDOM(htmlContent);
  const document = dom.window.document;

  // 1. Extract Styles & Hoist @import Statements
  const styleElements = Array.from(document.querySelectorAll('style'));
  const rawCssBlocks = styleElements.map(el => el.innerHTML.trim()).filter(Boolean);

  if (rawCssBlocks.length > 0) {
    const importRules = [];
    const cssRules = [];

    rawCssBlocks.forEach(block => {
      const lines = block.split('\n');
      lines.forEach(line => {
        const trimmed = line.trim();
        if (trimmed.startsWith('@import')) {
          importRules.push(trimmed);
        } else {
          cssRules.push(line);
        }
      });
    });

    const combinedCss = [
      importRules.join('\n'),
      cssRules.join('\n')
    ].filter(Boolean).join('\n\n/* --- Extracted Style Block --- */\n\n');

    fs.writeFileSync(path.join(outputDir, 'styles.css'), combinedCss, 'utf-8');
    styleElements.forEach(el => el.remove());

    const linkTag = document.createElement('link');
    linkTag.rel = 'stylesheet';
    linkTag.href = 'styles.css';
    document.head.appendChild(linkTag);
  }

  // 2. Extract Scripts (Preserving Execution Order & Module Types)
  const scriptElements = Array.from(document.querySelectorAll('script:not([src])')).filter(script => {
    const type = (script.getAttribute('type') || '').toLowerCase();
    return !type || ['text/javascript', 'application/javascript', 'module'].includes(type);
  });

  if (scriptElements.length > 0) {
    const isModule = scriptElements.some(el => (el.getAttribute('type') || '').toLowerCase() === 'module');

    const jsContent = scriptElements
      .map(el => el.innerHTML.trim())
      .filter(Boolean)
      .join('\n\n// --- Extracted Script Block ---\n\n');

    fs.writeFileSync(path.join(outputDir, 'script.js'), jsContent, 'utf-8');

    const firstScript = scriptElements[0];
    const newScriptTag = document.createElement('script');
    newScriptTag.src = 'script.js';

    if (isModule) {
      newScriptTag.setAttribute('type', 'module');
    }

    firstScript.replaceWith(newScriptTag);
    scriptElements.slice(1).forEach(el => el.remove());
  }

  // 3. Optional Rendering-Only Mode: Comment out non-style tags in <head>
  if (renderingOnly && document.head) {
    const headChildren = Array.from(document.head.children);
    headChildren.forEach(child => {
      const tagName = child.tagName.toLowerCase();
      const isStyle = tagName === 'style';
      const isCssLink = tagName === 'link' && child.getAttribute('rel') === 'stylesheet';

      if (!isStyle && !isCssLink) {
        const commentNode = document.createComment(` ${child.outerHTML} `);
        child.replaceWith(commentNode);
      }
    });
  }

  // 4. Save Output HTML File
  const outputHtmlName = path.basename(inputFile);
  fs.writeFileSync(path.join(outputDir, outputHtmlName), dom.serialize(), 'utf-8');

  console.log(`Successfully split "${inputFile}" into "${outputDir}" (Rendering Only: ${renderingOnly}).`);
}

const args = process.argv.slice(2);
const renderingOnly = args.includes('--rendering-only') || args.includes('--comment-head');
const nonFlagArgs = args.filter(arg => !arg.startsWith('--'));

const [inputFile, outputDir] = nonFlagArgs;

if (!inputFile || !outputDir) {
  console.error("Usage: node split-html.js <inputFile> <outputDir> [--rendering-only]");
  process.exit(1);
}

splitHtmlFile(inputFile, outputDir, renderingOnly);
