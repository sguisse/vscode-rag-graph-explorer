<!DOCTYPE html>
<html lang="fr" class="h-full">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Archi-Polyglot - Cytoscape.js & UML</title>

  <!-- Tailwind CSS -->
  <script src="https://cdn.tailwindcss.com"></script>

  <!-- React & ReactDOM CDN -->
  <script src="https://unpkg.com/react@18/umd/react.production.min.js" crossorigin></script>
  <script src="https://unpkg.com/react-dom@18/umd/react-dom.production.min.js" crossorigin></script>

  <!-- Babel CDN pour compiler le JSX à la volée -->
  <script src="https://unpkg.com/@babel/standalone/babel.min.js"></script>

  <!-- Cytoscape.js CDN -->
  <script src="https://cdnjs.cloudflare.com/ajax/libs/cytoscape/3.26.0/cytoscape.min.js"></script>

  <!-- Google Fonts: Inter & JetBrains Mono -->
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;900&family=JetBrains+Mono:wght@400;500;700&display=swap" rel="stylesheet">

  <style>
    body {
      font-family: 'Inter', sans-serif;
    }
    .font-mono {
      font-family: 'JetBrains Mono', monospace;
    }
    /* Empêcher la sélection de texte pendant le drag-and-drop */
    .dragging-active {
      user-select: none;
    }
    /* Cache l'élément de rendu par défaut de Cytoscape pour les nœuds enfants car nous superposons nos superbes cartes React */
    .cy-node-hidden {
      opacity: 0;
    }
    /* Scrollbars personnalisées */
    ::-webkit-scrollbar {
      width: 6px;
      height: 6px;
    }
    ::-webkit-scrollbar-track {
      background: transparent;
    }
    .dark ::-webkit-scrollbar-thumb {
      background: #334155;
      border-radius: 4px;
    }
    ::-webkit-scrollbar-thumb {
      background: #cbd5e1;
      border-radius: 4px;
    }
  </style>
