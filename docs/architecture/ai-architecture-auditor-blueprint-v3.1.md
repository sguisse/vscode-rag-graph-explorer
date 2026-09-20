# 🏗️ Blueprint V3.1 --- Evidence-Driven AI Software Architecture Auditor

> **Statut : cible d'architecture --- V3.1 consolidée**
>
> Cette V3 fusionne le blueprint initial et les propositions de Gemini.
> Elle conserve les mécanismes qui renforcent le moteur d'audit sans
> transformer prématurément le projet en plateforme « Enterprise AI
> Everything ».
>
> **Principe directeur :** Repository → Facts/Observations → Semantic
> Graph → Rules → Evidence → Reasoning when necessary → Validation →
> Finding → Report/SARIF.

# 🎯 1. Vision et objectifs

## 1.1 Objectif principal

Construire un moteur capable d'auditer un dépôt complet au niveau d'un
architecte logiciel : architecture Hexagonale/Clean/Layered,
dépendances, Spring Boot, transactions, JPA/PostgreSQL, Kafka,
Transactional Outbox, idempotence, résilience des APIs, Redis, sécurité,
configuration et tests. La première cible est Java/Spring Boot avec
Kafka, PostgreSQL, Redis et APIs externes. Les autres stacks arrivent
via un SPI de langage.

## 1.2 Résultat attendu

Chaque finding doit être traçable, reproductible, localisable et
justifié par des preuves. Le flux canonique est :

``` text
Observation → Evidence → Rule evaluation → Candidate finding
            → Semantic reasoning (si nécessaire) → Validation → Finding
```

# 🧭 2. Principes directeurs

## 2.1 Deterministic First

Avant tout LLM : parsing, AST, résolution de symboles, graphe d'appels,
configuration, Maven/Gradle, ArchUnit, OpenRewrite, Semgrep, tests et
analyse de dépôt.

``` text
La question est-elle résoluble sans LLM ?
  ├─ oui → analyse déterministe
  └─ non → raisonnement LLM ciblé
```

## 2.2 Le LLM produit des hypothèses

Le modèle peut interpréter, classifier et relier plusieurs éléments,
mais ne doit pas être la source de vérité primaire. Il produit une
hypothèse qui repasse par recherche de preuves et validation.

## 2.3 Evidence-first

L'`Evidence Store` précède le `Finding Store`. Une observation peut
servir plusieurs règles, ce qui évite de reparcourir le code pour chaque
règle.

## 2.4 Workflow déterministe

Les transitions, retries, budgets et validations sont contrôlés par le
workflow engine. Un agent ne décide pas lui-même d'une boucle d'agents.

## 2.5 Provider-neutral

Le core ne dépend ni de Copilot, OpenAI, Anthropic, Ollama, Claude Code
ni MCP. Il dépend uniquement de contrats comme `LlmProvider`, `Tool`,
`LanguageDriver` et `ValidationStrategy`.

# 🗺️ 3. Architecture globale

``` text
AUDIT CLI
   ↓
WORKFLOW ENGINE (DAG / state / retry / cache)
   ↓
INGESTION + ARCHITECTURE CONTRACT
   ↓
ANALYSIS FABRIC
(Tree-sitter / SCIP / OpenRewrite / ArchUnit / Semgrep / build / config)
   ↓
EVIDENCE STORE
   ↓
SEMANTIC GRAPH
   ↓
RULE ENGINE
   ├─ pas de raisonnement → validation
   └─ raisonnement requis → CONTEXT ENGINE → LLM GATEWAY
                                      ↓
                              VALIDATION ENGINE
                                      ↓
                                 FINDING STORE
                                      ↓
                               REPORT / SARIF
```

# 🧩 4. Couches

## 4.1 `audit-core`

Contient le métier du moteur : `domain`, `workflow`, `rules`,
`evidence`, `findings`, `graph`, `context`, `architecture`, `spi`.
Aucune dépendance directe vers un fournisseur LLM.

## 4.2 `analysis-fabric`

Adapters pour Tree-sitter, SCIP, OpenRewrite, ArchUnit, Semgrep, build
systems, configuration et tests.

## 4.3 `llm-gateway`

