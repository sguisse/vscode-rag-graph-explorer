# 📘 User Guide — Phase 2 : Analyse Multi-Stack, Alignement Cross-Stack & Contrats API

Ce second volet du Guide d'Utilisation couvre les analyseurs multi-langages, la vérification des contrats d'interface (OpenAPI / Frontend DTOs), la validation des migrations BDD Liquibase et l'alignement de l'Infrastructure as Code (IaC) Terraform.

---

## 1. `TypeScriptComponentRule` (`TS-001`) — Mutation Directe de d'État & Prop Drilling (React / TSX)

### 📌 Description
L'analyseur `TS-001` vérifie l'AST des composants React/TypeScript. Il détecte la mutation directe de l'état (contournement de `setState` / `useState`) ainsi que le *prop drilling* excessif qui viole l'encapsulation et détériore les performances de rendu.

### ❌ Code Source en Erreur (`webview/src/features/user/UserProfile.tsx`)
```tsx
import React, { useState } from 'react';

interface UserData {
    id: string;
    name: string;
    roles: string[];
}

export const UserProfile: React.FC<{ initialUser: UserData }> = ({ initialUser }) => {
    const [user, setUser] = useState<UserData>(initialUser);

    const handleAddRole = (newRole: string) => {
        // ❌ VIOLATION TS-001 : Mutation directe de l'objet d'état sans utiliser setUser(...)
        user.roles.push(newRole);
        console.log("Updated roles:", user.roles);
    };

    return (
        <div className="user-profile">
            <h2>{user.name}</h2>
            <button onClick={() => handleAddRole('ADMIN')}>
                Add Admin Role
            </button>
        </div>
    );
};
```

### 📊 Résultat dans le Rapport d'Audit (`audit_observation` JSON)
```json
{
  "observationId": "obs-ts-001-8891",
  "ruleId": "TS-001",
  "category": "architecture/frontend",
  "severity": "HIGH",
  "status": "DETERMINISTIC_VERIFIED",
  "title": "Direct Component State Mutation Detected",
  "message": "Direct mutation of state property 'user.roles' in handleAddRole bypasses React re-render queue.",
  "location": {
    "filePath": "webview/src/features/user/UserProfile.tsx",
    "startLine": 13,
    "endLine": 13,
    "snippet": "user.roles.push(newRole);",
    "component": "UserProfile#handleAddRole"
  },
  "metadata": {
    "framework": "React 18",
    "astNodeType": "CallExpression",
    "mutationType": "ARRAY_MUTATING_METHOD_PUSH"
  },
  "remediation": {
    "summary": "Utilisez une mise à jour immuable avec le spreader array ou Immer.",
    "suggestedFix": "setUser(prev => ({ ...prev, roles: [...prev.roles, newRole] }));"
  }
}
```

---

## 2. `PythonAsyncRouteRule` (`PY-001`) — E/S Synchrones Bloquantes dans FastAPI

### 📌 Description
Dans FastAPI, déclarer un point d'entrée avec `async def` tout en exécutant des appels réseau/BDD synchrones bloquants (`requests.get`, `time.sleep`, drivers SQL synchrones) freeze le *event loop* de Node/Uvicorn pour l'ensemble des requêtes concurrentes.

### ❌ Code Source en Erreur (`services/payment_gateway/app/routers/payment.py`)
```python
from fastapi import APIRouter, HTTPException
import requests  # ❌ VIOLATION PY-001 : Bibliothèque HTTP synchrone bloquante
import time

router = APIRouter()

@router.post("/process-payment")
async def process_payment(amount: float, currency: str):
    # ❌ VIOLATION PY-001 : time.sleep bloquant dans une coroutine async
    time.sleep(2)
    
    # ❌ VIOLATION PY-001 : requests.post synchrone bloquant dans l'event loop
    response = requests.post("https://api.stripe.com/v1/charges", data={"amount": amount})
    
    if response.status_code != 200:
        raise HTTPException(status_code=400, detail="Payment failed")
    
    return {"status": "SUCCESS", "charge_id": response.json().get("id")}
```

