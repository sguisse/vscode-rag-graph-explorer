Mon cher collaborateur, le défi est de taille, mais l'analyse croisée de votre base de code existante montre que nous disposons de fondations extrêmement saines. Le layout React est moderne, la gestion de `vis-network` et du `TreeView` est bien rodée, et vos scripts Python contiennent déjà des briques d'analyse d'impact structurelles (`networkx` dans `graphify-utils.py`) et d'analyse de traces d'erreurs (`error-parser.py`).

L'objectif de cette révision est de **substituer le mode "Upload manuel de fichier graph.json" par un pipeline d'exécution déterministe automatisé en tâche de fond**, tout en préservant scrupuleusement l'excellent layout visuel actuel de votre extension **Graph RAG Explorer**.

# PLAN D'EXÉCUTION TECHNIQUE : GRAPH RAG EXPLORER (PHASE 1)

## 📁 Structure Initiale du Workspace Cible

```text
graph-rag-explorer/
├── .vscode/
├── package.json                 # Manifeste de l'extension VS Code
├── src/
│   ├── extension.ts             # Orchestrateur TypeScript (Activation/Events)
│   └── webview/
│       └── index.tsx            # Point d'entrée React de la Webview
│       └── App.tsx              # Composant racine React (Gestion globale des états)
└── core/                        # Moteur central Python (Nouveau dossier d'architecture)
    ├── requirements.txt         # tree-sitter-languages, networkx, pandas, etc.
    ├── main.py                  # Point d'entrée CLI et routage des modes
    ├── discovery.py             # Découverte du workspace & Filtre cumulatif (Veto)
    ├── orchestrator.py          # Pool de processus parallèles (Java, TS, Py)
    ├── reconciler.py            # Moteur de liaison cross-language (API/Frontend)
    ├── git_delta.py             # Analyseur Git diff & Tree-sitter incrémental
    └── graph_engine.py          # Gestionnaire NetworkX & sérialisation JSON
```

---

## ## Étape 1 : Initialisation & Configuration de l'Extension VS Code

Cette étape configure la couche de présentation et déclare les points de contact entre l'IDE et le script Python.


| ID  | Tâche                                                  | Spécification Technique / Contraintes                                                                                                                                                                                                                                                                                                                                                                | Statut |
| :-- | :------------------------------------------------------ | :---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | :-----: |
| 1.1 | **Mise à jour du `package.json`**                      | Conserver les dépendances existantes (`react`, `vis-network`). Ajouter dans la section `contributes.configuration.properties` les clés suivantes :<br>- `graphRagExplorer.includePatterns` (type: `array`, items: `string`, default: `[]`)<br>- `graphRagExplorer.excludePatterns` (type: `array`, items: `string`, default: `["**/node_modules/**", "**/target/**", "**/dist/**", "**/.git/**"]`). | ✅ Done |
| 1.2 | **Validation de `webpack.config.js` & `tsconfig.json`** | Valider la double compilation existante (`extensionConfig` ciblant `node` et `webviewConfig` ciblant `web`). Aucune modification requise, l'infrastructure de build est validée opérationnelle.                                                                                                                                                                                                     | ✅ Done |
| 1.3 | **Initialisation du sous-dossier `core/`**              | Migrer et regrouper les dépendances Python dans`core/requirements.txt`. Spécifier explicitement : `tree-sitter-languages>=1.10.0`, `networkx>=3.1`, `pandas>=2.0.0`.                                                                                                                                                                                                                                | ✅ Done |

## ## Étape 2 : Noyau Python - Algorithme de Filtrage et Discovery

Création du mécanisme de découverte de l'espace de travail qui hérite de la logique de filtrage par motifs regex validée dans votre script `files-exporter.py`.