Routing, providers, privacy, budgets, cache et telemetry.

## 4.4 `context-engine`

Sélection des fichiers, symboles, graphes, skeletons et preuves
minimales nécessaires à une tâche.

## 4.5 `validation-engine`

Contre-preuves, static checks, compilation, tests et validation
sémantique.

# 🔬 5. Analysis Fabric

## 5.1 Tree-sitter

Conservé pour parsing rapide, support multi-langage et analyse
incrémentale. Tree-sitter n'est pas le modèle métier.

## 5.2 SCIP

Conservé comme source d'indexation des symboles, définitions et
références. SCIP n'est pas le graphe métier principal.

## 5.3 Semantic Graph

### Nœuds

`Repository`, `Module`, `Package`, `Class`, `Interface`, `Method`,
`Field`, `Endpoint`, `KafkaTopic`, `KafkaProducer`, `KafkaConsumer`,
`Database`, `DatabaseTable`, `RedisCache`, `ExternalApi`,
`Configuration`, `Test`, `Dependency`.

### Relations

`CONTAINS`, `EXTENDS`, `IMPLEMENTS`, `CALLS`, `INJECTS`, `READS`,
`WRITES`, `PUBLISHES`, `CONSUMES`, `CALLS_HTTP`, `READS_TABLE`,
`WRITES_TABLE`, `USES_CACHE`, `CONFIGURED_BY`, `TESTED_BY`,
`DEPENDS_ON`.

Le graphe devient le langage commun des règles et du Context Engine.

# 🧠 6. Représentations multiples du code

``` text
RAW SOURCE
 ↓
AST/CST
 ↓
AST SKELETON
 ↓
SYMBOL GRAPH
 ↓
CALL GRAPH
 ↓
CONFIG GRAPH
 ↓
DATA FLOW
 ↓
DOMAIN SUMMARY
```

Le Context Engine sélectionne la représentation adaptée. L'AST skeleton
est particulièrement utile pour remplacer de longs blocs par leur
structure sémantique : appels, annotations, transactions, exceptions,
lectures/écritures et publications.

La réduction de contexte est mesurée --- tokens, précision, faux
positifs/négatifs, coût et latence --- sans objectif arbitraire avant
benchmark.

# 🧱 7. Architecture Contract

``` yaml
architecture:
  style: hexagonal
  layers:
    domain:
      forbidden_dependencies: [spring, jpa, kafka, redis, http]
    application:
      allowed_dependencies: [domain, ports]
    adapters:
      allowed_dependencies: [application, domain]
  ports:
    persistence: { package: "*.application.port.out" }
    messaging: { package: "*.application.port.out" }
```

Le moteur compare l'architecture attendue à l'architecture réalisée afin
de distinguer une violation réelle d'un choix architectural explicite.

# 🔎 8. Evidence Store

Une observation est un fait issu d'un analyseur :

``` json
{
  "id": "obs-123",
  "type": "METHOD_CALL",
  "source": "OrderService.java",
  "line": 87,
  "subject": "OrderService.create",
  "predicate": "CALLS",
  "object": "KafkaTemplate.send"
}
```

Chaque evidence conserve sa provenance : analyseur, version, fichier,
lignes, hash, commit et timestamp.

# 📏 9. Confidence

La confiance finale est calculée par le moteur et non inventée par le
LLM. On conserve plusieurs dimensions :

``` json
{
  "evidenceStrength": 0.95,
  "semanticConfidence": 0.82,
  "validationStrength": 0.90
}
```

Le score final peut évoluer, mais sa construction doit rester
déterministe et explicable.

# 📜 10. Rule Engine

Une règle déclare son périmètre, les observations attendues, les checks,
le besoin éventuel de raisonnement et les stratégies de validation.

``` yaml
id: KAFKA-001
name: transactional-outbox
category: messaging
severity: HIGH
applies_when:
  dependencies: [spring-kafka, spring-data-jpa]
observations:
  required: [method_writes_database, method_publishes_kafka]
checks:
  - type: graph
  - type: configuration
  - type: source
reasoning:
  required: true
  model_class: small
validation:
  strategies: [counter_evidence, static, executable]
outputs:
  evidence_required: true
```