### 📊 Résultat dans le Rapport SARIF 2.1.0 (`audit-report.sarif`)
```json
{
  "ruleId": "PY-001",
  "level": "error",
  "message": {
    "text": "Blocking synchronous I/O call 'requests.post' and 'time.sleep' executed inside async route handler 'process_payment'."
  },
  "locations": [
    {
      "physicalLocation": {
        "artifactLocation": {
          "uri": "services/payment_gateway/app/routers/payment.py"
        },
        "region": {
          "startLine": 12,
          "startColumn": 16,
          "endLine": 12,
          "endColumn": 86
        }
      }
    }
  ],
  "properties": {
    "eventLoopFreezeRisk": "CRITICAL",
    "recommendedAsyncAlternative": "httpx.AsyncClient & asyncio.sleep"
  }
}
```

---

## 3. `CrossStackContractDriftRule` (`API-011`) — Dérive entre OpenAPI Spec & DTO Frontend

### 📌 Description
Cet analyseur croise l'AST des définitions d'interfaces TypeScript frontend avec la spécification OpenAPI (`openapi.yaml`) pour détecter les types incompatibles, les champs manquants ou les renommages qui provoquent des erreurs au runtime (`undefined` / `null pointer`).

### ❌ Fichiers de Contrat & Code Frontend en Incohérence
**Spécification OpenAPI (`api-docs/openapi.yaml`) :**
```yaml
/api/v1/customers/{id}:
  get:
    responses:
      '200':
        content:
          application/json:
            schema:
              type: object
              required: [customerId, emailAddress]
              properties:
                customerId:
                  type: string
                emailAddress:
                  type: string
```

**Interface DTO Frontend TypeScript (`webview/src/api/customerDto.ts`) :**
```typescript
// ❌ VIOLATION API-011 : Attribut 'id' au lieu de 'customerId' + 'email' au lieu de 'emailAddress'
export interface CustomerResponse {
    id: string;          // ❌ Mismatch avec openapi.yaml ('customerId')
    email: string;       // ❌ Mismatch avec openapi.yaml ('emailAddress')
}
```

### 📊 Résultat dans le Rapport d'Audit (`audit_observation` JSON)
```json
{
  "observationId": "obs-api-011-3012",
  "ruleId": "API-011",
  "category": "architecture/cross-stack-lineage",
  "severity": "CRITICAL",
  "status": "DETERMINISTIC_VERIFIED",
  "title": "Cross-Stack OpenAPI Contract Drift",
  "message": "TypeScript interface 'CustomerResponse' diverges from OpenAPI endpoint '/api/v1/customers/{id}' schema [Missing required fields: customerId, emailAddress].",
  "location": {
    "filePath": "webview/src/api/customerDto.ts",
    "startLine": 2,
    "endLine": 5,
    "component": "CustomerResponse"
  },
  "metadata": {
    "openApiSpec": "api-docs/openapi.yaml",
    "missingFieldsInFrontend": ["customerId", "emailAddress"],
    "orphanFieldsInFrontend": ["id", "email"]
  },
  "remediation": {
    "suggestedFix": "Aligner les propriétés du DTO TypeScript sur le contrat OpenAPI ou régénérer la couche API via openapi-generator."
  }
}
```

---

## 4. `LiquibaseSchemaRule` (`DB-002`) — Migration BDD Non Sécurisée & Clé Étrangère sans Index

### 📌 Description
Inspecte les changelogs Liquibase / SQL DDL. Il bloque la suppression directe de colonnes en production sans phase de déprétation préalable, et exige la création d'un index explicite sur chaque colonne possédant une contrainte de clé étrangère (`foreignKeyConstraint`).

