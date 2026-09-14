const fs = require('fs');
const path = require('path');
const { JSDOM } = require('jsdom');

function splitHtmlFile(inputFile, outputDir) {
  if (!fs.existsSync(inputFile)) {
    console.error(`Error: File "${inputFile}" not found.`);
    process.exit(1);
  }

  fs.mkdirSync(outputDir, { recursive: true });

  const htmlContent = fs.readFileSync(inputFile, 'utf-8');
  // Parse HTML exactly as a browser would
  const dom = new JSDOM(htmlContent);
  const document = dom.window.document;

  // Extract Styles
  const styleElements = Array.from(document.querySelectorAll('style'));
  const cssContent = styleElements
    .map(el => el.innerHTML.trim())
    .filter(Boolean)
    .join('\n\n/* --- Extracted Style Block --- */\n\n');

  if (cssContent) {
    fs.writeFileSync(path.join(outputDir, 'styles.css'), cssContent, 'utf-8');
    styleElements.forEach(el => el.remove());

    const linkTag = document.createElement('link');
    linkTag.rel = 'stylesheet';
    linkTag.href = 'styles.css';
    document.head.appendChild(linkTag);
  }

  // Extract Scripts (ignoring external sources and non-JS templates)
  const scriptElements = Array.from(document.querySelectorAll('script:not([src])')).filter((script) => {
    const type = (script.getAttribute('type') || '').toLowerCase();
    return !type || ['text/javascript', 'application/javascript', 'module'].includes(type);
  });

  const jsContent = scriptElements
    .map(el => el.innerHTML.trim())
    .filter(Boolean)
    .join('\n\n// --- Extracted Script Block ---\n\n');

  if (jsContent) {
    fs.writeFileSync(path.join(outputDir, 'script.js'), jsContent, 'utf-8');

    const firstScript = scriptElements[0];
    const newScriptTag = document.createElement('script');
    newScriptTag.src = 'script.js';

    if (firstScript.getAttribute('type') === 'module') {
      newScriptTag.setAttribute('type', 'module');
    }

    // Preserve execution order by replacing the first script exactly where it was
    firstScript.replaceWith(newScriptTag);
    scriptElements.slice(1).forEach(el => el.remove());
  }

  // Save the safely modified DOM
  const outputHtmlName = path.basename(inputFile);
  fs.writeFileSync(path.join(outputDir, outputHtmlName), dom.serialize(), 'utf-8');

  console.log(`Successfully split HTML into ${outputDir}`);
}

const [inputFile, outputDir] = process.argv.slice(2);
if (!inputFile || !outputDir) process.exit(1);

splitHtmlFile(inputFile, outputDir);
