#!/bin/bash
# Ensure directory path is verified
mkdir -p src/webview/components

# Create a temporary automated script to cleanly remove the button and modal delta
cat << 'EOF' > patch_header.js
const fs = require('fs');
const path = 'src/webview/components/Header.tsx';

if (!fs.existsSync(path)) {
    console.error('Error: src/webview/components/Header.tsx not found.');
    process.exit(1);
}

let content = fs.readFileSync(path, 'utf8');

// 1. Clean up the unused useState hook from the React import statement
content = content.replace("import React, { useState } from 'react';", "import React from 'react';");

// 2. Remove the modal state declarations
content = content.replace(/const\s*\[isModalOpen,\s*setIsModalOpen\][\s\S]*?;\s*/, '');
content = content.replace(/const\s*\[modalFilters,\s*setModalFilters\][\s\S]*?;\s*/, '');

// 3. Remove the selectedEntities computation block
content = content.replace(/const\s*selectedEntities\s*=\s*[\s\S]*?;\s*/, '');

// 4. Remove the "View Selection" action button from the layout
content = content.replace(/<button\s+onClick=\{\(\)\s*=>\s*setIsModalOpen\(true\)\}[\s\S]*?<\/button>\s*/, '');

// 5. Remove the entire conditional selection modal JSX markup block
content = content.replace(/\{isModalOpen\s*&&\s*\([\s\S]*?\)}\s*(?=\s*<\/header>)/, '');

fs.writeFileSync(path, content, 'utf8');
console.log('Successfully updated Header.tsx');
EOF

# Execute the automated modification command
node patch_header.js

# Clean up the temporary patch file
rm patch_header.js

echo "✅ Removed 'View Selection' button and its modal from the Header component."