# 📚 11. Catalogue initial de règles

## Architecture

`HEX-001` Domain isolation; `HEX-002` Dependency direction; `HEX-003`
External ports; `HEX-004` Persistence isolation; `HEX-005` Messaging
adapter isolation; `HEX-006` Cache adapter isolation; `HEX-007` Web
layer leakage; `HEX-008` Infrastructure exception leakage; `HEX-009`
Application service boundary.

## Kafka

`KAFKA-001` Transactional Outbox; `KAFKA-002` Producer resilience;
`KAFKA-003` Producer idempotence; `KAFKA-004` Consumer idempotence;
`KAFKA-005` Error/DLQ strategy; `KAFKA-006` Ordering; `KAFKA-007`
Rebalance safety; `KAFKA-008` Schema compatibility.

## PostgreSQL/JPA

`DB-001` Transaction boundary; `DB-002` N+1; `DB-003` Missing indexes;
`DB-004` Optimistic concurrency; `DB-005` Connection pool; `DB-006` Long
transaction; `DB-007` Lazy loading risk; `DB-008` Entity leakage;
`DB-009` Migration alignment.

## Redis

`REDIS-001` TTL; `REDIS-002` Invalidation; `REDIS-003` Stampede;
`REDIS-004` Failure fallback; `REDIS-005` Serialization safety;
`REDIS-006` Key namespacing; `REDIS-007` Eviction strategy; `REDIS-008`
Lock timeout.

## APIs externes

`API-001` Timeout; `API-002` Retry/backoff; `API-003` Circuit breaker;
`API-004` Bulkhead; `API-005` Retry safety/idempotency; `API-006` Error
mapping; `API-007` Rate limiting; `API-008` HTTP pool.

## Sécurité

`SEC-001` Hardcoded secrets; `SEC-002` Authorization; `SEC-003`
Injection; `SEC-004` SSRF; `SEC-005` Sensitive logging; `SEC-006` CORS;
`SEC-007` Input validation; `SEC-008` Dependency vulnerabilities;
`SEC-009` Admin/Actuator exposure.

## Spring Boot

`SPRING-001` Field injection; `SPRING-002` Bean scope mismatch;
`SPRING-003` Async exception handling; `SPRING-004` Transaction
self-invocation; `SPRING-005` Circular dependencies; `SPRING-006`
Exception handling; `SPRING-007` Thread pool configuration; `SPRING-008`
Profile isolation; `SPRING-009` Scheduled job locking.

# 🧠 12. Context Engine

## Niveaux

**L0** : architecture contract, stack, conventions, règles.

**L1** : module, classes principales, dépendances, sous-graphe.

**L2** : méthode exacte, classes appelées, configuration, tests,
evidence.

**L3** : recherche de contre-preuves uniquement.

Pour une erreur de compilation : erreur → symbole → graphe → dépendances
→ fichiers pertinents → ranking → AST skeleton → LLM. Le deuxième appel
ne reçoit donc pas automatiquement tout le repository.

# 🧠 13. LLM Gateway

``` java
public interface LlmProvider {
    LlmResponse complete(LlmRequest request);
    ModelCapabilities capabilities();
}
```

Les modèles sont regroupés par capacité plutôt que par nom fournisseur :

``` yaml
models:
  tiny:   { provider: ollama, model: qwen3:4b }
  small:  { provider: ollama, model: qwen3:8b }
  medium: { provider: ollama, model: qwen3:14b }
  large:  { provider: cloud, model: "..." }
  expert: { provider: cloud, model: "..." }
```

Routing : niveau 0 déterministe → local tiny → local medium → cloud →
validator indépendant si nécessaire.

# 🔐 14. Data Classification & Privacy

L'idée d'anonymisation de Gemini est conservée, mais elle devient une
conséquence d'une politique de données :

``` text
Repository data → Classification → LOCAL_ONLY / CLOUD_ALLOWED
```

L'anonymisation est une transformation optionnelle avant un appel cloud.
Le code source peut rester strictement local alors que des résumés ou
findings peuvent être cloud-allowed selon la policy.

# 🔀 15. Validation

``` text
Candidate finding
 → Counter-evidence
 → Deterministic checks
 → Build/tests if useful
 → LLM validation if useful
 → Final status
```

