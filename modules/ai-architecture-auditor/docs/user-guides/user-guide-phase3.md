# 📘 Guide d'Utilisation — Phase 3 : Cybersécurité, Analyse VEX (CVE Reachability) & Gouvernance OPA Rego

Ce document constitue le troisième volet du guide d'utilisation de la plateforme **Evidence-Driven AI Software Architecture Auditor**. Il détaille les moteurs de sécurité avancée, d'analyse d'atteignabilité des vulnérabilités (VEX), d'anonymisation Zero-Trust pour le triage LLM, d'audit cryptographique Post-Quantique (PQC) et d'évaluation des politiques de gouvernance OPA Rego.

---

## 📋 Table des Matières
1. [VexReachabilityAnalyzer (SEC-001 — CVE Reachability & VEX Export)](#1-vexreachabilityanalyzer-sec-001--cve-reachability--vex-export)
2. [ZeroTrustAnonymizer (SEC-002 — Zero-Trust Code Anonymization & PII Masking)](#2-zerotrustanonymizer-sec-002--zero-trust-code-anonymization--pii-masking)
3. [OpaPolicyEvaluator (GOV-001 — OPA Rego CI/CD Governance Gate)](#3-opapolicyevaluator-gov-001--opa-rego-cicd-governance-gate)
4. [PqcMigrationAuditor (PQC-001 — Post-Quantum Cryptography Audit)](#4-pqcmigrationauditor-pqc-001--post-quantum-cryptography-audit)
5. [MitreAttackGraphMapper (SEC-003 — Automated MITRE ATT&CK Code Mapping)](#5-mitreattackgraphmapper-sec-003--automated-mitre-attck-code-mapping)

---

## 1. VexReachabilityAnalyzer (`SEC-001` — CVE Reachability & VEX Export)

### 🎯 Rôle & Détection
L'analyseur **`VexReachabilityAnalyzer`** croise les vulnérabilités publiques de vos dépendances (SCA / CVE) avec le graphe d'appel réel (Call Graph AST) dans Neo4j. Il détermine si les méthodes vulnérables de la bibliothèque tierce sont effectivement **atteignables** (`AFFECTED`) ou **non atteignables** (`NOT_AFFECTED`) par votre code applicatif, et génère un document **OpenVEX** pour supprimer les faux positifs.

### ❌ Exemple Concret de Code en Erreur (Atteignabilité CVE)

Dans le fichier `pom.xml`, une version vulnérable de Jackson Databind est déclarée :
```xml
<!-- pom.xml -->
<dependency>
    <groupId>com.fasterxml.jackson.core</groupId>
    <artifactId>jackson-databind</artifactId>
    <version>2.9.8</version> <!-- Vulnérable à CVE-2019-12384 (Polymorphic Deserialization) -->
</dependency>
```

Dans le code applicatif `UserDataDeserializer.java`, la méthode vulnérable `enableDefaultTyping()` est directement invoquée :
```java
// UserDataDeserializer.java
package com.company.auditor.service;

import com.fasterxml.jackson.databind.ObjectMapper;

public class UserDataDeserializer {

    private final ObjectMapper objectMapper = new ObjectMapper();

    public Object deserializePayload(String rawJson) throws Exception {
        // VIOLATION SEC-001: Appel direct à la méthode vulnérable de Jackson Databind (CVE-2019-12384)
        objectMapper.enableDefaultTyping(); 
        return objectMapper.readValue(rawJson, Object.class);
    }
}
```

### 📄 Résultat dans le Rapport (`vex-report.json`)

```json
{
  "version": "4.0",
  "ruleId": "SEC-001",
  "component": "com.company.auditor.service.UserDataDeserializer",
  "cveId": "CVE-2019-12384",
  "reachabilityStatus": "REACHABLE_AFFECTED",
  "callPathTrace": [
    "com.company.auditor.service.UserDataDeserializer#deserializePayload(String)",
    "com.fasterxml.jackson.databind.ObjectMapper#enableDefaultTyping()"
  ],
  "openVexStatement": {
    "@context": "https://openvex.dev/ns/v1",
    "author": "Evidence-Driven AI Software Architecture Auditor",
    "timestamp": "2026-09-25T08:50:00Z",
    "statements": [
      {
        "vulnerability": "CVE-2019-12384",
        "products": [
          "pkg:maven/com.company.auditor/ai-architecture-auditor@4.2.0"
        ],
        "status": "affected",
        "justification": "code_executes_vulnerable_method",
        "impact_statement": "The method ObjectMapper.enableDefaultTyping() is directly invoked on line 13 of UserDataDeserializer.java."
      }
    ]
  }
}
```

---

## 2. ZeroTrustAnonymizer (`SEC-002` — Zero-Trust Code Anonymization & PII Masking)

### 🎯 Rôle & Détection
Le composant **`ZeroTrustAnonymizer`** s'interpose avant d'envoyer tout snippet de code ou nom de symbole vers un LLM externe lors du triage IA. Il anonymise de manière déterministe les identifiants propriétaires, secrets, clés API et noms de domaines métier (`CustomerService` $\rightarrow$ `Service_A`, `jdbc:postgresql://prod-db...` $\rightarrow$ `DB_ENDPOINT_1`) tout en conservant une table de correspondance inversible en mémoire locale.

### ❌ Exemple Concret de Code Contenant des Données Sensibles

```java
// PaymentGatewayConfig.java
package com.company.auditor.config;

import org.springframework.context.annotation.Configuration;

@Configuration
public class PaymentGatewayConfig {

    // VIOLATION SEC-002: Secret durci et URL interne de production susceptibles d'être fuités au LLM
    private static final String API_SECRET_KEY = "sk_live_99x81a7b2c3d4e5f6g7h8i9j0";
    private static final String INTERNAL_PROD_ENDPOINT = "https://internal-payments.eu-west-1.dkt.priv/v1/charge";

    public String getEndpoint() {
        return INTERNAL_PROD_ENDPOINT;
    }
}
```

### 📄 Résultat dans le Rapport / Prompt Anonymisé (Entrée LLM Sandbox)

```json
{
  "ruleId": "SEC-002",
  "anonymizationSummary": {
    "tokensMaskedCount": 2,
    "piiTypesDetected": ["API_KEY_SECRET", "INTERNAL_FQDN"],
    "anonymizationMapId": "anon-map-8f912a7"
  },
  "anonymizedCodeSnippet": "package com.anon.config;

public class PaymentGatewayConfig {

    private static final String API_SECRET_KEY = "[MASKED_SECRET_KEY_1]";
    private static final String INTERNAL_PROD_ENDPOINT = "https://[MASKED_INTERNAL_DOMAIN]/v1/charge";

    public String getEndpoint() {
        return INTERNAL_PROD_ENDPOINT;
    }
}"
}
```

---

## 3. OpaPolicyEvaluator (`GOV-001` — OPA Rego CI/CD Governance Gate)

### 🎯 Rôle & Détection
Le composant **`OpaPolicyEvaluator`** évalue le rapport d'audit final contre les politiques d'entreprise définies en langage **OPA Rego** (`policy.rego`). Il détermine de manière déterministe si la build CI/CD doit être **autorisée** (`allow = true`) ou **bloquée** (`deny`) en fonction du nombre et de la sévérité des violations d'architecture et de sécurité.

### ❌ Exemple Concret de Politique Rego & Violation Enfrinte

Politique OPA d'entreprise (`.auditor/policy.rego`) :
```rego
package architecture.governance

default allow = false

# Bloquer si une violation d'isolation hexagonale (HEX-001) de sévérité HIGH est présente
deny[msg] {
    some i
    input.findings[i].ruleId == "HEX-001"
    input.findings[i].severity == "HIGH"
    msg := sprintf("GOUVERNANCE BLOQUÉE: Violation d'isolation hexagonale détectée dans le composant %s", [input.findings[i].component])
}

allow {
    count(deny) == 0
}
```

### 📄 Résultat de la Décision OPA (`opa-evaluation-result.json`)

```json
{
  "ruleId": "GOV-001",
  "policyFileEvaluated": ".auditor/policy.rego",
  "evaluationDecision": "REJECTED_BUILD_BLOCKED",
  "allow": false,
  "denialReasons": [
    "GOUVERNANCE BLOQUÉE: Violation d'isolation hexagonale détectée dans le composant com.company.auditor.domain.OrderEntity"
  ],
  "exitCode": 1,
  "summary": {
    "totalFindingsEvaluated": 12,
    "blockingFindingsCount": 1
  }
}
```

---

## 4. PqcMigrationAuditor (`PQC-001` — Post-Quantum Cryptography Audit)

### 🎯 Rôle & Détection
Le moteur **`PqcMigrationAuditor`** inspecte l'AST à la recherche d'algorithmes cryptographiques classiques rendus vulnérables par l'avènement de l'informatique quantique (RSA, ECDSA, Diffie-Hellman, SHA-1, AES-128). Il identifie les lignes de code incriminées et suggère la migration vers les standards **NIST PQC** (ML-KEM / Kyber, ML-DSA / Dilithium).

### ❌ Exemple Concret de Code en Erreur (Crypto Classique Vulnerable)

```java
// SecurityTokenService.java
package com.company.auditor.security;

import java.security.KeyPairGenerator;
import java.security.NoSuchAlgorithmException;

public class SecurityTokenService {

    public void generateKeyPair() throws NoSuchAlgorithmException {
        // VIOLATION PQC-001: Utilisation de RSA-2048 non résistant aux ordinateurs quantiques
        KeyPairGenerator keyPairGen = KeyPairGenerator.getInstance("RSA");
        keyPairGen.initialize(2048);
        keyPairGen.generateKeyPair();
    }
}
```

### 📄 Résultat dans le Rapport SARIF (`pqc-sarif.json`)

```json
{
  "ruleId": "PQC-001",
  "level": "error",
  "message": {
    "text": "Algorithme cryptographique classique non-PQC détecté: RSA-2048. Migrer vers le standard NIST ML-DSA / Dilithium ou ML-KEM / Kyber."
  },
  "locations": [
    {
      "physicalLocation": {
        "artifactLocation": {
          "uri": "src/main/java/com/company/auditor/security/SecurityTokenService.java"
        },
        "region": {
          "startLine": 10,
          "startColumn": 9,
          "snippet": {
            "text": "KeyPairGenerator keyPairGen = KeyPairGenerator.getInstance("RSA");"
          }
        }
      }
    }
  ],
  "properties": {
    "quantumVulnerabilityLevel": "CRITICAL_BREAKABLE_BY_SHOR_ALGORITHM",
    "recommendedPqcReplacement": "ML-KEM-768 / Kyber (FIPS 203) or ML-DSA-65 / Dilithium (FIPS 204)"
  }
}
```

---

## 5. MitreAttackGraphMapper (`SEC-003` — Automated MITRE ATT&CK Code Mapping)

### 🎯 Rôle & Détection
Le composant **`MitreAttackGraphMapper`** analyse les points d'entrée (APIs HTTP, consumers Kafka) et les exécutions de commandes système ou d'appels réflexifs dans le code source pour mapper automatiquement les vulnérabilités identifiées aux techniques du référentiel **MITRE ATT&CK** dans Neo4j.

### ❌ Exemple Concret de Code en Erreur (Exécution de Commande Système)

```java
// SystemUtility.java
package com.company.auditor.util;

import java.io.IOException;

public class SystemUtility {

    public void executeUserCommand(String userInput) throws IOException {
        // VIOLATION SEC-003: Passage direct d'une entrée utilisateur non assainie à un interpréteur de commandes
        Runtime.getRuntime().exec("sh -c " + userInput);
    }
}
```

### 📄 Résultat dans le Rapport (`mitre-attack-report.json`)

```json
{
  "ruleId": "SEC-003",
  "mitreTechniqueId": "T1059.004",
  "mitreTactic": "Execution",
  "techniqueName": "Command and Scripting Interpreter: Unix Shell",
  "vulnerabilitySummary": "Unsanitized user input passed directly to Runtime.getRuntime().exec() maps to MITRE ATT&CK technique T1059.004",
  "location": {
    "filePath": "src/main/java/com/company/auditor/util/SystemUtility.java",
    "line": 9,
    "method": "executeUserCommand(String)"
  },
  "graphMutationStatus": "LINKED_TO_NEO4J_MITRE_NODE"
}
```