| ID  | Tâche                                            | Spécification Technique / Contraintes                                                                                                                                                                                                                                                                                                                                                                                                                    | Statut |
| :-- | :------------------------------------------------ | :-------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | :-----: |
| 2.1 | **Création du module `core/discovery.py`**       | Implémenter la classe`WorkspaceScanner` utilisant `os.walk` pour lister récursivement le workspace de manière agnostique.                                                                                                                                                                                                                                                                                                                              | ✅ Done |
| 2.2 | **Codage du Moteur de Filtrage Sélectif (Veto)** | Dans`core/discovery.py`, compiler les regex issues des paramètres utilisateurs. Appliquer la règle séquentielle :<br>1. Si le chemin absolu du fichier valide un motif d'exclusion (`excludePatterns`) ──> **VETO (Exclusion immédiate)**.<br>2. Si la liste d'inclusion (`includePatterns`) n'est pas vide et que le fichier ne valide aucun motif de celle-ci ──> **Exclusion**.<br>3. Sinon ──> **Inclusion et transmission aux pipelines**. | ✅ Done |
| 2.3 | **Moteur de Partitionnement de Modules**          | Analyser l'arborescence des fichiers inclus. Si détection d'un fichier marqueur (`pom.xml` ──> Tag `JAVA`, `package.json` ──> Tag `TS_JS`, `requirements.txt` ──> Tag `PYTHON`). Retourner un dictionnaire structuré regroupant les fichiers par écosystème technologique.                                                                                                                                                                      | ✅ Done |

---

## ## Étape 3 : Noyau Python - Extraction Multi-Langages & Réconciliation

Déploiement des tâches de traitement parallèle pour générer les relations d'injections et interconnecter les appels d'API du Frontend vers le Backend.


| ID  | Tâche                                       | Spécification Technique / Contraintes                                                                                                                                                                                                                                                                                                                                                                                                                                                               | Statut |
| :-- | :------------------------------------------- | :--------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | :-----: |
| 3.1 | **Création de `core/orchestrator.py`**      | Instancier un pool d'exécution parallèle (`concurrent.futures.ProcessPoolExecutor`). Envoyer les fichiers segmentés par l'étape 2.3 vers leurs modules d'analyse respectifs de manière concurrente.                                                                                                                                                                                                                                                                                             | ✅ Done |
| 3.2 | **Module d'analyse Java Sémantique**        | Écrire le traitement Java. Extraire l'arbre sémantique des classes et méthodes. Résoudre le couplage des annotations Spring en parsant le bytecode ou les chaînes de texte de l'AST : si une interface possède une classe d'implémentation unique annotée avec`@Component`/`@Service`, injecter une relation virtuelle de type `INJECTS` de la classe appelante vers l'implémentation concrète.                                                                                            | ✅ Done |
| 3.3 | **Module d'analyse TypeScript / JavaScript** | Appeler l'utilitaire`dependency-cruiser` en tâche de fond pour cartographier le module de l'application. Aspirer le JSON de sortie, extraire les types de nœuds et les mapper vers notre modèle générique de nœud.                                                                                                                                                                                                                                                                             | ✅ Done |
| 3.4 | **Création du module `core/reconciler.py`** | Implémenter l'algorithme de liaison cross-language :<br>1. Côté Java : Isoler les nœuds de méthodes annotés avec `@GetMapping` ou `@PostMapping` et mapper leur valeur d'URI textuelle (ex: `/api/v1/users`).<br>2. Côté TS/JS : Parcourir les littéraux de chaînes de caractères présents dans les requêtes réseau (`http.get`, `fetch`).<br>3. Appliquer un Pattern Matching d'URI pour créer un arc unifié `CALLS_API` reliant le composant TypeScript au contrôleur Java cible. | ✅ Done |

---

## ## Étape 4 : Adaptation de la Couche d'Orchestration TypeScript (Extension)

Modification de `src/extension.ts` pour automatiser l'invocation du moteur Python et écouter les changements d'état du workspace.