Statuts : `DETERMINISTIC_VERIFIED`, `EMPIRICALLY_VERIFIED`,
`SEMANTICALLY_VALIDATED`, `HEURISTICALLY_VALIDATED`, `UNCERTAIN`,
`REJECTED`.

Les tests Testcontainers/JUnit ne sont produits que lorsqu'ils apportent
une valeur réelle.

# 🛡️ 16. Counter-Evidence Engine

Le « Code Advocate » devient un rôle logique et déterministe de
recherche de contre-preuves, plutôt qu'un agent autonome. Pour
KAFKA-001, on recherche notamment transaction manager Kafka,
transaction-id-prefix, outbox, CDC/Debezium, after-commit publisher et
autres mécanismes équivalents.

# 🔄 17. Workflow Engine

``` text
DISCOVERY
 ↓
INDEX
 ↓
BUILD GRAPH
 ↓
ARCHITECTURE DETECTION
 ↓
ARCHITECTURE CONTRACT
 ↓
OBSERVATIONS
 ↓
RULE EVALUATION
 ↓
NEED REASONING?
 ├─ NO → VALIDATION
 └─ YES → CONTEXT → LLM → COUNTER-EVIDENCE → VALIDATION
 ↓
FINDING → DEDUPLICATION → REPORT
```

``` java
public interface WorkflowStep<I,O> {
    String id();
    O execute(I input, WorkflowContext context);
    ValidationResult validate(O output);
    RetryPolicy retryPolicy();
}
```

Aucun agent ne possède une boucle infinie. Le moteur impose les
transitions, retries et limites.

# ⚡ 18. Incremental DAG

Chaque nœud conserve input hash, tool version, configuration hash et
output hash.

``` text
Git diff → changed files → affected symbols → affected graph nodes → affected rules → affected findings
```

Le blast radius est déterminé par le graphe, pas uniquement par la liste
des fichiers modifiés.

# 🧮 19. Cache, coûts et observabilité

Chaque appel LLM journalise auditId, stepId, ruleId, provider, model,
tokens, latence, cache hit et statut. Les ratios de local/cloud,
réduction de contexte et économies de coûts seront mesurés avant d'être
transformés en objectifs.

# 📦 20. Finding Model

``` java
public record Finding(
    String id,
    String ruleId,
    Severity severity,
    Status status,
    Confidence confidence,
    String component,
    List<Location> locations,
    List<EvidenceRef> evidence,
    String expected,
    String observed,
    String impact,
    String recommendation,
    ValidationSummary validation
) {}
```

# 🧪 21. Exemple complet KAFKA-001

1.  OpenRewrite détecte une méthode `@Transactional` qui écrit en base
    puis appelle `KafkaTemplate.send()`.
2.  Les observations sont enregistrées dans l'Evidence Store.
3.  Le graphe relie méthode, table et topic.
4.  Le rule engine déclenche KAFKA-001.
5.  Le Counter-Evidence Engine cherche transaction manager, outbox, CDC,
    after-commit et configurations équivalentes.
6.  Le Context Engine assemble uniquement méthode, call graph,
    configuration, evidence et contre-preuves.
7.  Un modèle local produit une hypothèse structurée.
8.  Une validation déterministe ou Testcontainers est exécutée si utile.
9.  Le Finding final contient toutes les preuves et le niveau de
    validation.

# 🧰 22. Interfaces principales

``` java
public interface Analyzer {
    String id();
    boolean supports(AnalysisInput input);
    List<Observation> analyze(AnalysisInput input);
}

public interface Rule {
    String id();
    RuleResult evaluate(RuleContext context);
}

public interface ContextProvider {
    Context build(ReasoningTask task, AnalysisContext context);
}

public interface ValidationStrategy {
    String id();
    boolean supports(CandidateFinding finding);
    ValidationResult validate(CandidateFinding finding, ValidationContext context);
}

public interface LanguageDriver {
    String id();
    boolean supports(Repository repository);
    AnalysisArtifacts analyze(Repository repository);
}
```

# 🔌 23. Language Driver SPI