### ❌ Changelog Liquibase en Erreur (`modules/db/src/main/resources/db/changelog/db.changelog-v1.2.xml`)
```xml
<?xml version="1.0" encoding="UTF-8"?>
<databaseChangeLog xmlns="http://www.liquibase.org/xml/ns/dbchangelog">
    <changeSet id="20260925-01" author="developer">
        <createTable tableName="orders">
            <column name="id" type="VARCHAR(36)"><constraints primaryKey="true"/></column>
            <!-- ❌ VIOLATION DB-002 : Foreign key créée sans index dédié sur customer_id -->
            <column name="customer_id" type="VARCHAR(36)">
                <constraints foreignKeyName="fk_orders_customer" references="customers(id)"/>
            </column>
        </createTable>

        <!-- ❌ VIOLATION DB-002 : Suppression destructive immédiate de colonne en production -->
        <dropColumn tableName="users" columnName="legacy_password_hash"/>
    </changeSet>
</databaseChangeLog>
```

### 📊 Résultat dans le Rapport d'Audit (`audit_observation` JSON)
```json
{
  "observationId": "obs-db-002-9912",
  "ruleId": "DB-002",
  "category": "database/migration",
  "severity": "HIGH",
  "status": "DETERMINISTIC_VERIFIED",
  "title": "Unindexed Foreign Key & Unsafe Column Drop",
  "message": "Changelog 20260925-01 creates foreign key 'fk_orders_customer' on 'orders.customer_id' without an index, and performs unsafe dropColumn 'users.legacy_password_hash'.",
  "location": {
    "filePath": "modules/db/src/main/resources/db/changelog/db.changelog-v1.2.xml",
    "startLine": 7,
    "endLine": 14,
    "component": "changeSet:20260925-01"
  },
  "metadata": {
    "table": "orders",
    "foreignKeyColumn": "customer_id",
    "missingIndexName": "idx_orders_customer_id"
  },
  "remediation": {
    "suggestedFix": "Ajoutez un changeSet <createIndex indexName="idx_orders_customer_id" tableName="orders"><column name="customer_id"/></createIndex> et remplacez dropColumn par une étape de déprétation."
  }
}
```

---

## 5. `TerraformIacRule` (`IAC-001`) — S3 Non Chiffré & Groupe de Sécurité Ouvert (IaC)

### 📌 Description
L'analyseur `IAC-001` vérifie les fichiers Terraform (`.tf`). Il garantit que les ressources de stockage cloud (AWS S3, GCP Buckets) activent le chiffrement SSE et l'accès privé, et interdit les règles Ingress totalement ouvertes (`0.0.0.0/0`) sur les ports d'administration (SSH 22, RDP 3389, DB 5432).

### ❌ Configuration Terraform en Erreur (`terraform/modules/storage/main.tf`)
```hcl
resource "aws_s3_bucket" "audit_evidence_store" {
  bucket = "company-audit-evidence-production"
  # ❌ VIOLATION IAC-001 : Absence de server_side_encryption_configuration
}

resource "aws_security_group" "db_sg" {
  name        = "database-security-group"
  description = "Security group for PostgreSQL DB"

  ingress {
    from_port   = 5432
    to_port     = 5432
    protocol    = "tcp"
    # ❌ VIOLATION IAC-001 : Entrée PostgreSQL ouverte sur tout Internet
    cidr_blocks = ["0.0.0.0/0"]
  }
}
```

### 📊 Résultat dans le Rapport SARIF 2.1.0 (`audit-report.sarif`)
```json
{
  "ruleId": "IAC-001",
  "level": "error",
  "message": {
    "text": "Critical IaC Misconfiguration: S3 bucket 'company-audit-evidence-production' missing SSE encryption, and SG 'database-security-group' allows 0.0.0.0/0 on port 5432."
  },
  "locations": [
    {
      "physicalLocation": {
        "artifactLocation": {
          "uri": "terraform/modules/storage/main.tf"
        },
        "region": {
          "startLine": 1,
          "endLine": 16
        }
      }
    }
  ],
  "properties": {
    "complianceFrameworks": ["CIS AWS Foundations Benchmark", "ISO 27001 A.10.1.1"],
    "riskImpact": "Exposition publique de données sensibles BDD & risque de fuite cloud"
  }
}
```

---

💡 **Les livrables Phase 1 et Phase 2 sont désormais tous deux publiés et consultables dans votre panneau Studio.**
