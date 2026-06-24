#!/bin/bash
# High-Performance Automated Script to align the VS Code Webview with the Graphify Explorer UI Guidelines.
# Operates directly at the workspace root.

# 1. Ensure target directories are verified
mkdir -p media

# 2. Patch package.json precisely without overwriting it completely
if [ -f "package.json" ]; then
    cat << 'EOF' > patch_package.js
const fs = require('fs');
const pkgPath = 'package.json';
if (fs.existsSync(pkgPath)) {
    let pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));
    pkg.displayName = "Graphify Explorer";
    pkg.description = "Expert Node Navigator and Architecture Explorer via RAG and Gemini";
    fs.writeFileSync(pkgPath, JSON.stringify(pkg, null, 4), 'utf8');
    console.log('✅ Updated package.json displayName to Graphify Explorer.');
}
EOF
    node patch_package.js
    rm patch_package.js
fi

# 3. Apply a robust block-matching structural modification on media/webview.html
cat << 'EOF' > patch_webview.js
const fs = require('fs');
const htmlPath = 'media/webview.html';

if (!fs.existsSync(htmlPath)) {
    console.error('❌ Erreur: media/webview.html est introuvable.');
    process.exit(1);
}

// Complete rewrite of the content to match the unified layout, adaptive theme, and full layout guidelines precisely
const updatedContent = `<!DOCTYPE html>
<html lang="fr" class="dark">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Graphify Explorer</title>
    <meta http-equiv="Content-Security-Policy" content="default-src 'none'; img-src vscode-webview-resource: https: data:; font-src https://cdn.jsdelivr.net vscode-webview-resource:; style-src 'unsafe-inline' https://cdn.jsdelivr.net vscode-webview-resource:; script-src 'unsafe-inline' 'unsafe-eval' https://cdn.tailwindcss.com https://unpkg.com https://cdn.jsdelivr.net vscode-webview-resource:; connect-src https://generativelanguage.googleapis.com;">

    <link href="https://cdn.jsdelivr.net/npm/@vscode/codicons/dist/codicon.css" rel="stylesheet">
    <script type="module" src="https://cdn.jsdelivr.net/npm/@vscode/webview-ui-toolkit@latest/dist/toolkit.js"></script>
    <script src="https://cdn.tailwindcss.com"></script>
    <script>tailwind.config = { darkMode: 'class' }</script>
    <script type="text/javascript" src="https://unpkg.com/vis-network/standalone/umd/vis-network.min.js"></script>

    <style>
        * { box-sizing: border-box; }
        body {
            padding: 0; margin: 0;
            display: flex; flex-direction: column;
            height: 100vh; width: 100vw;
            font-family: var(--vscode-font-family);
            background-color: var(--vscode-editor-background);
            color: var(--vscode-foreground);
            overflow: hidden;
        }
        ::-webkit-scrollbar { width: 6px; height: 6px; }
        ::-webkit-scrollbar-thumb { background: var(--vscode-scrollbarSlider-background); border-radius: 3px; }
        ::-webkit-scrollbar-thumb:hover { background: var(--vscode-scrollbarSlider-hoverBackground); }

        .native-input {
            background: var(--vscode-input-background); color: var(--vscode-input-foreground);
            border: 1px solid var(--vscode-input-border); border-radius: 2px;
            padding: 3px 6px; outline: none; font-size: 11px; font-family: var(--vscode-font-family);
        }
        .native-input:focus { border-color: var(--vscode-focusBorder); }
        .custom-cb {
            appearance: none; -webkit-appearance: none;
            width: 14px; height: 14px; min-width: 14px;
            border: 1px solid var(--vscode-checkbox-border);
            background: var(--vscode-checkbox-background);
            border-radius: 3px; display: inline-flex; align-items: center; justify-content: center;
            margin: 0; padding: 0; cursor: pointer; position: relative;
        }
        .custom-cb:checked::after {
            content: ''; width: 3px; height: 7px; border: solid var(--vscode-checkbox-foreground);
            border-width: 0 2px 2px 0; transform: rotate(45deg); position: absolute; top: 1px;
        }
        .custom-cb:indeterminate::after {
            content: ''; width: 8px; height: 2px; background: var(--vscode-checkbox-foreground); position: absolute;
        }
    </style>
</head>
<body>

    <div class="flex justify-between items-center p-3 border-b border-[var(--vscode-panel-border)] bg-[var(--vscode-sideBar-background)] flex-shrink-0">
        <div class="flex items-center gap-3">
            <div class="w-8 h-8 bg-blue-600 text-white font-black flex items-center justify-center rounded-lg text-lg shadow-md">G</div>
            <div>
                <h1 class="text-sm font-bold tracking-tight text-[var(--vscode-foreground)] m-0 flex items-center gap-1.5">Graphify</h1>
                <span class="text-[11px] text-[var(--vscode-descriptionForeground)] block -mt-0.5">Expert Node Navigator</span>
            </div>
        </div>
        <div class="flex items-center gap-2">
            <span class="text-xs text-[var(--vscode-descriptionForeground)] hidden md:inline mr-2">Outil d'analyse structurelle</span>
            <vscode-button id="btn-toggle-theme" appearance="icon" title="Toggle Thème (Mode Clair / Sombre)">
                <span class="codicon codicon-color-mode"></span>
            </vscode-button>
            <vscode-button id="btn-show-popup" appearance="secondary"><span class="codicon codicon-list-selection"></span> Voir Sélection</vscode-button>
            <vscode-button id="btn-load-graph" appearance="primary"><span class="codicon codicon-file-symlink-file"></span> Charger graph.json</vscode-button>
            <input type="file" id="file-upload" accept=".json" style="display: none;">
        </div>
    </div>

    <div class="flex flex-col flex-grow flex-1 overflow-hidden">

        <details class="bg-[var(--vscode-editorWidget-background)] border-b border-[var(--vscode-panel-border)] p-3 flex-shrink-0" open>
            <summary class="font-bold text-xs text-[var(--vscode-foreground)] cursor-pointer select-none outline-none hover:opacity-80">
                🔍 Filtres d'Exploration
            </summary>
            <div class="grid grid-cols-1 md:grid-cols-3 gap-4 mt-3">
                <div class="flex flex-col gap-1.5">
                    <label class="text-[10px] uppercase font-bold tracking-wider opacity-80">Types d'entités</label>
                    <select id="filter-types" multiple class="native-input h-[64px]"></select>
                    <span class="text-[10px] text-[var(--vscode-descriptionForeground)] italic">Maintenez Ctrl/Cmd pour choix multiples.</span>
                </div>
                <div class="flex flex-col gap-1.5">
                    <label class="text-[10px] uppercase font-bold tracking-wider opacity-80">Recherche</label>
                    <select id="filter-mode" class="native-input w-full">
                        <option value="contains">Contient</option>
                        <option value="exact">Exactement</option>
                        <option value="starts_with">Commence par</option>
                    </select>
                    <div class="flex gap-1 mt-0.5">
                        <vscode-text-field id="filter-text" placeholder="Filtrer..." class="flex-grow"></vscode-text-field>
                        <vscode-button id="filter-clear" appearance="secondary" title="Effacer">✕</vscode-button>
                    </div>
                    <vscode-checkbox id="filter-regex">Activer Regex</vscode-checkbox>
                </div>
                <div class="flex flex-col gap-1.5 justify-start pt-4">
                    <label class="text-[10px] uppercase font-bold tracking-wider opacity-80 mb-1">Cibles de filtrage</label>
                    <vscode-checkbox id="filter-on-tree" checked>Appliquer sur l'Arbre</vscode-checkbox>
                    <vscode-checkbox id="filter-on-graph" checked>Appliquer sur le Graphe</vscode-checkbox>
                </div>
            </div>
        </details>

        <div class="flex border-b border-[var(--vscode-panel-border)] bg-[var(--vscode-editorGroupHeader-tabsBackground)] select-none overflow-x-auto flex-shrink-0">
            <button id="tab-btn-explorer" class="px-4 py-2 text-xs font-bold border-b-2 border-blue-500 text-[var(--vscode-foreground)] outline-none transition-all">🕸️ Vue Explorateur</button>
            <button id="tab-btn-ai" class="px-4 py-2 text-xs font-bold border-b-2 border-transparent text-[var(--vscode-descriptionForeground)] opacity-70 hover:opacity-100 outline-none transition-all">✨ Assistant IA</button>
            <button id="tab-btn-config" class="px-4 py-2 text-xs font-bold border-b-2 border-transparent text-[var(--vscode-descriptionForeground)] opacity-70 hover:opacity-100 outline-none transition-all">⚙️ Configuration</button>
        </div>

        <div class="flex-1 relative overflow-hidden bg-[var(--vscode-editor-background)]">

            <div id="tab-content-explorer" class="absolute inset-0 flex overflow-hidden">

                <div id="pane-left" class="border-r border-[var(--vscode-panel-border)] bg-[var(--vscode-sideBar-background)] flex flex-col h-full overflow-hidden" style="width: 35%; min-width: 250px; max-width: 70%; resize: horizontal;">
                    <div class="p-2 border-b border-[var(--vscode-panel-border)] bg-[var(--vscode-editorGroupHeader-tabsBackground)] flex flex-col gap-2 flex-shrink-0">
                        <div class="flex justify-between items-center w-full">
                            <span class="text-[10px] uppercase font-bold tracking-wider opacity-80">Regrouper par</span>
                            <div class="flex gap-1">
                                <vscode-button id="btn-sort-asc" appearance="icon" title="Tri ASC">▲</vscode-button>
                                <vscode-button id="btn-sort-desc" appearance="icon" title="Tri DESC">▼</vscode-button>
                            </div>
                        </div>
                        <div class="flex gap-1.5 items-center justify-between w-full">
                            <select id="tree-grouping" class="native-input flex-grow">
                                <option value="folder">Dossier</option>
                                <option value="extension">Extension</option>
                                <option value="root">Racine</option>
                            </select>
                            <div class="flex gap-1 flex-shrink-0">
                                <vscode-button id="btn-toggle-case" appearance="secondary" style="height:22px; min-width:24px; padding:0;" title="Ignorer la casse">Aa</vscode-button>
                                <vscode-button id="btn-tree-filter" appearance="secondary" style="height:22px; min-width:24px; padding:0;" title="Afficher uniquement sélectionnés">👁️</vscode-button>
                                <vscode-button id="btn-clear-selection" appearance="secondary" style="height:22px; min-width:24px; padding:0;" title="Effacer les sélections">🗑️</vscode-button>
                            </div>
                        </div>
                    </div>
                    <div id="tree-container" class="flex-1 overflow-y-auto p-2"></div>
                </div>

                <div id="pane-right" class="flex-grow flex flex-col h-full overflow-hidden relative">
                    <div class="p-2 border-b border-[var(--vscode-panel-border)] bg-[var(--vscode-editorGroupHeader-tabsBackground)] flex items-center justify-between gap-4 flex-shrink-0">
                        <div class="flex items-center gap-3">
                            <label class="text-[11px] flex items-center gap-1.5 opacity-90">
                                <span>Appelants (Parents) :</span>
                                <input type="number" id="depth-parent" value="0" min="0" class="native-input w-12 text-center">
                            </label>
                            <label class="text-[11px] flex items-center gap-1.5 opacity-90">
                                <span>Appelés (Enfants) :</span>
                                <input type="number" id="depth-child" value="0" min="0" class="native-input w-12 text-center">
                            </label>
                        </div>
                        <vscode-button id="reset-selection" appearance="secondary" style="height: 24px;"><span class="codicon codicon-screen-full"></span> Recadrer</vscode-button>
                    </div>
                    <div class="flex-grow relative w-full h-full">
                        <div id="network-container" class="absolute inset-0 outline-none bg-transparent"></div>

                        <div class="absolute bottom-4 left-4 bg-[var(--vscode-editorWidget-background)] bg-opacity-90 p-2.5 rounded border border-[var(--vscode-panel-border)] shadow-md pointer-events-none text-[10px] flex flex-col gap-1 z-10 min-w-[130px]">
                            <span class="font-bold border-b border-[var(--vscode-panel-border)] pb-1 mb-1 opacity-80">Légende</span>
                            <div class="flex items-center gap-2"><span class="w-2.5 h-2.5 rounded-sm bg-[#3b82f6]"></span> Fichiers (Hexagone)</div>
                            <div class="flex items-center gap-2"><span class="w-2.5 h-2.5 rounded-sm bg-[#22c55e]"></span> Classes (Rectangle)</div>
                            <div class="flex items-center gap-2"><span class="w-2.5 h-2.5 rounded-sm bg-[#a855f7]"></span> Méthodes (Cercle)</div>
                            <div class="flex items-center gap-2"><span class="w-2.5 h-2.5 rounded-sm bg-[#eab308]"></span> Documents (Note)</div>
                        </div>
                    </div>
                </div>

            </div>

            <div id="tab-content-ai" class="absolute inset-0 hidden flex-col md:flex-row p-4 gap-4 overflow-hidden">
                <div class="w-full md:w-1/4 flex flex-col gap-2 flex-shrink-0">
                    <h3 class="text-xs uppercase tracking-wider font-bold text-[var(--vscode-foreground)] flex items-center gap-1.5"><span class="text-purple-500">✨</span> Assistant Gemini</h3>
                    <p class="text-xs text-[var(--vscode-descriptionForeground)] leading-relaxed">
                        Analysez les nœuds sélectionnés pour comprendre l'architecture, identifier les anomalies de conception et suggérer des améliorations structurales.
                    </p>
                    <vscode-button id="btn-analyze" class="mt-2 w-full"><span class="codicon codicon-play"></span> Lancer l'analyse</vscode-button>
                </div>
                <div class="flex-grow flex flex-col border border-[var(--vscode-panel-border)] rounded bg-[var(--vscode-input-background)] overflow-hidden">
                    <div class="p-2 border-b border-[var(--vscode-panel-border)] bg-[var(--vscode-editorGroupHeader-tabsBackground)] text-[10px] uppercase font-bold opacity-80">Rapport d'analyse</div>
                    <div id="ai-response-container" class="flex-1 overflow-y-auto p-4 text-xs leading-relaxed">
                        <div class="text-[var(--vscode-descriptionForeground)] italic text-center mt-12">Sélectionnez des nœuds via l'onglet d'exploration et lancez l'analyse automatisée.</div>
                    </div>
                </div>
            </div>

            <div id="tab-content-config" class="absolute inset-0 hidden flex-col p-4 gap-3 overflow-y-auto">
                <div class="flex justify-between items-center border-b border-[var(--vscode-panel-border)] pb-2 flex-shrink-0">
                    <h3 class="text-xs uppercase tracking-wider font-bold">Configuration des Types de Nœuds</h3>
                    <vscode-button id="btn-save-config">Sauvegarder et Appliquer</vscode-button>
                </div>
                <p class="text-xs text-[var(--vscode-descriptionForeground)] flex-shrink-0">
                    Saisissez ou modifiez les configurations sous forme de tableau JSON strict pour spécifier les filtres applicables de l'application.
                </p>
                <textarea id="config-textarea" class="flex-grow flex-1 native-input font-mono p-3 text-xs border rounded min-h-[200px]" style="tab-size: 4;"></textarea>
            </div>

        </div>
    </div>

    <div id="popup-selected" class="fixed inset-0 bg-black bg-opacity-70 hidden items-center justify-center z-50 p-4 backdrop-blur-sm">
        <div class="bg-[var(--vscode-editor-background)] border border-[var(--vscode-panel-border)] rounded-lg shadow-xl w-full max-w-3xl max-h-full flex flex-col overflow-hidden">
            <div class="p-3 border-b border-[var(--vscode-panel-border)] bg-[var(--vscode-sideBar-background)] flex justify-between items-center">
                <h3 class="text-xs uppercase font-bold flex items-center gap-2 tracking-wide">
                    <span class="codicon codicon-list-selection text-blue-500"></span> Entités Sélectionnées
                </h3>
                <button id="close-popup-icon" class="text-[var(--vscode-foreground)] opacity-60 hover:opacity-100 text-sm font-bold outline-none">✕</button>
            </div>
            <div class="p-2 border-b border-[var(--vscode-panel-border)] bg-[var(--vscode-editorWidget-background)] text-[11px] flex flex-wrap items-center gap-4">
                <span class="font-semibold opacity-80">Filtrer par type :</span>
                <div class="flex items-center gap-3">
                    <label class="flex items-center gap-1 cursor-pointer"><input type="checkbox" class="pop-filter" value="file" checked> Fichiers</label>
                    <label class="flex items-center gap-1 cursor-pointer"><input type="checkbox" class="pop-filter" value="class" checked> Classes</label>
                    <label class="flex items-center gap-1 cursor-pointer"><input type="checkbox" class="pop-filter" value="method" checked> Méthodes</label>
                    <label class="flex items-center gap-1 cursor-pointer"><input type="checkbox" class="pop-filter" value="document" checked> Documents</label>
                </div>
            </div>
            <div class="p-4 flex-1 overflow-y-auto bg-[var(--vscode-input-background)]">
                <div id="modal-counter" class="text-[11px] opacity-70 mb-3 italic">0 élément(s) affiché(s) sur 0</div>
                <ul id="popup-list" class="flex flex-col gap-2 m-0 p-0 list-none"></ul>
            </div>
            <div class="p-3 border-t border-[var(--vscode-panel-border)] bg-[var(--vscode-sideBar-background)] flex justify-end">
                <vscode-button id="close-popup-btn" appearance="secondary">Fermer</vscode-button>
            </div>
        </div>
    </div>

    <script>
        const vscode = acquireVsCodeApi();
        let apiKey = "";

        window.rawNodes = [];
        window.rawEdges = [];
        window.selectedNodesState = new Set();
        window.childrenMap = {};
        window.parentMap = {};
        window._idLookup = {};

        window.treeShowSelected = false;
        window.ignoreCaseState = true;
        window.currentSort = 'asc';

        // --- NAVIGATION ONGLES ---
        const tabButtons = {
            explorer: document.getElementById('tab-btn-explorer'),
            ai: document.getElementById('tab-btn-ai'),
            config: document.getElementById('tab-btn-config')
        };
        const tabPanels = {
            explorer: document.getElementById('tab-content-explorer'),
            ai: document.getElementById('tab-content-ai'),
            config: document.getElementById('tab-content-config')
        };

        function switchTab(activeKey) {
            Object.keys(tabButtons).forEach(key => {
                if (key === activeKey) {
                    tabButtons[key].classList.add('border-blue-500', 'text-[var(--vscode-foreground)]');
                    tabButtons[key].classList.remove('border-transparent', 'text-[var(--vscode-descriptionForeground)]', 'opacity-70');
                    tabPanels[key].classList.remove('hidden');
                    if(key === 'explorer') tabPanels[key].classList.add('flex');
                } else {
                    tabButtons[key].classList.remove('border-blue-500', 'text-[var(--vscode-foreground)]');
                    tabButtons[key].classList.add('border-transparent', 'text-[var(--vscode-descriptionForeground)]', 'opacity-70');
                    tabPanels[key].classList.add('hidden');
                    if(key === 'explorer') tabPanels[key].classList.remove('flex');
                }
            });
            if (activeKey === 'explorer' && window.network) {
                window.network.redraw();
            }
        }
        tabButtons.explorer.addEventListener('click', () => switchTab('explorer'));
        tabButtons.ai.addEventListener('click', () => switchTab('ai'));
        tabButtons.config.addEventListener('click', () => switchTab('config'));

        // --- THEME SWITCHER TOGGLE ---
        let isDarkMode = true;
        document.getElementById('btn-toggle-theme').addEventListener('click', () => {
            isDarkMode = !isDarkMode;
            if (isDarkMode) document.documentElement.classList.add('dark');
            else document.documentElement.classList.remove('dark');
        });

        // --- VIS.JS INITIALIZATION ---
        const container = document.getElementById('network-container');
        window.nodesDataSet = new vis.DataSet([]);
        window.edgesDataSet = new vis.DataSet([]);

        const computedStyle = getComputedStyle(document.body);
        const fontColor = computedStyle.getPropertyValue('--vscode-foreground').trim() || '#e5e7eb';

        window.network = new vis.Network(container, {nodes: window.nodesDataSet, edges: window.edgesDataSet}, {
            nodes: {
                shape: 'dot', size: 14,
                font: { color: fontColor, face: 'var(--vscode-font-family)', size: 11 },
                borderWidth: 2, shadow: true
            },
            edges: {
                width: 1.2,
                color: { color: '#9ca3af', highlight: '#60a5fa' },
                arrows: { to: { enabled: true, scaleFactor: 0.4 } },
                smooth: { type: 'continuous' }
            },
            groups: {
                file: { color: { background: '#3b82f6', border: '#2563eb' }, shape: 'hexagon', size: 18 },
                class: { color: { background: '#22c55e', border: '#16a34a' }, shape: 'box', margin: 8 },
                method: { color: { background: '#a855f7', border: '#9333ea' } },
                document: { color: { background: '#eab308', border: '#ca8a04' }, shape: 'note', size: 14 }
            },
            physics: {
                forceAtlas2Based: { gravitationalConstant: -40, centralGravity: 0.01, springLength: 90 },
                solver: 'forceAtlas2Based',
                stabilization: { iterations: 120 }
            }
        });

        if (typeof ResizeObserver !== 'undefined') {
            const ro = new ResizeObserver(() => { if (window.network) { window.network.setSize('100%', '100%'); window.network.redraw(); } });
            ro.observe(container);
            ro.observe(document.getElementById('pane-right'));
        }
        window.network.on("stabilizationIterationsDone", function () { window.network.setOptions({ physics: false }); });

        // --- CONFIGURATION MANAGEMENT ---
        document.getElementById('btn-save-config').addEventListener('click', () => {
            try {
                const list = JSON.parse(document.getElementById('config-textarea').value);
                if (!Array.isArray(list)) throw new Error("Doit être un tableau de chaînes.");
                const filterTypes = document.getElementById('filter-types');
                filterTypes.innerHTML = '';
                list.forEach(type => {
                    const opt = document.createElement('option');
                    opt.value = type; opt.text = type.charAt(0).toUpperCase() + type.slice(1);
                    filterTypes.appendChild(opt);
                });
                window.onFilterChange();
            } catch(e) {
                console.error("Erreur JSON de Configuration: " + e.message);
            }
        });

        // --- BRIDGE SYNC CONFIG FROM HOST ---
        window.addEventListener('message', event => {
            const message = event.data;
            if (message.command === 'setConfig') {
                const config = message.config;
                if (config.regexFilterEnabled !== undefined) document.getElementById('filter-regex').checked = config.regexFilterEnabled;
                if (config.TreeFilterEnabled !== undefined) document.getElementById('filter-on-tree').checked = config.TreeFilterEnabled;
                if (config.geminiApiKey) apiKey = config.geminiApiKey;

                if (config.EntitiesTypesList) {
                    document.getElementById('config-textarea').value = JSON.stringify(config.EntitiesTypesList, null, 4);
                    const filterTypes = document.getElementById('filter-types');
                    filterTypes.innerHTML = '';
                    config.EntitiesTypesList.forEach(type => {
                        const opt = document.createElement('option');
                        opt.value = type; opt.text = type.charAt(0).toUpperCase() + type.slice(1);
                        filterTypes.appendChild(opt);
                    });
                }
                if (window.onFilterChange) window.onFilterChange();
            }
        });

        function buildMaps() {
            window.childrenMap = {}; window.parentMap = {}; window._idLookup = {};
            window.rawNodes.forEach(n => { window._idLookup[String(n.id)] = n.id; });
            window.rawEdges.forEach(e => {
                if (e.type === 'contains' || e.relation === 'contains' || e.type === 'relation') {
                    if (!window.childrenMap[e.from]) window.childrenMap[e.from] = [];
                    window.childrenMap[e.from].push(e.to);
                    window.parentMap[e.to] = e.from;
                }
            });
        }

        function loadGraphifyData(data) {
            window.rawNodes = (data.nodes || []).map(n => {
                let group = 'class';
                const label = n.label || n.id || '';
                if (label.includes('()')) group = 'method';
                else if (label.match(/\.(ts|js|py|json|md|sh|mjs|html|css)$/i)) group = 'file';
                if (n.file_type === 'document' || n.file_type === 'rationale') group = 'document';
                return { id: n.id, label: label, group: group, source_file: n.source_file || '', title: (n.source_file || '') };
            });
            window.rawEdges = (data.links || []).map((l, index) => {
                return { id: index, from: l.source, to: l.target, type: l.relation || 'relation', title: l.relation || '' };
            });
            window.nodesDataSet.clear(); window.edgesDataSet.clear();
            window.nodesDataSet.add(window.rawNodes); window.edgesDataSet.add(window.rawEdges);
            buildMaps();
            window.selectedNodesState = new Set();
            window.onFilterChange();
            window.network.fit({ animation: true });
        }

        // --- POPUP HANDLERS ---
        function updatePopupList() {
            const list = document.getElementById('popup-list');
            const activeTypes = Array.from(document.querySelectorAll('.pop-filter:checked')).map(el => el.value);
            list.innerHTML = '';
            let displayedCount = 0;
            let totalCount = window.selectedNodesState.size;
            window.rawNodes.forEach(n => {
                if (window.selectedNodesState.has(n.id) && activeTypes.includes(n.group)) {
                    list.innerHTML += `<li class="flex items-center gap-3 p-2 bg-[var(--vscode-editor-background)] border border-[var(--vscode-panel-border)] rounded shadow-sm text-xs">
                        <span>${getIcon(n.group)}</span>
                        <span class="font-bold flex-grow truncate">${n.label || n.id}</span>
                        <span class="text-[10px] px-1.5 py-0.5 bg-[var(--vscode-badge-background)] text-[var(--vscode-badge-foreground)] rounded truncate max-w-[220px]">${n.source_file || 'Racine'}</span>
                    </li>`;
                    displayedCount++;
                }
            });
            document.getElementById('modal-counter').innerText = `${displayedCount} élément(s) affiché(s) sur ${totalCount}`;
            if(displayedCount === 0) list.innerHTML = `<li class="p-4 text-center italic border border-dashed border-[var(--vscode-panel-border)] rounded opacity-70 text-xs">Aucun élément ne correspond aux filtres.</li>`;
        }
        document.querySelectorAll('.pop-filter').forEach(el => el.addEventListener('change', updatePopupList));

        const popup = document.getElementById('popup-selected');
        const closePopup = () => { if (popup) popup.style.display = 'none'; };
        document.getElementById('close-popup-icon').addEventListener('click', closePopup);
        document.getElementById('close-popup-btn').addEventListener('click', closePopup);
        document.getElementById('btn-show-popup').addEventListener('click', () => {
            updatePopupList();
            popup.style.display = 'flex';
        });

        // --- TREE CONTROL INTERFACE ---
        document.getElementById('btn-sort-asc').addEventListener('click', () => { window.currentSort = 'asc'; renderTreeView(); });
        document.getElementById('btn-sort-desc').addEventListener('click', () => { window.currentSort = 'desc'; renderTreeView(); });
        document.getElementById('btn-clear-selection').addEventListener('click', () => { applySelectionState(new Set()); });
        document.getElementById('btn-toggle-case').addEventListener('click', (e) => {
            window.ignoreCaseState = !window.ignoreCaseState;
            e.currentTarget.style.background = window.ignoreCaseState ? 'var(--vscode-button-background)' : '';
            e.currentTarget.style.color = window.ignoreCaseState ? 'var(--vscode-button-foreground)' : '';
            window.onFilterChange();
        });
        document.getElementById('btn-tree-filter').addEventListener('click', (e) => {
            window.treeShowSelected = !window.treeShowSelected;
            e.currentTarget.style.background = window.treeShowSelected ? 'var(--vscode-button-background)' : '';
            e.currentTarget.style.color = window.treeShowSelected ? 'var(--vscode-button-foreground)' : '';
            renderTreeView();
        });

        function sortNodesArray(nodesArray) {
            return nodesArray.sort((a, b) => {
                let valA = (a.label || '').toLowerCase(); let valB = (b.label || '').toLowerCase();
                let res = valA < valB ? -1 : (valA > valB ? 1 : 0);
                return window.currentSort === 'asc' ? res : -res;
            });
        }

        function getIcon(group) { switch(group) { case 'file': return '📂'; case 'class': return '📦'; case 'method': return '⚡'; case 'document': return '📄'; default: return '🔹'; } }

        function matchNode(node) {
            const typeSelect = document.getElementById('filter-types');
            const selectedTypes = Array.from(typeSelect.selectedOptions).map(o => o.value);
            if (selectedTypes.length > 0 && !selectedTypes.includes(node.group)) return false;

            let text = document.getElementById('filter-text').value;
            if (!text) return true;

            const mode = document.getElementById('filter-mode').value;
            const useRegex = document.getElementById('filter-regex').checked;

            let nodeLabel = (node.label || '');
            if (window.ignoreCaseState) {
                nodeLabel = nodeLabel.toLowerCase();
                if (!useRegex) text = text.toLowerCase();
            }

            if (useRegex) { try { return new RegExp(text, window.ignoreCaseState ? 'i' : '').test(node.label || ''); } catch(e) { return true; } }
            else {
                if (mode === 'contains') return nodeLabel.includes(text);
                if (mode === 'exact') return nodeLabel === text;
                if (mode === 'starts_with') return nodeLabel.startsWith(text);
            }
            return true;
        }

        function renderTreeView() {
            const applyToTree = document.getElementById('filter-on-tree').checked;
            const grouping = document.getElementById('tree-grouping').value;

            let strictlyVisible = new Set();
            window.rawNodes.forEach(n => {
                let match = applyToTree ? matchNode(n) : true;
                if (window.treeShowSelected) match = match && window.selectedNodesState.has(n.id);
                if (match) strictlyVisible.add(n.id);
            });

            let hierarchicallyVisible = new Set(strictlyVisible);
            let added = true;
            while(added) {
                added = false;
                for (let id of hierarchicallyVisible) {
                    let pid = window.parentMap[id];
                    if (pid && !hierarchicallyVisible.has(pid)) { hierarchicallyVisible.add(pid); added = true; }
                }
            }

            const visibleNodes = window.rawNodes.filter(n => hierarchicallyVisible.has(n.id));
            const treeRoot = { isGroup: true, children: {}, nodes: [] };

            visibleNodes.forEach(n => {
                if (!window.parentMap[n.id] || !hierarchicallyVisible.has(window.parentMap[n.id])) {
                    let currentLevel = treeRoot;
                    if ((n.group === 'file' || n.group === 'document') && grouping === 'folder' && n.source_file) {
                        const folders = n.source_file.split('/').slice(0, -1);
                        folders.forEach(f => {
                            if (!currentLevel.children[f]) currentLevel.children[f] = { isGroup: true, name: f, children: {}, nodes: [] };
                            currentLevel = currentLevel.children[f];
                        });
                    } else if ((n.group === 'file' || n.group === 'document') && grouping === 'extension') {
                        const ext = n.label.includes('.') ? '.' + n.label.split('.').pop() : 'Sans extension';
                        if (!currentLevel.children[ext]) currentLevel.children[ext] = { isGroup: true, name: ext, children: {}, nodes: [] };
                        currentLevel = currentLevel.children[ext];
                    }
                    currentLevel.nodes.push(n);
                }
            });

            function renderNodeRecursive(n) {
                let childIdsToRender = (window.childrenMap[n.id] || []).filter(cid => hierarchicallyVisible.has(cid));
                let myIds = [n.id]; let childrenHtml = '';
                if (childIdsToRender.length > 0) {
                    let visibleChildren = sortNodesArray(childIdsToRender.map(id => window.rawNodes.find(rn => rn.id === id)));
                    childrenHtml += `<div class="ml-4 pl-2 border-l border-[var(--vscode-panel-border)]">`;
                    visibleChildren.forEach(cn => { let res = renderNodeRecursive(cn); myIds = myIds.concat(res.ids); childrenHtml += res.html; });
                    childrenHtml += `</div>`;
                }
                let html = `
                <div class="flex items-center gap-2 py-0.5 rounded hover:bg-[var(--vscode-list-hoverBackground)]">
                    <input type="checkbox" data-ids="${myIds.join(',')}" class="tree-chk custom-cb">
                    <label class="flex-1 text-xs truncate cursor-pointer select-none" title="${n.title || n.label || n.id}" onclick="window.focusNode('${n.id}', event)">
                        ${getIcon(n.group)} ${n.label || n.id}
                    </label>
                </div>${childrenHtml}`;
                return { html, ids: myIds };
            }

            function renderGroupsRecursive(nodeGroup, groupName = '') {
                let myIds = []; let html = '';
                Object.keys(nodeGroup.children).sort().forEach(k => {
                    let childGroup = renderGroupsRecursive(nodeGroup.children[k], k);
                    myIds = myIds.concat(childGroup.ids);
                    html += `
                    <details class="ml-3" open>
                        <summary class="flex items-center gap-2 py-1 font-bold text-xs cursor-pointer select-none text-[var(--vscode-foreground)] hover:text-blue-500">
                            <input type="checkbox" data-ids="${childGroup.ids.join(',')}" class="tree-chk custom-cb" onclick="event.stopPropagation();">
                            🗂️ ${k}
                        </summary>
                        <div>${childGroup.html}</div>
                    </details>`;
                });
                sortNodesArray(nodeGroup.nodes).forEach(n => {
                    let res = renderNodeRecursive(n); myIds = myIds.concat(res.ids); html += res.html;
                });
                return { html, ids: myIds };
            }

            const res = renderGroupsRecursive(treeRoot);
            document.getElementById('tree-container').innerHTML = res.html || `<div class="p-4 opacity-60 text-center italic text-xs">Aucun résultat.</div>`;

            document.querySelectorAll('.tree-chk').forEach(chk => {
                chk.addEventListener('change', (e) => window.triggerCheckbox(e.target));
            });
            syncTreeCheckboxes();
        }

        window.focusNode = function(nodeId, event) {
            if (event && event.preventDefault) event.preventDefault();
            if (!window.nodesDataSet.get(nodeId)) return;
            window.network.focus(nodeId, { scale: 1.1, animation: { duration: 400 } });
            window.network.selectNodes([nodeId]);
            const isMultiSelect = event && (event.ctrlKey || event.metaKey);
            const relationsNodes = calculateRelatedNodes(nodeId);

            if (isMultiSelect) {
                let newState = new Set(window.selectedNodesState);
                if (newState.has(nodeId)) relationsNodes.forEach(id => newState.delete(id));
                else relationsNodes.forEach(id => newState.add(id));
                applySelectionState(newState);
            } else {
                applySelectionState(relationsNodes);
            }
        };

        window.triggerCheckbox = function(checkboxEl) {
            const idsStr = checkboxEl.getAttribute('data-ids');
            if(!idsStr) return;
            const ids = idsStr.split(',');
            const isChecked = checkboxEl.checked;
            let newState = new Set(window.selectedNodesState);
            ids.forEach(strId => {
                const actualId = window._idLookup[strId] !== undefined ? window._idLookup[strId] : strId;
                if (isChecked) newState.add(actualId); else newState.delete(actualId);
            });
            applySelectionState(newState);
        };

        function syncTreeCheckboxes() {
            document.querySelectorAll('.tree-chk').forEach(chk => {
                const ids = (chk.getAttribute('data-ids') || '').split(',');
                let selectedCount = 0;
                ids.forEach(strId => {
                    const actualId = window._idLookup[strId] !== undefined ? window._idLookup[strId] : strId;
                    if (window.selectedNodesState.has(actualId)) selectedCount++;
                });
                if (selectedCount === 0) { chk.checked = false; chk.indeterminate = false; }
                else if (selectedCount === ids.length) { chk.checked = true; chk.indeterminate = false; }
                else { chk.checked = false; chk.indeterminate = true; }
            });
        }

        function calculateRelatedNodes(startNodeId) {
            const pDepth = parseInt(document.getElementById('depth-parent').value) || 0;
            const cDepth = parseInt(document.getElementById('depth-child').value) || 0;
            let nodesToSelect = new Set([startNodeId]);

            let currentChildren = [startNodeId];
            for (let i = 0; i < cDepth; i++) {
                let nextChildren = [];
                currentChildren.forEach(node => {
                    window.rawEdges.forEach(edge => { if (edge.from === node) { nodesToSelect.add(edge.to); nextChildren.push(edge.to); } });
                });
                currentChildren = nextChildren;
            }

            let currentParents = [startNodeId];
            for (let i = 0; i < pDepth; i++) {
                let nextParents = [];
                currentParents.forEach(node => {
                    window.rawEdges.forEach(edge => { if (edge.to === node) { nodesToSelect.add(edge.from); nextParents.push(edge.from); } });
                });
                currentParents = nextParents;
            }
            return nodesToSelect;
        }

        window.network.on("click", function (params) {
            const isMultiSelect = params.event.srcEvent.ctrlKey || params.event.srcEvent.metaKey;
            if (params.nodes.length > 0) {
                const clickedNodeId = params.nodes[0];
                const relationsNodes = calculateRelatedNodes(clickedNodeId);
                if (isMultiSelect) {
                    let newState = new Set(window.selectedNodesState);
                    if (newState.has(clickedNodeId)) relationsNodes.forEach(id => newState.delete(id));
                    else relationsNodes.forEach(id => newState.add(id));
                    applySelectionState(newState);
                } else {
                    applySelectionState(relationsNodes);
                }
            } else {
                if (!isMultiSelect) applySelectionState(new Set());
            }
        });

        function applySelectionState(nodesSet) {
            window.selectedNodesState = nodesSet;
            renderTreeView();

            const applyToGraph = document.getElementById('filter-on-graph').checked;

            if (window.selectedNodesState.size === 0) {
                window.nodesDataSet.update(window.rawNodes.map(n => ({ id: n.id, hidden: applyToGraph ? !matchNode(n) : false, opacity: 1, shadow: true })));
                window.edgesDataSet.update(window.rawEdges.map(e => ({ id: e.id, color: { color: '#9ca3af' }, width: 1.2 })));
                return;
            }

            window.nodesDataSet.update(window.rawNodes.map(n => {
                const isSelected = window.selectedNodesState.has(n.id);
                return { id: n.id, hidden: applyToGraph ? !matchNode(n) : false, opacity: isSelected ? 1 : 0.15, shadow: isSelected };
            }));

            window.edgesDataSet.update(window.rawEdges.map((e, index) => {
                const isHighlighted = window.selectedNodesState.has(e.from) && window.selectedNodesState.has(e.to);
                return { id: e.id || index, color: isHighlighted ? { color: '#3b82f6', opacity: 1 } : { color: '#4b5563', opacity: 0.15 }, width: isHighlighted ? 2.2 : 1 };
            }));
        }

        window.onFilterChange = function() {
            if (document.getElementById('filter-on-tree').checked || window.treeShowSelected) renderTreeView();
            if (document.getElementById('filter-on-graph').checked) applySelectionState(window.selectedNodesState);
        };

        ['filter-types', 'filter-mode', 'filter-text', 'filter-regex', 'filter-on-tree', 'filter-on-graph', 'tree-grouping'].forEach(id => {
            const el = document.getElementById(id);
            if (el) { el.addEventListener('change', window.onFilterChange); if(id === 'filter-text') el.addEventListener('keyup', window.onFilterChange); }
        });

        document.getElementById('filter-clear').addEventListener('click', () => { document.getElementById('filter-text').value = ''; window.onFilterChange(); });
        document.getElementById('reset-selection').addEventListener('click', () => { window.network.fit({ animation: true }); });

        // --- FILE GRAPH INGESTION TRIGGER ---
        document.getElementById('btn-load-graph').addEventListener('click', () => document.getElementById('file-upload').click());
        document.getElementById('file-upload').addEventListener('change', (e) => {
            const file = e.target.files[0];
            if (!file) return;
            const reader = new FileReader();
            reader.onload = (event) => {
                try { loadGraphifyData(JSON.parse(event.target.result)); } catch (error) { console.error("Fichier JSON invalide."); }
            };
            reader.readAsText(file);
        });

        // --- GEMINI ARTIFICIAL INTELLIGENCE ACTION ---
        function formatMarkdown(text) {
            if (!text) return "";
            let formatted = text.replace(/</g, "&lt;").replace(/>/g, "&gt;");
            formatted = formatted.replace(/```([\s\S]*?)```/g, '<pre class="bg-[var(--vscode-editor-background)] mt-2 mb-2 p-2.5 border border-[var(--vscode-panel-border)] rounded overflow-x-auto text-blue-400 text-[11px]"><code>$1</code></pre>');
            formatted = formatted.replace(/`([^`]+)`/g, '<code class="bg-[var(--vscode-editorWidget-background)] px-1 py-0.5 rounded text-blue-400 text-[11px]">$1</code>');
            formatted = formatted.replace(/\*\*(.*?)\*\*/g, '<strong class="text-[var(--vscode-foreground)]">$1</strong>');
            return formatted.replace(/\n/g, '<br/>');
        }

        document.getElementById('btn-analyze').addEventListener('click', async () => {
            const aiResponseContainer = document.getElementById('ai-response-container');
            if (window.selectedNodesState.size === 0) {
                aiResponseContainer.innerHTML = `<div class="p-2 text-yellow-500 text-xs">Veuillez d'abord sélectionner des nœuds dans le graphe ou l'arbre.</div>`;
                return;
            }
            if (!apiKey) {
                aiResponseContainer.innerHTML = `<div class="p-2 text-red-500 text-xs">Clé API Gemini manquante dans la configuration de l'extension.</div>`;
                return;
            }

            const selectedNodes = window.rawNodes.filter(n => window.selectedNodesState.has(n.id));
            const selectedEdges = window.rawEdges.filter(e => window.selectedNodesState.has(e.from) && window.selectedNodesState.has(e.to));

            let promptText = "Voici une partie de l'architecture de mon code. Peux-tu analyser ce que fait ce sous-système, identifier d'éventuels problèmes de conception et suggérer des améliorations ?\\n\\nEntités :\\n";
            selectedNodes.forEach(n => promptText += `- ${n.label} (Type: ${n.group})\\n`);
            promptText += "\\nRelations :\\n";
            if (selectedEdges.length === 0) promptText += "Aucune relation.\\n";
            else selectedEdges.forEach(e => promptText += `- ${window.rawNodes.find(n=>n.id===e.from)?.label || e.from} ${e.type} ${window.rawNodes.find(n=>n.id===e.to)?.label || e.to}\\n`);

            aiResponseContainer.innerHTML = `<div class="text-blue-400 animate-pulse text-xs">Analyse en cours... Veuillez patienter.</div>`;

            try {
                const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-09-2025:generateContent?key=${apiKey}`;
                const response = await fetch(url, {
                    method: 'POST', headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        contents: [{ parts: [{ text: promptText }] }],
                        systemInstruction: { parts: [{ text: "Tu es un ingénieur logiciel expert. Analyse l'architecture fournie. Sois concis, clair et structure ta réponse avec des listes. Réponds en français." }] }
                    })
                });
                const result = await response.json();
                const textResponse = result.candidates?.[0]?.content?.parts?.[0]?.text;
                if (textResponse) aiResponseContainer.innerHTML = `<div class="p-1 text-xs leading-relaxed text-[var(--vscode-foreground)]">${formatMarkdown(textResponse)}</div>`;
                else throw new Error("Réponse vide de l'API.");
            } catch (error) {
                aiResponseContainer.innerHTML = `<div class="p-2 text-red-500 text-xs">Erreur de communication : ${error.message}</div>`;
            }
        });

        window.addEventListener('DOMContentLoaded', () => { vscode.postMessage({ command: 'ready' }); });
    </script>
</body>
</html>`;

fs.writeFileSync(htmlPath, updatedContent, 'utf8');
console.log('✅ Updated media/webview.html with Graphify Explorer compliant UI architecture layout guidelines.');
EOF

node patch_webview.js
rm patch_webview.js

echo "✅ Script executed. UI Architecture completely aligned with Graphify Explorer specifications, including responsive layout, native horizontal resizing, three tabs system, and dark mode toggle!"