``` text
LanguageDriver
 ├─ JavaSpringDriver → OpenRewrite / ArchUnit / Maven-Gradle
 ├─ TypeScriptDriver → Tree-sitter / TypeScript compiler API
 └─ PythonDriver → Tree-sitter / LibCST
```

Le driver produit des artifacts normalisés ; le core ne connaît pas les
détails du parser.

# 📂 24. Structure du projet

``` text
ai-architecture-auditor/
├── README.md
├── pom.xml
├── docs/architecture/{blueprint-v3.md,decisions/,diagrams/}
├── rules/{architecture,spring,kafka,database,redis,api,security}/
├── schemas/{observation,finding,workflow,rule}.schema.json
├── workflows/{full-audit,architecture-audit,incremental-audit}.yaml
├── src/main/java/com/company/auditor/
│   ├── Main.java
│   ├── core/
│   │   ├── domain/{Repository,AnalysisContext,Observation,Evidence,Finding,Rule,ArchitectureContract,SemanticGraph}.java
│   │   ├── workflow/{WorkflowEngine,WorkflowStep,WorkflowContext,Dag,RetryPolicy}.java
│   │   ├── evidence/{EvidenceStore,Provenance}.java
│   │   ├── graph/{GraphBuilder,GraphQuery,SemanticGraphRepository}.java
│   │   ├── rules/{RuleEngine,RuleRegistry}.java
│   │   ├── context/{ContextEngine,ContextSelector,AstSkeletonizer,ContextPolicy}.java
│   │   └── spi/{Analyzer,LanguageDriver,LlmProvider,ValidationStrategy,Tool}.java
│   ├── analysis/{tree_sitter,scip,openrewrite,archunit,semgrep,build,configuration}/
│   ├── drivers/java/{JavaSpringDriver,SpringAnalyzer}.java
│   ├── llm/{gateway,routing,privacy,budget,providers}/
│   ├── validation/{CounterEvidenceEngine,BuildValidator,TestValidator,SemanticValidator}.java
│   ├── findings/{FindingStore,Deduplicator,ConfidenceCalculator}.java
│   └── report/{MarkdownReporter,SarifReporter,JsonReporter}.java
└── src/test/resources/fixtures/{spring-good,spring-kafka-bad,spring-redis-bad,spring-api-bad}/
```

# 🧪 25. Golden repositories et benchmark

Chaque règle possède un cas positif, un cas négatif, un cas ambigu et
les résultats attendus. Mesures : precision, recall, faux positifs, faux
négatifs, evidence coverage, taux d'escalade LLM, tokens/finding,
latence et cache hit.

# 🔐 26. Security & permissions

Le moteur fonctionne en `READ_ONLY` par défaut. Les outils possèdent des
permissions explicites : lecture repository, lecture git, exécution
build/tests, écriture filesystem, écriture git, réseau.

# 🧩 27. Tools et MCP

Le core expose `Tool` : `ReadFile`, `SearchCode`, `RunMaven`,
`RunGradle`, `RunTest`, `QueryGraph`, `ReadConfig`, `GitDiff`. MCP
pourra plus tard adapter ces outils vers des systèmes externes. **MCP
n'est pas le cœur du moteur.**

# 📝 28. Agents : rôle réduit et contrôlé

Un agent est un couple
`Task + Context + Tools + Constraints + Expected Output`. Il peut
raisonner, mais le workflow engine garde le contrôle global.

``` yaml
agent:
  id: kafka-reasoner
  task: { type: semantic-analysis }
  allowed_tools: [query_graph, read_file, read_config]
  expected_output: { schema: kafka-reasoning.schema.json }
  max_iterations: 1
```

# 🔁 29. Compilation-error workflow

``` text
LLM patch → compile → ERROR → parse error → resolve symbols → graph dependencies
→ minimal context → LLM revision → compile
```

Ce mécanisme réalise l'objectif de gestion de contexte ciblé : seuls les
fichiers et symboles liés à l'erreur sont réinjectés.

# 🧱 30. Stockage

MVP : filesystem + SQLite/PostgreSQL. Une base graphe telle que Neo4j
est une option si les benchmarks montrent que les requêtes de graphe
deviennent un vrai goulot. Elle n'est pas imposée dès le premier jour.