| ID  | Tâche                                              | Spécification Technique / Contraintes                                                                                                                                                                                                                                                                                                                                                                                                                         |   Statut   |
| :-- | :-------------------------------------------------- | :------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | :--------: |
| 4.1 | **Consolidation du format d'échange `graph.json`** | Forcer le module central de graphe Python (`core/graph_engine.py`) à écrire les résultats consolidés dans `.codegraph/graph.json` sous une structure stricte à deux clés : `{"nodes": [], "links": []}` pour garantir la compatibilité immédiate avec la fonction `GraphService.buildGraph` déjà présente en UI.                                                                                                                                    | ✅ Done |
| 4.2 | **Automatisation du cycle de Scan Initial**         | Dans`src/extension.ts`, au sein de la fonction `activate()`, ajouter un écouteur sur l'ouverture du workspace. Lancer l'exécution asynchrone du script Python (`core/main.py --mode scan-deep`) via un sous-processus `child_process.exec`. Passiver les configurations d'inclusion/exclusion utilisateurs via l'écriture dans `stdin`.                                                                                                                     |  ✅ Done  |
| 4.3 | **Moteur d'Analyse Incrémentale sur Sauvegarde**   | Enregistrer l'événement`vscode.workspace.onDidSaveTextDocument`. Lors du déclenchement, extraire le chemin du fichier sauvegardé. Appeler instantanément le script Python en mode chirurgical léger : `python core/main.py --mode delta --file ${filePath}`.                                                                                                                                                                                             |  ✅ Done  |
| 4.4 | **Intégration du Git Plumbing déterministe**      | Créer le module`core/git_delta.py`. Lors d'une modification, exécuter en interne la commande système `git diff -U0 ${filePath}` pour extraire les numéros de lignes précis modifiés. Utiliser la bibliothèque `tree-sitter` pour identifier la signature de méthode exacte englobant ces lignes et appliquer l'algorithme `networkx.ancestors()` pour identifier le *Blast Radius* structurel. Écrire le rapport dans `.codegraph/blast_radius.json`. |  ✅ Done  |

---

## ## Étape 5 : Réalignement Réactif de la Webview React (Frontend)

Mise à jour des composants React pour consommer le flux d'informations automatique envoyé par l'extension VS Code et supprimer l'obligation de chargement manuel de fichier.


| ID  | Tâche                                                         | Spécification Technique / Contraintes                                                                                                                                                                                                                                                                                                                                                     | Statut |
| :-- | :------------------------------------------------------------- | :----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | :-----: |
| 5.1 | **Abonnement réactif aux données de graphes dans `App.tsx`** | Dans le hook`useEffect` principal de `src/webview/App.tsx`, ajouter une interception de message VS Code : `message.command === 'updateGraphData'`. Lors de sa réception, invoquer automatiquement la méthode `GraphService.buildGraph(message.payload)` et rafraîchir les variables d'état React `setNodes` et `setEdges`.                                                             | ✅ Done |
| 5.2 | **Préservation du layout de `Header.tsx`** | Le composant Header reste inchangé pour préserver le layout existant; le flux réactif est directement injecté au niveau de App.tsx. | ✅ Done |
| 5.3 | **Synchronisation du panneau d'Analyse d'Impact**              | Connecter les états de sélection de`vis-network` (`click`) et du `TreeView` pour envoyer l'identifiant du nœud actif à l'extension TS. L'extension TS croise cet ID avec le fichier `.codegraph/blast_radius.json` de l'Étape 4.4 et pousse le rapport de revue de code formaté en Markdown directement dans l'onglet `AIAssistantTab` sous forme de contexte prêt pour la Phase 2. | ✅ Done |

## ## Étape 6 : Onglet Terminal & Suivi de Flux
| ID  | Tâche | Spécification Technique / Contraintes | Statut |
| :-- | :--- | :--- | :---: |
| 6.1 | **Pipeline d'ingestion TerminalTab** | Rendu scrollable du flux asynchrone stdout/stderr avec sélecteur de criticité. | ✅ Done |