</head>
<body class="h-full overflow-hidden">

  <div id="root" class="h-full"></div>

  <script type="text/babel">
    const { useState, useMemo, useEffect, useRef } = React;

    // Configuration de Tailwind pour étendre le thème indigo et dark mode
    tailwind.config = {
      darkMode: 'class',
      theme: {
        extend: {
          colors: {
            indigo: {
              550: '#536dfe',
              650: '#3f51b5'
            }
          }
        }
      }
    };

    // ==========================================
    // 0. ICONS COMPONENT (SVG INTEGRES POUR EVITER LES ERREURS)
    // ==========================================

    const Layers = ({ size = 20, className = "" }) => (
      <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
        <polygon points="12 2 2 7 12 12 22 7 12 2" />
        <polyline points="2 17 12 22 22 17" />
        <polyline points="2 12 12 17 22 12" />
      </svg>
    );

    const Sun = ({ size = 20, className = "" }) => (
      <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
        <circle cx="12" cy="12" r="4" />
        <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41" />
      </svg>
    );

    const Moon = ({ size = 20, className = "" }) => (
      <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
        <path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z" />
      </svg>
    );

    const Search = ({ size = 16, className = "" }) => (
      <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
        <circle cx="11" cy="11" r="8" />
        <path d="m21 21-4.3-4.3" />
      </svg>
    );

    const Folder = ({ size = 16, className = "" }) => (
      <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
        <path d="M20 20a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-7.9a2 2 0 0 1-1.69-.9L9.6 3.9A2 2 0 0 0 7.93 3H4a2 2 0 0 0-2 2v13a2 2 0 0 0 2 2Z" />
      </svg>
    );

    const Settings = ({ size = 16, className = "" }) => (
      <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
        <path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.1a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z" />
        <circle cx="12" cy="12" r="3" />
      </svg>
    );

    const FileCode = ({ size = 16, className = "" }) => (
      <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
        <path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z" />
        <path d="M14 2v4a2 2 0 0 0 2 2h4" />
        <path d="m10 13-2 2 2 2" />
        <path d="m14 17 2-2-2-2" />
      </svg>
    );

    const Database = ({ size = 16, className = "" }) => (
      <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
        <ellipse cx="12" cy="5" rx="9" ry="3" />
        <path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5" />
        <path d="M3 12c0 1.66 4 3 9 3s9-1.34 9-3" />
      </svg>
    );

    const ShieldAlert = ({ size = 16, className = "" }) => (
      <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
        <path d="M20 13c0 5-3.5 7.5-7.66 9.7a1 1 0 0 1-.68 0C7.5 20.5 4 18 4 13V6a1 1 0 0 1 .76-.97l8-2a1 1 0 0 1 .48 0l8 2A1 1 0 0 1 20 6Z" />
        <path d="M12 8v4" />
        <path d="M12 16h.01" />
      </svg>
    );

    const Terminal = ({ size = 16, className = "" }) => (
      <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
        <polyline points="4 17 10 11 4 5" />
        <line x1="12" y1="19" x2="20" y2="19" />
      </svg>
    );

    const Code = ({ size = 16, className = "" }) => (
      <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
        <polyline points="16 18 22 12 16 6" />
        <polyline points="8 6 2 12 8 18" />
      </svg>
    );

    const GitFork = ({ size = 16, className = "" }) => (
      <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
        <circle cx="12" cy="18" r="3" />
        <circle cx="6" cy="6" r="3" />
        <circle cx="18" cy="6" r="3" />
        <path d="M18 9v2c0 .6-.4 1-1 1H7c-.6 0-1-.4-1-1V9" />
        <path d="M12 12v3" />
      </svg>
    );

    const ChevronDown = ({ size = 16, className = "" }) => (
      <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
        <path d="m6 9 6 6 6-6" />
      </svg>
    );

    const ChevronRight = ({ size = 16, className = "" }) => (
      <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
        <path d="m9 18 6-6-6-6" />
      </svg>
    );

    const Copy = ({ size = 16, className = "" }) => (
      <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
        <rect width="14" height="14" x="8" y="8" rx="2" ry="2" />
        <path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2" />
      </svg>
    );

    const Check = ({ size = 16, className = "" }) => (
      <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
        <path d="M20 6 9 17l-5-5" />
      </svg>
    );

    const Info = ({ size = 16, className = "" }) => (
      <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
        <circle cx="12" cy="12" r="10" />
        <path d="M12 16v-4" />
        <path d="M12 8h.01" />
      </svg>
    );

    const GitCompare = ({ size = 16, className = "" }) => (
      <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
        <circle cx="18" cy="18" r="3" />
        <circle cx="6" cy="6" r="3" />
        <path d="M13 6h3a2 2 0 0 1 2 2v7" />
        <path d="M11 18H8a2 2 0 0 1-2-2V9" />
      </svg>
    );

    const Plus = ({ size = 16, className = "" }) => (
      <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
        <path d="M5 12h14M12 5v14" />
      </svg>
    );

    const Minus = ({ size = 16, className = "" }) => (
      <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
        <line x1="5" y1="12" x2="19" y2="12" />
      </svg>
    );

    const Maximize = ({ size = 16, className = "" }) => (
      <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
        <path d="M15 3h6v6M9 21H3v-6M21 3l-7 7M3 21l7-7" />
      </svg>
    );

    const RefreshCw = ({ size = 16, className = "" }) => (
      <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
        <path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8" />
        <path d="M16 3h5v5M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16" />
        <path d="M8 21H3v-5" />
      </svg>
    );

    // ==========================================
    // 1. JEU DE DONNÉES INITIAL POLYGLOTTE (DONNÉES & SCHÉMA)
    // ==========================================

    const JSON_SCHEMA_SPEC = {
      "$schema": "https://json-schema.org/draft/2020-12/schema",
      "title": "PolyglotDependencyUmlSchema",
      "description": "Structure de données validant un écosystème polyglotte multi-technologies",
      "type": "object",
      "required": ["files", "dependencies"],
      "properties": {
        "files": {
          "type": "array",
          "items": {
            "type": "object",
            "required": ["id", "name", "type", "path", "language"],
            "properties": {
              "id": { "type": "string" },
              "name": { "type": "string" },
              "type": { "type": "string", "enum": ["class", "interface", "component", "module", "config"] },
              "path": { "type": "string" },
              "language": { "type": "string" },
              "size": { "type": "number" },
              "complexity": { "type": "number" },
              "attributes": {
                "type": "array",
                "items": {
                  "type": "object",
                  "required": ["name", "visibility"]
                }
              },
              "methods": {
                "type": "array",
                "items": {
                  "type": "object",
                  "required": ["id", "name"]
                }
              }
            }
          }
        }
      }
    };

    const initialCodebase = {
      files: [
        {
          id: 'OrderButton.tsx',
          name: 'OrderButton.tsx',
          type: 'component',
          path: 'frontend/components/OrderButton.tsx',
          language: 'TypeScript (React)',
          size: 145,
          complexity: 4,
          attributes: [
            { name: 'disabled: boolean', visibility: 'private' },
            { name: 'cartTotal: number', visibility: 'public' }
          ],
          methods: [
            { id: 'onClick', name: 'onClick()', description: "Intercepte le clic et invoque le client d'API" },
            { id: 'render', name: 'render()', description: "Affiche le bouton stylé avec les états de chargement" }
          ]
        },
        {
          id: 'orderApi.ts',
          name: 'orderApi.ts',
          type: 'module',
          path: 'frontend/services/orderApi.ts',
          language: 'TypeScript',
          size: 90,
          complexity: 2,
          attributes: [
            { name: 'BASE_URL: string', visibility: 'private' }
          ],
          methods: [
            { id: 'placeOrder', name: 'placeOrder(items)', description: "Effectue l'appel Fetch HTTP POST vers le contrôleur Java" }
          ]
        },
        {
          id: 'OrderController.java',
          name: 'OrderController.java',
          type: 'class',
          path: 'backend/controllers/OrderController.java',
          language: 'Java',
          size: 210,
          complexity: 5,
          attributes: [
            { name: 'orderRepo: OrderRepository', visibility: 'private' }
          ],
          methods: [
            { id: 'createOrder', name: 'createOrder(dto)', description: "Reçoit le JSON, convertit, manipule Order et sauvegarde" }
          ]
        },
        {
          id: 'Order.java',
          name: 'Order.java',
          type: 'class',
          path: 'backend/models/Order.java',
          language: 'Java',
          size: 320,
          complexity: 9,
          attributes: [
            { name: 'id: UUID', visibility: 'private' },
            { name: 'items: List<Item>', visibility: 'private' },
            { name: 'totalPrice: BigDecimal', visibility: 'private' }
          ],
          methods: [
            { id: 'addItem', name: 'addItem(item)', description: "Ajoute l'article et recalcule le montant total" },
            { id: 'calculateTotal', name: 'calculateTotal()', description: "Parcourt les items pour sommer les coûts" }
          ]
        },
        {
          id: 'OrderRepository.java',
          name: 'OrderRepository.java',
          type: 'interface',
          path: 'backend/repositories/OrderRepository.java',
          language: 'Java',
          size: 55,
          complexity: 1,
          attributes: [],
          methods: [
            { id: 'save', name: 'save(order)', description: "Interface d'accès aux données pour l'agrégat Order" }
          ]
        },
        {
          id: 'JpaOrderRepository.java',
          name: 'JpaOrderRepository.java',
          type: 'class',
          path: 'backend/repositories/JpaOrderRepository.java',
          language: 'Java',
          size: 130,
          complexity: 3,
          attributes: [
            { name: 'entityManager: EntityManager', visibility: 'private' }
          ],
          methods: [
            { id: 'save', name: 'save(order)', description: "Persistance physique sous Hibernate avec requêtes natives" }
          ]
        },
        {
          id: 'application.yml',
          name: 'application.yml',
          type: 'config',
          path: 'config/application.yml',
          language: 'YAML',
          size: 40,
          complexity: 1,
          configProperties: [
            { key: 'spring.datasource.url', value: 'jdbc:postgresql://localhost:5432/orders_db' },
            { key: 'spring.datasource.username', value: 'db_admin_prod' },
            { key: 'spring.jpa.show-sql', value: 'true' }
          ]
        }
      ],
      dependencies: [
        {
          id: 'e-button-api',
          sourceNode: 'OrderButton.tsx',
          sourceHandle: 'onClick',
          targetNode: 'orderApi.ts',
          targetHandle: 'placeOrder',
          relation: 'dependency',
          label: 'Imports & Calls'
        },
        {
          id: 'e-api-controller',
          sourceNode: 'orderApi.ts',
          sourceHandle: 'placeOrder',
          targetNode: 'OrderController.java',
          targetHandle: 'createOrder',
          relation: 'association',
          label: 'HTTP POST'
        },
        {
          id: 'e-controller-domain',
          sourceNode: 'OrderController.java',
          sourceHandle: 'createOrder',
          targetNode: 'Order.java',
          targetHandle: 'addItem',
          relation: 'aggregation',
          label: 'Invoque'
        },
        {
          id: 'e-controller-repo',
          sourceNode: 'OrderController.java',
          sourceHandle: 'createOrder',
          targetNode: 'OrderRepository.java',
          targetHandle: 'save',
          relation: 'association',
          label: 'Utilise'
        },
        {
          id: 'e-repo-impl',
          sourceNode: 'JpaOrderRepository.java',
          sourceHandle: 'header',
          targetNode: 'OrderRepository.java',
          targetHandle: 'header',
          relation: 'implementation',
          label: 'implémente'
        },
        {
          id: 'e-jpa-repo-config',
          sourceNode: 'JpaOrderRepository.java',
          sourceHandle: 'save',
          targetNode: 'application.yml',
          targetHandle: 'spring.datasource.url',
          relation: 'dependency',
          label: 'Lit DB Config'
        }
      ]
    };

    // Configuration des positions initiales dans le repère de Cytoscape
    const initialFolderPositions = {
      'frontend': { x: 50, y: 50, w: 350, h: 630, label: '📂 Client Frontend (TSX/TS)' },
      'backend': { x: 440, y: 30, w: 730, h: 670, label: '📂 API Backend (Spring Boot / Java)' },
      'config': { x: 1210, y: 150, w: 370, h: 420, label: '⚙️ Configurations d\'Écosystème' }
    };

    const initialFileCoordinates = {
      'OrderButton.tsx': { x: 220, y: 180 },
      'orderApi.ts': { x: 220, y: 460 },
      'OrderController.java': { x: 610, y: 160 },
      'Order.java': { x: 970, y: 160 },
      'OrderRepository.java': { x: 610, y: 440 },
      'JpaOrderRepository.java': { x: 970, y: 440 },
      'application.yml': { x: 1390, y: 320 }
    };

    // ==========================================
    // 2. MAIN APPLICATION (INTEGRATION CYTOSCAPE.JS)
    // ==========================================

    function App() {
      const [darkMode, setDarkMode] = useState(true);
      const [searchTerm, setSearchTerm] = useState('');
      const [copiedNotification, setCopiedNotification] = useState(null);
      const [rightPanelTab, setRightPanelTab] = useState('inspect');
      const [impactDirection, setImpactDirection] = useState('aval');
      const [impactedSet, setImpactedSet] = useState(new Set());

      // Visibilité des répertoires et fichiers
      const [expandedFolders, setExpandedFolders] = useState({
        'frontend': true,
        'backend': true,
        'config': true
      });
      const [visibleFiles, setVisibleFiles] = useState({
        'OrderButton.tsx': true,
        'orderApi.ts': true,
        'OrderController.java': true,
        'Order.java': true,
        'OrderRepository.java': true,
        'JpaOrderRepository.java': true,
        'application.yml': true
      });

      // Synchronisation de l'état des coordonnées depuis Cytoscape
      const [nodePositions, setNodePositions] = useState(initialFileCoordinates);
      const [compoundBounds, setCompoundBounds] = useState({});
      const [pan, setPan] = useState({ x: 0, y: 0 });
      const [zoom, setZoom] = useState(1);
      const [dimensionsTrigger, setDimensionsTrigger] = useState(0);

      // Entité active sélectionnée
      const [selectedEntity, setSelectedEntity] = useState({ type: 'node', nodeId: 'OrderController.java' });

      // Références aux éléments DOM et instances
      const cyRef = useRef(null);
      const canvasContainerRef = useRef(null);

      // Forcer le rafraîchissement des liaisons bezier
      const triggerConnectionUpdate = () => {
        setDimensionsTrigger(prev => prev + 1);
      };

      // Configuration et initialisation de Cytoscape.js
      useEffect(() => {
        // Initialiser l'instance Cytoscape
        const cy = cytoscape({
          container: document.getElementById('cy-headless-container'),
          boxSelectionEnabled: false,
          autounselectify: true,
          userZoomingEnabled: true, // Activation robuste du zoom utilisateur
          userPanningEnabled: true,  // Activation robuste du déplacement de canevas
          style: [
            {
              selector: 'node',
              style: {
                'width': 288,  // Dimension exacte de nos cartes (w-72 de Tailwind)
                'height': 240, // Hauteur approximative d'une classe UML
                'opacity': 0,  // On rend les nœuds enfants invisibles car nous superposons les cartes React
              }
            },
            {
              selector: ':parent', // Sélecteur Cytoscape pour les nœuds parents (compound nodes)
              style: {
                'background-color': darkMode ? '#0f172a' : '#f8fafc',
                'background-opacity': 0.15,
                'border-color': darkMode ? '#334155' : '#cbd5e1',
                'border-width': 2,
                'border-style': 'dashed',
                'padding': 40
              }
            }
          ]
        });

        cyRef.current = cy;

        // Événement de mise à jour des positions
        const handleCyUpdate = () => {
          setPan(cy.pan());
          setZoom(cy.zoom());

          // Mettre à jour les positions des fichiers enfants
          const positions = {};
          cy.nodes().filter(n => !n.isParent()).forEach(n => {
            positions[n.id()] = n.position();
          });
          setNodePositions(positions);

          // Mettre à jour les enveloppes englobantes des dossiers parents calculées par Cytoscape
          const bounds = {};
          cy.nodes().filter(n => n.isParent()).forEach(p => {
            bounds[p.id()] = {
              boundingBox: p.boundingBox({ includeLabels: false }),
              label: p.id() === 'frontend' ? '📂 Client Frontend (TSX/TS)' : p.id() === 'backend' ? '📂 API Backend (Java)' : '⚙️ Configurations'
            };
          });
          setCompoundBounds(bounds);
          triggerConnectionUpdate();
        };

        cy.on('render position pan zoom resize', handleCyUpdate);

        // Nettoyage de l'instance
        return () => {
          cy.destroy();
        };
      }, [darkMode]);

      // Chargement / Synchronisation des nœuds dans Cytoscape selon les filtres de visibilité
      useEffect(() => {
        const cy = cyRef.current;
        if (!cy) return;

        // Supprimer tous les éléments existants
        cy.elements().remove();

        // Ajouter les nœuds parents (Dossiers) visibles
        const folders = ['frontend', 'backend', 'config'];
        folders.forEach(f => {
          const hasVisibleChildren = initialCodebase.files.some(file => file.path.startsWith(f) && visibleFiles[file.id]);
          if (hasVisibleChildren) {
            cy.add({
              group: 'nodes',
              data: { id: f, label: f }
            });
          }
        });

        // Ajouter les nœuds enfants visibles (Classes UML / Configs)
        initialCodebase.files.forEach(file => {
          if (visibleFiles[file.id]) {
            const folderKey = file.path.split('/')[0];
            cy.add({
              group: 'nodes',
              data: {
                id: file.id,
                parent: cy.getElementById(folderKey).length > 0 ? folderKey : undefined
              },
              position: nodePositions[file.id] || initialFileCoordinates[file.id] || { x: 100, y: 100 }
            });
          }
        });

        // Ajuster la caméra pour englober la scène
        cy.fit(null, 50);
        triggerConnectionUpdate();
      }, [visibleFiles]);

      // Changement du thème Light / Dark
      useEffect(() => {
        const rootHtml = document.documentElement;
        if (darkMode) {
          rootHtml.classList.add('dark');
        } else {
          rootHtml.classList.remove('dark');
        }
        triggerConnectionUpdate();
      }, [darkMode]);

      // Notification d'information
      const triggerNotification = (msg) => {
        setCopiedNotification(msg);
        setTimeout(() => setCopiedNotification(null), 2500);
      };

      // ==========================================
      // CONTROLES DE ZOOM ET DEPLACEMENT PROGRAMMATIQUE
      // ==========================================
      const handleZoomIn = () => {
        const cy = cyRef.current;
        if (cy) {
          cy.zoom({
            level: cy.zoom() * 1.25,
            renderedPosition: { x: cy.width() / 2, y: cy.height() / 2 }
          });
        }
      };

      const handleZoomOut = () => {
        const cy = cyRef.current;
        if (cy) {
          cy.zoom({
            level: cy.zoom() / 1.25,
            renderedPosition: { x: cy.width() / 2, y: cy.height() / 2 }
          });
        }
      };

      const handleFitViewport = () => {
        const cy = cyRef.current;
        if (cy) {
          cy.fit(null, 50);
        }
      };

      const handleResetViewport = () => {
        const cy = cyRef.current;
        if (cy) {
          cy.reset();
          cy.fit(null, 50);
          triggerNotification('Viewport et zoom réinitialisés !');
        }
      };

      // ==========================================
      // 3. PROPAGATION TRANSITIVE BFS D'IMPACT
      // ==========================================
      useEffect(() => {
        if (!selectedEntity) {
          setImpactedSet(new Set());
          return;
        }

        const visited = new Set();
        const queue = [];

        let startKey = '';
        if (selectedEntity.type === 'member') {
          startKey = `${selectedEntity.nodeId}__member__${selectedEntity.memberId}`;
        } else if (selectedEntity.type === 'node') {
          startKey = selectedEntity.nodeId;
        }

        if (startKey) {
          queue.push(startKey);
          visited.add(startKey);
        }

        while (queue.length > 0) {
          const current = queue.shift();

          initialCodebase.dependencies.forEach(dep => {
            const isConfig = dep.targetNode === 'application.yml';
            const sourceKeyMember = `${dep.sourceNode}__member__${dep.sourceHandle}`;
            const targetKeyMember = `${dep.targetNode}__member__${dep.targetHandle}`;

            const isHeaderRelation = dep.sourceHandle === 'header' || dep.targetHandle === 'header';
            const sourceKey = isHeaderRelation ? dep.sourceNode : sourceKeyMember;
            const targetKey = isHeaderRelation ? dep.targetNode : targetKeyMember;

            if (impactDirection === 'aval') {
              if (current === dep.sourceNode || current === sourceKey) {
                if (!visited.has(targetKey)) {
                  visited.add(targetKey);
                  visited.add(dep.targetNode);
                  queue.push(targetKey);
                }
              }
            } else {
              if (current === dep.targetNode || current === targetKey) {
                if (!visited.has(sourceKey)) {
                  visited.add(sourceKey);
                  visited.add(dep.sourceNode);
                  queue.push(sourceKey);
                }
              }
            }
          });
        }

        setImpactedSet(visited);
        setTimeout(triggerConnectionUpdate, 60);
      }, [selectedEntity, impactDirection]);

      // ==========================================
      // 4. ACTION DE DRAG DES NOEUDS VIA REACT -> SYNC CYTOSCAPE
      // ==========================================
      const handleNodeDragStart = (e, nodeId, isFolder = false) => {
        e.stopPropagation();
        e.preventDefault();

        const startX = e.clientX || e.touches?.[0]?.clientX;
        const startY = e.clientY || e.touches?.[0]?.clientY;

        const cy = cyRef.current;
        const targetNode = cy.getElementById(nodeId);
        if (!targetNode) return;

        const initialNodePos = targetNode.position();

        const handleDragMove = (moveEvent) => {
          const currentX = moveEvent.clientX || moveEvent.touches?.[0]?.clientX;
          const currentY = moveEvent.clientY || moveEvent.touches?.[0]?.clientY;

          const deltaX = (currentX - startX) / zoom;
          const deltaY = (currentY - startY) / zoom;

          // Mettre à jour la position dans Cytoscape (Cytoscape met à jour automatiquement la boîte du parent)
          targetNode.position({
            x: initialNodePos.x + deltaX,
            y: initialNodePos.y + deltaY
          });
        };

        const handleDragEnd = () => {
          window.removeEventListener('mousemove', handleDragMove);
          window.removeEventListener('mouseup', handleDragEnd);
          window.removeEventListener('touchmove', handleDragMove);
          window.removeEventListener('touchend', handleDragEnd);
          document.body.classList.remove('dragging-active');
        };

        document.body.classList.add('dragging-active');
        window.addEventListener('mousemove', handleDragMove);
        window.addEventListener('mouseup', handleDragEnd);
        window.addEventListener('touchmove', handleDragMove);
        window.addEventListener('touchend', handleDragEnd);
      };

      // ==========================================
      // 5. TRACÉ DES COURBES DE BÉZIER SUR PORT SVG SYNC
      // ==========================================
      const connectionsOverlay = useMemo(() => {
        const paths = [];

        initialCodebase.dependencies.forEach(dep => {
          const isSourceVisible = visibleFiles[dep.sourceNode];
          const isTargetVisible = visibleFiles[dep.targetNode];

          if (isSourceVisible && isTargetVisible) {
            const isConfig = dep.targetNode === 'application.yml';
            const srcKey = dep.sourceHandle === 'header' ? dep.sourceNode : `${dep.sourceNode}__member__${dep.sourceHandle}`;
            const tgtKey = dep.targetHandle === 'header' ? dep.targetNode : `${dep.targetNode}__member__${dep.targetHandle}`;

            const isEdgeImpacted = impactedSet.has(srcKey) && impactedSet.has(tgtKey);
            const isAnyActiveSelection = selectedEntity !== null;
            const isDimmed = isAnyActiveSelection && impactedSet.size > 0 && !isEdgeImpacted;

            // Récupérer les identifiants DOM des ports pour tracer la courbe Bézier physique
            const srcPortId = dep.sourceHandle === 'header'
              ? `port__${dep.sourceNode}__header__source`
              : `port__${dep.sourceNode}__method__${dep.sourceHandle}__source`;

            const tgtPortId = dep.targetHandle === 'header'
              ? `port__${dep.targetNode}__header__target`
              : isConfig
                ? `port__${dep.targetNode}__prop__${dep.targetHandle}__target`
                : `port__${dep.targetNode}__method__${dep.targetHandle}__target`;

            const srcEl = document.getElementById(srcPortId);
            const tgtEl = document.getElementById(tgtPortId);
            const overlayContainer = document.getElementById('scaled-overlay-container');

            if (srcEl && tgtEl && overlayContainer) {
              const canvasRect = overlayContainer.getBoundingClientRect();
              const srcRect = srcEl.getBoundingClientRect();
              const tgtRect = tgtEl.getBoundingClientRect();

              // Calcul des coordonnées relatives au plan de zoom/pan de Cytoscape
              const x1 = (srcRect.left - canvasRect.left + srcRect.width / 2) / zoom;
              const y1 = (srcRect.top - canvasRect.top + srcRect.height / 2) / zoom;
              const x2 = (tgtRect.left - canvasRect.left + tgtRect.width / 2) / zoom;
              const y2 = (tgtRect.top - canvasRect.top + tgtRect.height / 2) / zoom;

              const controlOffset = Math.max(80, Math.abs(x2 - x1) * 0.45);
              const pathData = `M ${x1} ${y1} C ${x1 + controlOffset} ${y1}, ${x2 - controlOffset} ${y2}, ${x2} ${y2}`;

              let strokeColor = darkMode ? '#475569' : '#cbd5e1';
              let strokeDash = 'none';

              if (isEdgeImpacted) {
                strokeColor = '#f97316'; // Orange Fluo d'impact
              } else {
                switch (dep.relation) {
                  case 'extends':
                    strokeColor = '#3b82f6';
                    strokeDash = '6,6';
                    break;
                  case 'implementation':
                    strokeColor = '#818cf8';
                    strokeDash = '4,4';
                    break;
                  case 'aggregation':
                    strokeColor = '#10b981';
                    break;
                  case 'dependency':
                    strokeColor = '#f59e0b';
                    strokeDash = '3,3';
                    break;
                  default:
                    break;
                }
              }

              paths.push(
                <g key={dep.id} className="transition-all duration-300">
                  <path
                    d={pathData}
                    fill="none"
                    stroke={strokeColor}
                    strokeWidth={isEdgeImpacted ? 4.5 : 2}
                    strokeDasharray={strokeDash}
                    opacity={isDimmed ? 0.15 : 1}
                    markerEnd="url(#arrow)"
                  />
                  <text
                    x={(x1 + x2) / 2}
                    y={(y1 + y2) / 2 - 6}
                    fill={darkMode ? '#94a3b8' : '#475569'}
                    className="font-mono text-[9px] pointer-events-none select-none"
                    textAnchor="middle"
                    opacity={isDimmed ? 0.15 : 0.85}
                  >
                    {dep.label}
                  </text>
                </g>
              );
            }
          }
        });

        return paths;
      }, [visibleFiles, impactedSet, nodePositions, selectedEntity, darkMode, dimensionsTrigger, zoom]);

      // Déclencher un rafraîchissement des connexions
      useEffect(() => {
        const timer = setTimeout(triggerConnectionUpdate, 150);
        return () => clearTimeout(timer);
      }, [visibleFiles, nodePositions]);

      // ==========================================
      // 6. FILTRES & LAYOUT AUTOMATIQUE COSE
      // ==========================================
      const searchFilteredFiles = useMemo(() => {
        return initialCodebase.files.filter(file => {
          const matchesSearch = file.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            file.language.toLowerCase().includes(searchTerm.toLowerCase()) ||
            file.path.toLowerCase().includes(searchTerm.toLowerCase());

          return matchesSearch && visibleFiles[file.id];
        });
      }, [searchTerm, visibleFiles]);

      const toggleFolderCheckbox = (folderName) => {
        const isCurrentlyChecked = initialCodebase.files
          .filter(f => f.path.startsWith(folderName))
          .every(f => visibleFiles[f.id]);

        const updated = { ...visibleFiles };
        initialCodebase.files.forEach(file => {
          if (file.path.startsWith(folderName)) {
            updated[file.id] = !isCurrentlyChecked;
          }
        });
        setVisibleFiles(updated);
      };

      // Lancer la réorganisation automatique Cytoscape (COSE Layout)
      const triggerCoseLayout = () => {
        const cy = cyRef.current;
        if (cy) {
          cy.layout({
            name: 'cose',
            animate: true,
            animationDuration: 700,
            fit: true,
            padding: 80,
            nodeOverlap: 40,
            componentSpacing: 120,
            nodeRepulsion: () => 1000000,
          }).run();
          triggerNotification('Structure réorganisée par Cytoscape.js !');
        }
      };

      // ==========================================
      // 7. GENERATEURS TECHNIQUES DYNAMIQUES
      // ==========================================
      const generatedPlantUML = useMemo(() => {
        let puml = `' Diagramme UML synchrone généré à la volée\n`;
        puml += `@startuml Codebase_Architecture_State\n\n`;
        puml += `skinparam monochrome false\n`;
        puml += `skinparam packageStyle rectangle\n\n`;

        ['frontend', 'backend', 'config'].forEach(f => {
          const folderFiles = searchFilteredFiles.filter(file => file.path.startsWith(f));
          if (folderFiles.length > 0) {
            puml += `package "${f}" {\n`;
            folderFiles.forEach(file => {
              if (file.type === 'config') {
                puml += `  class ${file.id.replace(/\.[^/.]+$/, "")} << (C, #f59e0b) Config >> {\n`;
                file.configProperties?.forEach(prop => {
                  puml += `    {field} ${prop.key}\n`;
                });
                puml += `  }\n`;
              } else {
                const stereotype = file.type === 'interface' ? '<< Interface >>' : file.type === 'component' ? '<< Component >>' : '';
                puml += `  class ${file.id.replace(/\.[^/.]+$/, "")} ${stereotype} {\n`;
                file.attributes.forEach(attr => puml += `    {field} ${attr.name}\n`);
                file.methods.forEach(m => puml += `    {method} + ${m.name}\n`);
                puml += `  }\n`;
              }
            });
            puml += `}\n\n`;
          }
        });

        initialCodebase.dependencies.forEach(dep => {
          if (visibleFiles[dep.sourceNode] && visibleFiles[dep.targetNode]) {
            const srcClean = dep.sourceNode.replace(/\.[^/.]+$/, "");
            const tgtClean = dep.targetNode.replace(/\.[^/.]+$/, "");
            let arrow = '-->';
            if (dep.relation === 'extends') arrow = '--|>';
            if (dep.relation === 'implementation') arrow = '..|>';
            if (dep.relation === 'aggregation') arrow = '--o';
            if (dep.relation === 'dependency') arrow = '..>';
            puml += `${srcClean} ${arrow} ${tgtClean} : "${dep.label}"\n`;
          }
        });

        puml += `\n@enduml`;
        return puml;
      }, [searchFilteredFiles, visibleFiles]);

      const generatedMarkdownRecipe = useMemo(() => {
        let md = `### 🛡️ Plan d'Impact & Fiche de Recette Polyglotte\n\n`;
        let startElement = 'Non défini';
        if (selectedEntity) {
          if (selectedEntity.type === 'member') {
            startElement = `Méthode \`${selectedEntity.memberId}()\` de \`${selectedEntity.nodeId}\``;
          } else {
            startElement = `Fichier \`${selectedEntity.nodeId}\``;
          }
        }
        md += `**Déclencheur d'Analyse :** ${startElement}\n`;
        md += `**Direction :** ${impactDirection === 'aval' ? 'Aval (Dépendants / Cibles)' : 'Amont (Appelants / Origines)'}\n\n`;
        md += `#### 📋 Liste ordonnée des fichiers physiques à tester en priorité\n\n`;

        let count = 0;
        initialCodebase.files.forEach(file => {
          if (impactedSet.has(file.id)) {
            count++;
            md += `- [ ] **${file.name}** (\`${file.path}\`)\n`;
            const impactedMethods = [];
            impactedSet.forEach(item => {
              if (item.startsWith(`${file.id}__member__`)) {
                const mId = item.split('__member__')[1];
                const realName = file.methods?.find(m => m.id === mId)?.name || mId;
                impactedMethods.push(realName);
              }
            });
            if (impactedMethods.length > 0) {
              md += `  * Points chauds : ${impactedMethods.map(m => `\`${m}\``).join(', ')}\n`;
            }
          }
        });
        if (count === 0) md += `*Sélectionnez un composant pour tracer le flux d'impact.*`;
        return md;
      }, [selectedEntity, impactDirection, impactedSet]);

      // ==========================================
      // 8. CORPS DU COMPOSANT REACT
      // ==========================================
      return (
        <div className="flex flex-col w-full h-full select-none">

          {/* TOAST DE NOTIFICATION */}
          {copiedNotification && (
            <div className="top-4 left-1/2 z-50 fixed flex items-center gap-2 bg-indigo-650 shadow-2xl px-4 py-2.5 rounded-full font-mono text-white text-xs -translate-x-1/2 animate-bounce transform">
              <Check size={14} />
              {copiedNotification}
            </div>
          )}

          {/* HEADER PRINCIPAL */}
          <header className="z-30 flex justify-between items-center bg-white dark:bg-slate-900 shadow-sm px-6 py-3 border-slate-200 dark:border-slate-800 border-b shrink-0">
            <div className="flex items-center gap-3">
              <div className="bg-indigo-600 p-2 rounded-lg text-white">
                <Layers size={22} className="animate-pulse" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="font-mono font-black text-lg tracking-tight">ARCHI-POLYGLOT</h1>
                  <span className="bg-indigo-150 dark:bg-indigo-950 px-2 py-0.5 rounded font-mono font-bold text-[10px] text-indigo-700 dark:text-indigo-300">
                    Cytoscape.js Compound Nodes
                  </span>
                </div>
                <p className="text-slate-500 dark:text-slate-400 text-xs">Atelier d'exploration et d'analyse d'impact d'architecture logicielle mixte</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={triggerCoseLayout}
                className="flex items-center gap-1.5 bg-indigo-600 hover:bg-indigo-700 shadow px-3 py-1.5 rounded font-mono font-bold text-white text-xs transition"
              >
                <GitCompare size={14} />
                Réorganiser (COSE Layout)
              </button>

              <button
                onClick={resetAllFilters}
                className="flex items-center gap-1.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 px-3 py-1.5 border border-slate-300 dark:border-slate-700 rounded font-mono font-semibold text-slate-700 dark:text-slate-200 text-xs transition"
              >
                Réinitialiser la Vue
              </button>

              <button
                onClick={() => setDarkMode(!darkMode)}
                className="bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 p-2 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-700 dark:text-slate-200 transition"
              >
                {darkMode ? <Sun size={18} className="text-yellow-400" /> : <Moon size={18} className="text-indigo-650" />}
              </button>
            </div>
          </header>

          {/* ZONE PRINCIPALE DE L'INTERFACE (3 PANNEAUX) */}
          <div className="relative flex flex-1 overflow-hidden">

            {/* PANNEAU GAUCHE : EXPLORATEUR DE CODEBASE POLYGLOTTE */}
            <aside className="flex flex-col bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 border-r w-80 shrink-0">

              <div className="bg-slate-50/50 dark:bg-slate-950/20 p-4 border-slate-150 dark:border-slate-800 border-b">
                <h3 className="flex justify-between items-center mb-2 font-mono font-bold text-slate-400 text-xs uppercase tracking-wider">
                  <span>Codebase Fichiers</span>
                  <span className="bg-slate-200 dark:bg-slate-800 px-2 py-0.5 rounded text-[10px] text-slate-600 dark:text-slate-400">
                    {visibleCount}/{initialCodebase.files.length} actifs
                  </span>
                </h3>
                <div className="relative">
                  <Search className="top-2.5 left-2.5 absolute w-4 h-4 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Recherche globale..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="bg-slate-100 dark:bg-slate-950 px-3 py-1.5 pl-9 border border-slate-250 dark:border-slate-800 rounded focus:outline-none focus:ring-1 focus:ring-indigo-500 w-full font-mono text-slate-850 dark:text-slate-100 text-xs"
                  />
                </div>
              </div>

              {/* Arborescence interactive */}
              <div className="flex-1 space-y-4 p-4 overflow-y-auto font-mono text-xs">

                {/* Dossier: Frontend */}
                <div>
                  <div className="flex justify-between items-center hover:bg-slate-50 dark:hover:bg-slate-950 px-1 py-1 rounded">
                    <div className="flex items-center gap-1.5 cursor-pointer" onClick={() => toggleFolder('frontend')}>
                      {expandedFolders['frontend'] ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                      <Folder size={15} className="fill-yellow-500/20 text-yellow-500" />
                      <span className="font-bold">frontend/</span>
                    </div>
                    <input
                      type="checkbox"
                      checked={initialCodebase.files.filter(f => f.path.startsWith('frontend')).every(f => visibleFiles[f.id])}
                      onChange={() => toggleFolderCheckbox('frontend')}
                      className="rounded focus:ring-indigo-500 w-3.5 h-3.5 text-indigo-600 cursor-pointer"
                    />
                  </div>

                  {expandedFolders['frontend'] && (
                    <div className="space-y-1 mt-1 ml-2.5 pl-6 border-slate-200 dark:border-slate-800 border-l">
                      {initialCodebase.files
                        .filter(f => f.path.startsWith('frontend'))
                        .map(file => (
                          <div key={file.id} className="group flex justify-between items-center hover:bg-slate-100 dark:hover:bg-slate-950 px-2 py-1 rounded">
                            <span
                              className={`flex items-center gap-1.5 truncate cursor-pointer ${visibleFiles[file.id] ? 'text-slate-800 dark:text-slate-200 font-medium' : 'text-slate-400 line-through'}`}
                              onClick={() => setSelectedEntity({ type: 'node', nodeId: file.id })}
                            >
                              <FileCode size={13} className="text-emerald-500" />
                              {file.name}
                            </span>
                            <input
                              type="checkbox"
                              checked={visibleFiles[file.id]}
                              onChange={() => toggleFileCheckbox(file.id)}
                              className="rounded focus:ring-indigo-500 w-3.5 h-3.5 text-indigo-600 cursor-pointer"
                            />
                          </div>
                        ))}
                    </div>
                  )}
                </div>

                {/* Dossier: Backend */}
                <div>
                  <div className="flex justify-between items-center hover:bg-slate-50 dark:hover:bg-slate-950 px-1 py-1 rounded">
                    <div className="flex items-center gap-1.5 cursor-pointer" onClick={() => toggleFolder('backend')}>
                      {expandedFolders['backend'] ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                      <Folder size={15} className="fill-indigo-500/20 text-indigo-500" />
                      <span className="font-bold">backend/</span>
                    </div>
                    <input
                      type="checkbox"
                      checked={initialCodebase.files.filter(f => f.path.startsWith('backend')).every(f => visibleFiles[f.id])}
                      onChange={() => toggleFolderCheckbox('backend')}
                      className="rounded focus:ring-indigo-500 w-3.5 h-3.5 text-indigo-600 cursor-pointer"
                    />
                  </div>

                  {expandedFolders['backend'] && (
                    <div className="space-y-1 mt-1 ml-2.5 pl-6 border-slate-200 dark:border-slate-800 border-l">
                      {initialCodebase.files
                        .filter(f => f.path.startsWith('backend'))
                        .map(file => (
                          <div key={file.id} className="group flex justify-between items-center hover:bg-slate-100 dark:hover:bg-slate-950 px-2 py-1 rounded">
                            <span
                              className={`flex items-center gap-1.5 truncate cursor-pointer ${visibleFiles[file.id] ? 'text-slate-800 dark:text-slate-200 font-medium' : 'text-slate-400 line-through'}`}
                              onClick={() => setSelectedEntity({ type: 'node', nodeId: file.id })}
                            >
                              <FileCode size={13} className="text-blue-500" />
                              {file.name}
                            </span>
                            <input
                              type="checkbox"
                              checked={visibleFiles[file.id]}
                              onChange={() => toggleFileCheckbox(file.id)}
                              className="rounded focus:ring-indigo-500 w-3.5 h-3.5 text-indigo-600 cursor-pointer"
                            />
                          </div>
                        ))}
                    </div>
                  )}
                </div>

                {/* Dossier: Config */}
                <div>
                  <div className="flex justify-between items-center hover:bg-slate-50 dark:hover:bg-slate-950 px-1 py-1 rounded">
                    <div className="flex items-center gap-1.5 cursor-pointer" onClick={() => toggleFolder('config')}>
                      {expandedFolders['config'] ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                      <Settings size={15} className="text-amber-500" />
                      <span className="font-bold">config/</span>
                    </div>
                    <input
                      type="checkbox"
                      checked={initialCodebase.files.filter(f => f.path.startsWith('config')).every(f => visibleFiles[f.id])}
                      onChange={() => toggleFolderCheckbox('config')}
                      className="rounded focus:ring-indigo-500 w-3.5 h-3.5 text-indigo-600 cursor-pointer"
                    />
                  </div>

                  {expandedFolders['config'] && (
                    <div className="space-y-1 mt-1 ml-2.5 pl-6 border-slate-200 dark:border-slate-800 border-l">
                      {initialCodebase.files
                        .filter(f => f.path.startsWith('config'))
                        .map(file => (
                          <div key={file.id} className="group flex justify-between items-center hover:bg-slate-100 dark:hover:bg-slate-950 px-2 py-1 rounded">
                            <span
                              className={`flex items-center gap-1.5 truncate cursor-pointer ${visibleFiles[file.id] ? 'text-slate-800 dark:text-slate-200 font-medium' : 'text-slate-400 line-through'}`}
                              onClick={() => setSelectedEntity({ type: 'node', nodeId: file.id })}
                            >
                              <Database size={13} className="text-amber-500" />
                              {file.name}
                            </span>
                            <input
                              type="checkbox"
                              checked={visibleFiles[file.id]}
                              onChange={() => toggleFileCheckbox(file.id)}
                              className="rounded focus:ring-indigo-500 w-3.5 h-3.5 text-indigo-600 cursor-pointer"
                            />
                          </div>
                        ))}
                    </div>
                  )}
                </div>

              </div>
            </aside>

            {/* ZONE CENTRALE : CONTAINER CYTOSCAPE & OVERLAY REACT */}
            <main
              id="canvas-container"
              ref={canvasContainerRef}
              className="relative flex-1 bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 border-r h-full overflow-hidden"
            >

              {/* Fond quadrillé pointillé de type React Flow */}
              <div className="z-0 absolute inset-0 bg-[radial-gradient(#cbd5e1_1px,transparent_1px)] dark:bg-[radial-gradient(#1e293b_1px,transparent_1px)] pointer-events-none [background-size:16px_16px]"></div>

              {/* CONTENEUR DE RENDU CYTOSCAPE (Invisible mais gère la physique compound & drag) */}
              <div
                id="cy-headless-container"
                className="z-10 absolute inset-0 w-full h-full"
              ></div>

              {/* OVERLAY DE SUPERPOSITION REACT (Positionné en absolue selon le pan et zoom de Cytoscape) */}
              <div
                id="scaled-overlay-container"
                style={{
                  transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
                  transformOrigin: '0 0',
                  position: 'absolute',
                  width: '100%',
                  height: '100%',
                  pointerEvents: 'none',
                  zIndex: 20
                }}
              >

                {/* Rendu des enveloppes de dossiers parents (Calculées par Cytoscape) */}
                {Object.entries(compoundBounds).map(([id, pData]) => {
                  const b = pData.boundingBox;
                  return (
                    <div
                      key={id}
                      style={{
                        position: 'absolute',
                        left: b.x1,
                        top: b.y1,
                        width: b.w,
                        height: b.h,
                        pointerEvents: 'auto'
                      }}
                      className="bg-indigo-50/5 dark:bg-slate-900/10 p-4 border-2 border-indigo-400/40 dark:border-indigo-500/35 border-dashed rounded-2xl transition-colors"
                    >
                      <div
                        onMouseDown={(e) => handleNodeDragStart(e, id)}
                        onTouchStart={(e) => handleNodeDragStart(e, id)}
                        className="flex justify-between items-center mb-3 pb-2 border-slate-200 dark:border-slate-800 border-b border-dashed font-mono font-bold text-[11px] text-slate-400 dark:text-slate-500 uppercase tracking-wider cursor-move"
                      >
                        <span>{pData.label}</span>
                        <span className="bg-slate-200/50 dark:bg-slate-800 px-1.5 py-0.5 rounded text-[8px] text-indigo-500">PAQUET GROUPÉ</span>
                      </div>
                    </div>
                  );
                })}

                {/* SVG OVERLAY DES TRANSITIONS ET DEPENDANCES PORT-A-PORT */}
                <svg className="absolute inset-0 w-full h-full overflow-visible pointer-events-none">
                  <defs>
                    <marker
                      id="arrow"
                      viewBox="0 0 10 10"
                      refX="7"
                      refY="5"
                      markerWidth="6"
                      markerHeight="6"
                      orient="auto-start-reverse"
                    >
                      <path d="M 0 1 L 10 5 L 0 9 z" fill="#f59e0b" />
                    </marker>
                  </defs>
                  {connectionsOverlay}
                </svg>

                {/* Rendu des cartes UML surélevées sur les positions Cytoscape */}
                {searchFilteredFiles.map(file => {
                  const coords = nodePositions[file.id] || { x: 100, y: 100 };
                  const isNodeSelected = selectedEntity?.nodeId === file.id && selectedEntity?.type === 'node';
                  const isNodeImpacted = impactedSet.has(file.id);
                  const isAnyActiveSelection = selectedEntity !== null;
                  const isDimmed = isAnyActiveSelection && impactedSet.size > 0 && !isNodeImpacted;

                  const getHeaderTheme = () => {
                    switch (file.type) {
                      case 'component':
                        return { bg: 'bg-emerald-600', text: 'text-white', badge: '🎨 Component', border: 'border-emerald-500' };
                      case 'interface':
                        return { bg: 'bg-indigo-750', text: 'text-white', badge: '⚙️ Interface', border: 'border-indigo-500' };
                      case 'config':
                        return { bg: 'bg-amber-500', text: 'text-white', badge: '⚙️ Config', border: 'border-amber-500' };
                      default:
                        return { bg: 'bg-blue-600', text: 'text-white', badge: '☕ Class', border: 'border-blue-500' };
                    }
                  };

                  const theme = getHeaderTheme();

                  // Rendu Spécifique Config
                  if (file.type === 'config') {
                    return (
                      <div
                        key={file.id}
                        style={{
                          position: 'absolute',
                          left: coords.x - 144, // Centré sur la coordonnée de Cytoscape (width 288 / 2)
                          top: coords.y - 120,
                          pointerEvents: 'auto'
                        }}
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedEntity({ type: 'node', nodeId: file.id });
                        }}
                        className={`w-72 bg-white dark:bg-slate-900 rounded-lg shadow-xl border-2 ${
                          isNodeSelected ? 'ring-2 ring-indigo-500 border-indigo-500' : theme.border
                        } z-20 cursor-pointer overflow-visible transition-all duration-300 ${isDimmed ? 'opacity-25' : 'opacity-100'}`}
                      >
                        <div
                          onMouseDown={(e) => handleNodeDragStart(e, file.id)}
                          onTouchStart={(e) => handleNodeDragStart(e, file.id)}
                          className={`${theme.bg} p-2 text-white flex items-center justify-between cursor-move`}
                        >
                          <div className="flex items-center gap-1.5 font-mono font-bold text-xs">
                            <Settings size={15} />
                            {file.name}
                          </div>
                          <span className="bg-black/20 px-1.5 py-0.5 rounded font-bold text-[8px] uppercase tracking-wider">
                            {theme.badge}
                          </span>
                        </div>

                        <div className="space-y-1.5 bg-slate-950 p-2.5 font-mono text-[10px] text-slate-300">
                          {file.configProperties.map(prop => {
                            const isPropImpacted = impactedSet.has(`${file.id}__member__${prop.key}`);
                            const isSelectedProp = selectedEntity?.nodeId === file.id && selectedEntity?.memberId === prop.key && selectedEntity?.type === 'member';

                            return (
                              <div
                                key={prop.key}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleSelectMember(file.id, prop.key);
                                }}
                                className={`group relative p-1.5 rounded border transition-all ${
                                  isSelectedProp
                                    ? 'border-indigo-500 bg-indigo-950/70 text-white'
                                    : isPropImpacted
                                      ? 'border-orange-500 bg-orange-950/70 text-orange-400'
                                      : 'border-transparent hover:bg-slate-900'
                                }`}
                              >
                                <div
                                  id={`port__${file.id}__prop__${prop.key}__target`}
                                  className={`absolute left-[-11px] top-1/2 -translate-y-1/2 w-2 h-2 rounded-full border border-white z-30 ${
                                    isPropImpacted ? 'bg-orange-500' : 'bg-amber-500'
                                  }`}
                                ></div>

                                <div className="font-semibold text-amber-400 truncate">{prop.key}:</div>
                                <div className="pl-1.5 text-slate-400 truncate">{prop.value}</div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    );
                  }

                  // Rendu standard UML Classes / Interfaces
                  return (
                    <div
                      key={file.id}
                      style={{
                        position: 'absolute',
                        left: coords.x - 144,
                        top: coords.y - 120,
                        pointerEvents: 'auto'
                      }}
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedEntity({ type: 'node', nodeId: file.id });
                      }}
                      className={`w-72 bg-white dark:bg-slate-900 rounded-lg shadow-xl border-2 ${
                        isNodeSelected ? 'ring-2 ring-indigo-500 border-indigo-500' : theme.border
                      } z-20 cursor-pointer overflow-visible transition-all duration-300 ${isDimmed ? 'opacity-25' : 'opacity-100'}`}
                    >

                      {/* Header UML Draggable */}
                      <div
                        onMouseDown={(e) => handleNodeDragStart(e, file.id)}
                        onTouchStart={(e) => handleNodeDragStart(e, file.id)}
                        className={`${theme.bg} p-2 text-white relative rounded-t-[5px] cursor-move`}
                      >
                        <div
                          id={`port__${file.id}__header__target`}
                          className="top-[-5px] left-1/2 z-30 absolute bg-slate-400 border border-white dark:border-slate-900 rounded-full w-2.5 h-2.5 -translate-x-1/2"
                        ></div>
                        <div
                          id={`port__${file.id}__header__source`}
                          className="bottom-[-5px] left-1/2 z-30 absolute bg-indigo-500 border border-white dark:border-slate-900 rounded-full w-2.5 h-2.5 -translate-x-1/2"
                        ></div>

                        <div className="flex justify-between items-center">
                          <span className="bg-black/20 opacity-85 px-1.5 py-0.5 rounded font-mono font-bold text-[9px] uppercase tracking-wider">
                            {theme.badge}
                          </span>
                          <span className="opacity-60 font-mono text-[9px]">
                            {file.language}
                          </span>
                        </div>
                        <div className="flex items-center gap-1.5 mt-1">
                          <FileCode size={15} className="text-slate-200" />
                          <h4 className="font-mono font-bold text-xs truncate">{file.name}</h4>
                        </div>
                      </div>

                      {/* Attributs Compartment */}
                      <div className="bg-slate-50/50 dark:bg-slate-950/50 p-2 border-slate-200 dark:border-slate-800 border-b">
                        <div className="mb-0.5 font-bold text-[9px] text-slate-400 dark:text-slate-500 uppercase">Attributs</div>
                        {file.attributes.length === 0 ? (
                          <div className="text-[10px] text-slate-400 italic">aucun attribut</div>
                        ) : (
                          <ul className="space-y-0.5 font-mono text-[10px] text-slate-600 dark:text-slate-300">
                            {file.attributes.map((attr, idx) => (
                              <li key={idx} className="flex items-center gap-1 truncate">
                                <span className="text-slate-400">
                                  {attr.visibility === 'private' ? '-' : attr.visibility === 'protected' ? '#' : '+'}
                                </span>
                                {attr.name}
                              </li>
                            ))}
                          </ul>
                        )}
                      </div>

                      {/* Compartiment Méthodes (Points d'ancrage Port-à-Port) */}
                      <div className="p-2">
                        <div className="mb-1 font-bold text-[9px] text-slate-400 dark:text-slate-500 uppercase">Méthodes</div>
                        <div className="space-y-1.5">
                          {file.methods.map(m => {
                            const isMethodImpacted = impactedSet.has(`${file.id}__member__${m.id}`);
                            const isSelectedMethod = selectedEntity?.nodeId === file.id && selectedEntity?.memberId === m.id && selectedEntity?.type === 'member';

                            return (
                              <div
                                key={m.id}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleSelectMember(file.id, m.id);
                                }}
                                className={`group relative flex items-center justify-between p-1 rounded border transition-all ${
                                  isSelectedMethod
                                    ? 'border-indigo-500 bg-indigo-50/80 dark:bg-indigo-950/60'
                                    : isMethodImpacted
                                      ? 'border-orange-500 bg-orange-500/15 animate-pulse'
                                      : 'border-transparent hover:bg-slate-100 dark:hover:bg-slate-800'
                                }`}
                              >
                                <div
                                  id={`port__${file.id}__method__${m.id}__target`}
                                  className={`absolute left-[-11px] top-1/2 -translate-y-1/2 w-2.5 h-2.5 rounded-full border border-white z-30 transition-transform group-hover:scale-125 ${
                                    isMethodImpacted ? 'bg-orange-500' : 'bg-indigo-500'
                                  }`}
                                ></div>

                                <span className="font-mono text-[10.5px] text-slate-700 dark:text-slate-200">
                                  + {m.name}
                                </span>

                                <div
                                  id={`port__${file.id}__method__${m.id}__source`}
                                  className={`absolute right-[-11px] top-1/2 -translate-y-1/2 w-2.5 h-2.5 rounded-full border border-white z-30 transition-transform group-hover:scale-125 ${
                                    isMethodImpacted ? 'bg-orange-500' : 'bg-emerald-500'
                                  }`}
                                ></div>
                              </div>
                            );
                          })}
                        </div>
                      </div>

                    </div>
                  );
                })}

              </div>

              {/* BOUTONS FLOTTANTS DE CONTROLE DE VIEWPORT (ZOOM, CADRAGE, RESET) */}
              <div className="right-6 bottom-6 z-30 absolute flex flex-col gap-2">
                <button
                  onClick={handleZoomIn}
                  title="Zoom Avant"
                  className="bg-white hover:bg-slate-100 dark:bg-slate-900 dark:hover:bg-slate-800 shadow-xl p-3 border border-slate-250 dark:border-slate-800 rounded-lg text-slate-700 dark:text-slate-350 active:scale-95 transition cursor-pointer pointer-events-auto"
                >
                  <Plus size={16} />
                </button>
                <button
                  onClick={handleZoomOut}
                  title="Zoom Arrière"
                  className="bg-white hover:bg-slate-100 dark:bg-slate-900 dark:hover:bg-slate-800 shadow-xl p-3 border border-slate-250 dark:border-slate-800 rounded-lg text-slate-700 dark:text-slate-350 active:scale-95 transition cursor-pointer pointer-events-auto"
                >
                  <Minus size={16} />
                </button>
                <button
                  onClick={handleFitViewport}
                  title="Ajuster l'architecture à l'écran"
                  className="bg-white hover:bg-slate-100 dark:bg-slate-900 dark:hover:bg-slate-800 shadow-xl p-3 border border-slate-250 dark:border-slate-800 rounded-lg text-slate-700 dark:text-slate-350 active:scale-95 transition cursor-pointer pointer-events-auto"
                >
                  <Maximize size={16} />
                </button>
                <button
                  onClick={handleResetViewport}
                  title="Réinitialiser l'affichage"
                  className="bg-white hover:bg-slate-100 dark:bg-slate-900 dark:hover:bg-slate-800 shadow-xl p-3 border border-slate-250 dark:border-slate-800 rounded-lg text-slate-700 dark:text-slate-350 active:scale-95 transition cursor-pointer pointer-events-auto"
                >
                  <RefreshCw size={16} />
                </button>
              </div>

            </main>

            {/* PANNEAU DROIT : INSPECTEUR DE SÉLECTION */}
            <aside className="flex flex-col bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 border-l w-96 overflow-y-auto shrink-0">

              {/* Menu d'onglets */}
              <div className="flex bg-slate-50 dark:bg-slate-950/40 border-slate-200 dark:border-slate-800 border-b shrink-0">
                <button
                  onClick={() => setRightPanelTab('inspect')}
                  className={`flex-1 py-3 text-center font-mono text-xs font-semibold border-b-2 transition ${
                    rightPanelTab === 'inspect'
                      ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400 bg-white dark:bg-slate-900'
                      : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
                  }`}
                >
                  <div className="flex justify-center items-center gap-1.5">
                    <ShieldAlert size={14} />
                    Inspecteur
                  </div>
                </button>
                <button
                  onClick={() => setRightPanelTab('plantuml')}
                  className={`flex-1 py-3 text-center font-mono text-xs font-semibold border-b-2 transition ${
                    rightPanelTab === 'plantuml'
                      ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400 bg-white dark:bg-slate-900'
                      : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
                  }`}
                >
                  <div className="flex justify-center items-center gap-1.5">
                    <Terminal size={14} />
                    PlantUML
                  </div>
                </button>
                <button
                  onClick={() => setRightPanelTab('json_schema')}
                  className={`flex-1 py-3 text-center font-mono text-xs font-semibold border-b-2 transition ${
                    rightPanelTab === 'json_schema'
                      ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400 bg-white dark:bg-slate-900'
                      : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
                  }`}
                >
                  <div className="flex justify-center items-center gap-1.5">
                    <Code size={14} />
                    Schema Spec
                  </div>
                </button>
              </div>

              {/* ONGLET 1 : ANALYSE D'IMPACT DYNAMIQUE */}
              {rightPanelTab === 'inspect' && (
                <div className="flex-1 space-y-6 p-5">

                  {selectedEntity ? (
                    (() => {
                      const currentFile = initialCodebase.files.find(f => f.id === selectedEntity.nodeId);
                      if (!currentFile) return null;

                      return (
                        <div className="space-y-5">

                          {/* Descriptif technique de l'entité */}
                          <div className="bg-indigo-50/50 dark:bg-indigo-950/20 p-4 border border-indigo-150 dark:border-indigo-900/65 rounded-lg">
                            <div className="flex justify-between items-center">
                              <span className="font-mono font-bold text-[9px] text-indigo-500 uppercase tracking-wider">
                                ÉLÉMENT ACTIF
                              </span>
                              <span className="bg-indigo-100 dark:bg-indigo-950 px-2.5 py-0.5 rounded font-mono font-bold text-[10px] text-indigo-600 dark:text-indigo-400">
                                {currentFile.language}
                              </span>
                            </div>

                            <div className="flex items-start gap-2.5 mt-3">
                              <FileCode size={20} className="mt-1 text-indigo-650 dark:text-indigo-400 shrink-0" />
                              <div className="overflow-hidden">
                                <h4 className="font-mono font-bold text-slate-800 dark:text-slate-100 text-xs truncate">
                                  {selectedEntity.type === 'member' ? `${currentFile.name} ➔ ${selectedEntity.memberId}()` : currentFile.name}
                                </h4>
                                <span className="block mt-0.5 font-mono text-[9px] text-slate-400 truncate">
                                  {currentFile.path}
                                </span>
                              </div>
                            </div>

                            {/* Métriques de complexité */}
                            <div className="gap-3 grid grid-cols-2 mt-4 pt-3 border-indigo-100 dark:border-indigo-950 border-t">
                              <div className="bg-white dark:bg-slate-900 p-2 border border-slate-200 dark:border-slate-800 rounded">
                                <span className="block font-mono text-[9px] text-slate-400 uppercase">Volume de code</span>
                                <span className="font-mono font-bold text-slate-755 dark:text-slate-200 text-xs">{currentFile.size} LOC</span>
                              </div>
                              <div className="bg-white dark:bg-slate-900 p-2 border border-slate-200 dark:border-slate-800 rounded">
                                <span className="block font-mono text-[9px] text-slate-400 uppercase">Complexité V(g)</span>
                                <span className="font-mono font-bold text-slate-755 dark:text-slate-200 text-xs">Niveau {currentFile.complexity}</span>
                              </div>
                            </div>

                            {/* Docstring */}
                            {selectedEntity.type === 'member' && (
                              <div className="bg-slate-950 mt-3 p-2.5 border border-slate-850 rounded font-mono text-slate-300 text-xs">
                                <div className="mb-1 font-bold text-[9px] text-amber-400 uppercase">Doc fonctionnelle :</div>
                                {currentFile.methods.find(m => m.id === selectedEntity.memberId)?.description ||
                                 currentFile.configProperties?.find(p => p.key === selectedEntity.memberId)?.value ||
                                 "Pas d'annotation disponible pour ce membre."}
                              </div>
                            )}
                          </div>

                          {/* Options de Propagation d'Impact */}
                          <div className="space-y-2">
                            <label className="block font-mono font-bold text-[10px] text-slate-400 uppercase">Direction d'analyse d'impact (BFS)</label>

                            <div className="gap-2 grid grid-cols-2">
                              <button
                                onClick={() => setImpactDirection('aval')}
                                className={`flex items-center justify-center gap-1.5 py-2 px-3 font-mono text-xs font-bold rounded border transition ${
                                  impactDirection === 'aval'
                                    ? 'bg-orange-500 border-orange-400 text-white shadow-md'
                                    : 'bg-slate-100 dark:bg-slate-800 border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300'
                                }`}
                              >
                                <GitFork size={13} className="rotate-180" />
                                Aval (Cibles)
                              </button>

                              <button
                                onClick={() => setImpactDirection('amont')}
                                className={`flex items-center justify-center gap-1.5 py-2 px-3 font-mono text-xs font-bold rounded border transition ${
                                  impactDirection === 'amont'
                                    ? 'bg-orange-500 border-orange-400 text-white shadow-md'
                                    : 'bg-slate-100 dark:bg-slate-800 border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300'
                                }`}
                              >
                                <GitFork size={13} />
                                Amont (Source)
                              </button>
                            </div>
                          </div>

                          {/* Recette de Tests Auto-générée */}
                          <div className="space-y-3 bg-orange-500/5 dark:bg-orange-950/10 p-4 border border-orange-500/25 rounded-lg">
                            <div className="flex justify-between items-center">
                              <div className="flex items-center gap-1.5">
                                <ShieldAlert size={14} className="text-orange-500" />
                                <h5 className="font-mono font-bold text-orange-500 text-xs">Recette d'Impact Fluo</h5>
                              </div>
                              <button
                                onClick={() => copyToClipboard(generatedMarkdownRecipe, "Plan de recette copié !")}
                                className="flex items-center gap-1 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 px-2 py-1 border border-slate-250 dark:border-slate-700 rounded font-mono text-[9px] text-slate-700 dark:text-slate-200 transition"
                              >
                                <Copy size={11} />
                                Copier
                              </button>
                            </div>

                            <p className="font-mono text-[10px] text-slate-400">
                              Ces fichiers de codebase sont impactés de manière transitive et doivent faire l'objet de tests de non-régression :
                            </p>

                            <div className="space-y-1.5 max-h-48 overflow-y-auto">
                              {initialCodebase.files.map(file => {
                                if (!impactedSet.has(file.id)) return null;

                                return (
                                  <div key={file.id} className="flex justify-between items-center bg-white dark:bg-slate-900 px-2.5 py-1.5 border border-orange-500/15 rounded font-mono text-[11px]">
                                    <span className="font-semibold text-slate-700 dark:text-slate-250 truncate">{file.name}</span>
                                    <span className="bg-slate-100 dark:bg-slate-950 px-1.5 py-0.5 rounded text-[8.5px] text-slate-500">
                                      {file.language}
                                    </span>
                                  </div>
                                );
                              })}
                            </div>
                          </div>

                        </div>
                      );
                    })()
                  ) : (
                    <div className="space-y-3 py-12 text-center">
                      <ShieldAlert size={36} className="mx-auto text-slate-300" />
                      <div>
                        <h4 className="font-mono font-bold text-xs">Aucun composant sélectionné</h4>
                        <p className="mx-auto mt-1 max-w-[240px] text-[11px] text-slate-400">
                          Cliquez sur n'importe quelle boîte UML ou port pour démarrer l'analyse.
                        </p>
                      </div>
                    </div>
                  )}

                </div>
              )}

              {/* ONGLET 2 : PLANTUML */}
              {rightPanelTab === 'plantuml' && (
                <div className="flex flex-col flex-1 space-y-3 p-5 overflow-hidden">
                  <div className="flex justify-between items-center shrink-0">
                    <span className="font-mono font-bold text-[10px] text-slate-400 uppercase tracking-wider">
                      Syntaxe UML Dyn.
                    </span>
                    <button
                      onClick={() => copyToClipboard(generatedPlantUML, "Code PlantUML copié dans le presse-papier !")}
                      className="flex items-center gap-1 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 px-2.5 py-1 border border-slate-250 dark:border-slate-700 rounded font-mono text-slate-600 hover:text-indigo-600 dark:text-slate-300 text-xs transition"
                    >
                      <Copy size={12} />
                      Copier
                    </button>
                  </div>
                  <div className="flex-1 bg-slate-950 p-3 border border-slate-850 rounded-lg max-h-[500px] overflow-y-auto font-mono text-[10px] text-slate-300">
                    <pre className="whitespace-pre-wrap">{generatedPlantUML}</pre>
                  </div>
                </div>
              )}

              {/* ONGLET 3 : JSON SCHEMA SPECIFICATION */}
              {rightPanelTab === 'json_schema' && (
                <div className="flex flex-col flex-1 space-y-3 p-5 overflow-hidden">
                  <div className="flex justify-between items-center shrink-0">
                    <span className="font-mono font-bold text-[10px] text-slate-400 uppercase tracking-wider">
                      JSON Schema Specs
                    </span>
                    <button
                      onClick={() => copyToClipboard(JSON.stringify(JSON_SCHEMA_SPEC, null, 2), "Schéma JSON copié !")}
                      className="flex items-center gap-1 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 px-2.5 py-1 border border-slate-250 dark:border-slate-700 rounded font-mono text-slate-600 hover:text-indigo-600 dark:text-slate-300 text-xs transition"
                    >
                      <Copy size={12} />
                      Copier
                    </button>
                  </div>
                  <div className="flex-1 bg-slate-950 p-3 border border-slate-850 rounded-lg max-h-[500px] overflow-y-auto font-mono text-[10px] text-emerald-400">
                    <pre className="whitespace-pre-wrap">{JSON.stringify(JSON_SCHEMA_SPEC, null, 2)}</pre>
                  </div>
                </div>
              )}

            </aside>

          </div>
        </div>
      );

      // ==========================================
      // 9. UTILS & ACTIONS INTERACTIVES
      // ==========================================
      function handleSelectMember(nodeId, memberId) {
        setSelectedEntity({
          type: 'member',
          nodeId,
          memberId
        });
      }

      function toggleFileCheckbox(fileId) {
        setVisibleFiles(prev => ({
          ...prev,
          [fileId]: !prev[fileId]
        }));
      }

      function resetAllFilters() {
        setVisibleFiles({
          'OrderButton.tsx': true,
          'orderApi.ts': true,
          'OrderController.java': true,
          'Order.java': true,
          'OrderRepository.java': true,
          'JpaOrderRepository.java': true,
          'application.yml': true
        });
        setSearchTerm('');
        setSelectedEntity({ type: 'node', nodeId: 'OrderController.java' });

        // Repositionner par défaut via Cytoscape
        const cy = cyRef.current;
        if (cy) {
          initialCodebase.files.forEach(file => {
            const node = cy.getElementById(file.id);
            if (node.length > 0) {
              node.position(initialFileCoordinates[file.id]);
            }
          });
          cy.fit(null, 50);
        }
        triggerNotification('Positions par défaut rétablies !');
      }

      function copyToClipboard(text, msg) {
        const tempTextarea = document.createElement('textarea');
        tempTextarea.value = text;
        document.body.appendChild(tempTextarea);
        tempTextarea.select();
        document.execCommand('copy');
        document.body.removeChild(tempTextarea);
        triggerNotification(msg);
      }

      function toggleFolder(folderName) {
        setExpandedFolders(prev => ({ ...prev, [folderName]: !prev[folderName] }));
      }

      const visibleCount = searchFilteredFiles.length;
    }

    // ==========================================
    // 10. ENTRY POINT BOOTSTRAP
    // ==========================================
    const rootEl = ReactDOM.createRoot(document.getElementById('root'));
    rootEl.render(<App />);
  </script>
</body>
</html>