# 📈 31. Déduplication

Le moteur doit distinguer cause racine et manifestations. Plusieurs
règles peuvent pointer vers une même anomalie ; le rapport regroupe
alors les conséquences sans multiplier artificiellement les findings.

# 📝 32. Documentation et Auto-remediation

DocGen et auto-remediation sont conservés comme extensions. Le core
produit d'abord finding + evidence + recommendation + éventuellement
patch proposé. La génération de PR et la modification automatique du
dépôt sont reportées jusqu'à ce que la validation soit suffisamment
robuste.

# 🛣️ 33. Roadmap

## Phase 1 --- Core Audit Engine

Java/Spring Boot, architecture, Kafka, PostgreSQL, Redis, API resilience
; ingestion, semantic graph, evidence store, rule engine, findings,
workflow DAG, Markdown/SARIF.

## Phase 2 --- Context + Local LLM

AST skeleton, Context Engine, Ollama, routing, reasoning,
counter-evidence, validation.

## Phase 3 --- Incremental Analysis

Hashing, graph invalidation, cache, Git diff.

## Phase 4 --- Validation avancée

Compilation, tests, Testcontainers et validations synthétiques
pertinentes.

## Phase 5 --- Multi-language

TypeScript et Python via Language Driver SPI.

## Phase 6 --- Documentation

C4, OpenAPI extraction, business rules.

## Phase 7 --- Runtime enrichment

OpenTelemetry et runtime graph si besoin.

## Phase 8 --- Automation

Auto-remediation, PR generation, LSP, architecture canvas.

# 🚫 34. Hors MVP

Fine-tuning, distillation, multi-agent debate, MCP comme cœur, OPA
obligatoire, compliance GDPR/ISO/SOC2, ROI financier, LSP, canvas,
auto-remediation automatique, multi-repo complexe, runtime OpenTelemetry
et documentation utilisateur complète.

# 🧠 35. Ce que la V3 retient de Gemini

  Proposition                      Décision   Traitement
  -------------------------------- ---------- ------------------------------------
  Deterministic First              ✅         Principe central
  Tree-sitter                      ✅         Parsing multi-langage
  SCIP                             ✅         Indexation, pas graphe métier
  AST skeleton                     ✅         Context Engine
  RASA/minification                ✅         Context minimization
  Language Driver SPI              ✅         Extension multi-langage
  Incremental DAG                  ✅         Workflow/cache
  Evidence Store                   ✅         Composant central
  Executable validation            ✅         Conditionnelle
  Counter-evidence                 ✅         Rôle logique, pas agent autonome
  Data classification              ✅         Privacy policy
  Anonymisation                    🟡         Selon policy
  Model routing                    ✅         Gateway
  Cost telemetry                   ✅         Dès le début
  OpenTelemetry                    🟡         Plus tard
  MCP                              🟢         Frontière d’intégration de première classe
  Multi-agent debate               ❌         Non retenu comme mécanisme central
  Java 21 + Rust unified runtime   ❌         Pas justifié au démarrage
  80--90 % deterministic           ❌         À mesurer
  85 % context reduction           ❌         À benchmarker
  90 % cost savings                ❌         À benchmarker
  Fine-tuning/distillation         🟡         Plus tard
  DocGen                           🟡         Extension
  Business-rule inversion          🟡         Extension
  Contract generation              🟡         Extension
  Auto-remediation                 🟡         Extension
  OPA                              🟡         Intégration future
  GDPR/ISO/SOC2                    🟡         Extension
  Financial risk matrix            ❌         Hors core
  LSP                              🟡         Extension
  Interactive canvas               🟡         Extension
  Neo4j                            🟡         Si besoin démontré
  Cross-stack API alignment        🟡         Après stabilisation du core
  Runtime traces                   🟡         Enrichissement ultérieur

