# 🕸️ Graph RAG Explorer - Core Architecture Blueprint

This document details the decoupled, production-grade architecture of the **Graph RAG Explorer** workbench. The system cleanly divides environment safety validation (`install`) from the parallelized data ingestion engine (`analyser`), using **jQAssistant with an embedded Neo4j server instance** as the primary backend orchestration driver.

## 📊 Global System Flowchart

```mermaid
graph TD
    %% Subgraph Styling
    style CoreB fill:#FFF2CC,stroke:#D6B656,stroke-width:2px
    style InstallB fill:#D5E8D4,stroke:#82B366,stroke-width:2px
    style InitB fill:#CEE5F2,stroke:#4A90E2,stroke-width:2px
    style AnalyserB fill:#F8CECC,stroke:#B85450,stroke-width:2px
    style StorageB fill:#E1D5E7,stroke:#9673A6,stroke-width:2px
    style OutputB fill:#DAE8FC,stroke:#6C8EBF,stroke-width:2px

    subgraph CoreB [Phase 1: Environment Provisioning & Validation]
        M[main.py: Super Orchestrator] -->|Triggers Checks| IR[install/runner.py]
        IR -->|Executes Sequentially| IM{Install Registry}
        IM -->|Verify via check.py| SysC[system/core/check.py]
        IM -->|Setup via install.py| NodeI[node/swc/install.py]
        IM -->|Persists State| RH[report_handler.py]
        RH -->|Writes Metrics| FS[final-status.json]
    end

    subgraph InitB [Phase 2: New Isolated Initialization Block]
        FS -->|Triggers Sequential Init| INR[initialization/runner.py]
        INR -->|Scans Workspace Perimeter| DE[initialization/discovery_engine.py]
        DE -->|Generates Perimeter JSON| DM[discovery_manifest.json]
        INR -->|Boots Local DB Sandboxed| N4JI[system/neo4j/install.py]
    end

    subgraph AnalyserB [Phase 3: Graph ETL Ingestion Engine]
        N4JI -->|If DB Active & Active Perimeter Locked| AR[analyser/runner.py]
        AR -->|Distributes Parallel Tasks| AM{Analyser Registry}
        AM -->|Parallel Workers| JqaW[java/jqassistant/worker.py]
        AM -->|Parallel Workers| PyW[python/graphify/worker.py]
        AM -->|Parallel Workers| DocW[documentation/doc_linker/worker.py]
    end

    subgraph StorageB [Graph Federation & Central Repository]
        JqaW -->|Populates Local Instance| EMB_N4J[(jQAssistant Embedded Neo4j Hub)]
        PyW -->|Transactions Bolt/Cypher| NC[neo4j_client.py]
        DocW -->|Transactions Bolt/Cypher| NC
        NC <--> EMB_N4J
        QR[queries/reconciliation.cypher] -->|Cross-Language Stitching| EMB_N4J
        QC[queries/coverage.cypher] -->|JaCoCo Coverage Mapping| EMB_N4J
    end

    subgraph OutputB [Phase 4: Context Pack Construction & UI Renders]
        EMB_N4J -->|Cypher Extraction Queries| UE[core/ui_extractor.py]
        UE -->|Generates Consolidated Payload| UIP[graph-ui-payload.json]
        UIP -->|Instant Binding| Tree[IHM Tree View Structure]
        UIP -->|Instant Binding| Cyto[Cytoscape Node Topology Graph]
    end
```