# 📋 36. Backlog différé à ne pas oublier

  ----------------------------------------------------------------------------
  ID                Sujet              Pourquoi différé     Déclencheur
  ----------------- ------------------ -------------------- ------------------
  FUT-001           MCP                Indépendance du core Besoin d'outils
                                                            externes

  FUT-002           OpenTelemetry      Runtime non          Besoin de runtime
                                       nécessaire au MVP    evidence

  FUT-003           Fine-tuning        Dataset insuffisant  Findings validés
                                       au départ            en volume

  FUT-004           Distillation       Optimisation         Coût cloud réel
                                       prématurée           

  FUT-005           Multi-agent debate Complexité et        Gain mesuré de
                                       boucles opaques      validation
                                                            indépendante

  FUT-006           OPA                Gouvernance externe  Besoin CI/CD
                                       au core              enterprise

  FUT-007           GDPR/ISO/SOC2      Domaine distinct     Demande compliance

  FUT-008           Financial ROI      Risque de            Données
                                       spéculation          économiques
                                                            fiables

  FUT-009           Auto-remediation   Risque opérationnel  Validation robuste

  FUT-010           PR generation      Dépend de            Pipeline de
                                       l'auto-remediation   correction stable

  FUT-011           LSP                Produit              Besoin IDE
                                       d'intégration        
                                       différent            

  FUT-012           Canvas             Forte surface UI     Besoin
                                                            visualization

  FUT-013           Full DocGen        Ne doit pas          Audit stabilisé
                                       détourner le core    

  FUT-014           Business rules     Raisonnement         Besoin métier
                                       difficile à valider  

  FUT-015           Pact/MSW           Cross-stack plus     Frontend/backend
                                       tard                 multi-repo

  FUT-016           Neo4j              Infrastructure       Requêtes graph
                                       supplémentaire       trop complexes

  FUT-017           Rust runtime       Optimisation         Profilage
                                       prématurée           

  FUT-018           Java/Rust unified  Complexité élevée    IPC mesuré comme
                    runtime                                 bottleneck

  FUT-019           Runtime graph      Nécessite traces     OTel disponible

  FUT-020           Canvas write-back  Risque élevé         Remediation mature
  ----------------------------------------------------------------------------

# 🏁 37. Conclusion

La V3 conserve les meilleures idées de Gemini --- Tree-sitter, SCIP, AST
skeleton, Language Drivers, DAG incrémental, validation exécutable et
classification des données --- mais refuse de laisser ces extensions
dicter la structure du cœur.

Le produit est avant tout :

``` text
EVIDENCE-DRIVEN SOFTWARE ANALYSIS ENGINE
                     +
             OPTIONAL LLM REASONING
```

La règle d'or reste :

> **Le LLM n'est pas le moteur de l'audit. Il est un composant de
> raisonnement spécialisé, placé à l'intérieur d'un moteur d'analyse
> déterministe, traçable et piloté par les preuves.**


# 🔄 Annexe — Modifications validées après le dernier retour de Gemini

## ✅ Neo4j dès la Phase 1

Neo4j devient le backend de référence du Semantic Graph dès la première phase. Le graphe reste distinct de l’Evidence Store et du Finding Store :

- **Neo4j** : relations et chemins structurels ;
- **PostgreSQL** : métadonnées, preuves, conclusions, workflows et auditabilité ;
- **Evidence Store** : faits observés et éléments justificatifs ;
- **Finding Store** : conclusions validées.

Une abstraction `SemanticGraph` est conservée afin de ne pas propager les détails Cypher dans le Core.

## ✅ MCP comme frontière d’intégration

MCP est traité comme une capacité d’intégration de première classe, mais pas comme le modèle métier interne. Le contrat interne `Tool` est aligné avec les concepts MCP afin d’éviter une réécriture ultérieure.

## ✅ Cross-stack avancé en Phase 2

L’analyse Frontend → OpenAPI → Backend est avancée en Phase 2. Les contrôles déterministes comprennent notamment :

- méthode HTTP ;
- chemin et paramètres ;
- schémas de requête ;
- schémas de réponse ;
- exigences d’authentification ;
- endpoints dépréciés encore consommés ;
- changements incompatibles.

Le LLM reste réservé aux correspondances sémantiques ambiguës.

## ❌ Décisions toujours rejetées

Les éléments suivants restent hors du Core initial :

- débat multi-agent autonome ;
- réécriture Rust prématurée ;
- fine-tuning avant benchmark ;
- auto-remediation généralisée ;
- calcul de ROI financier ;
- Canvas comme dépendance du moteur.
