#!/usr/bin/env bash
set -e

STATS_FILE="scripts/graph_rag_explorer/analyser/tools/neo4j/neo4j_statistics_extractor.py"

if [ ! -f "$STATS_FILE" ]; then
    STATS_FILE="/Users/mac-SGUISS21/01-work/01-projects/10-tools/01-plugins/01-vscode/vscode-rag-graph-explorer/scripts/graph_rag_explorer/analyser/tools/neo4j/neo4j_statistics_extractor.py"
fi

mkdir -p "$(dirname "$STATS_FILE")"

cat << 'EOF' > "$STATS_FILE"
import os
import json
from core.utils import info, success, error, debug
from core.context import EnvironmentContext
from install.modules.system.neo4j.context import Neo4jContext

def build_statistics(neo4j_client, workspace_root: str):
    """
    Executes a comprehensive statistics matrix based on check_graph.py metrics,
    utilizing a custom structural loop architecture configuration format.
    """
    info("Extracting Neo4j advanced architectural matrix statistics...", component="StatisticsExtractor")

    env_context = EnvironmentContext()
    neo4j_ctx = Neo4jContext(env_context)
    stats_target_dir = neo4j_ctx.sandbox_root
    os.makedirs(stats_target_dir, exist_ok=True)
    stats_file = os.path.join(stats_target_dir, "statistics.json")

    # Reconfigured matrix adapting renamed parameter metrics keys and variable array looping nodes
    queries_matrix = {
        "Back-End": {
            "Java Type Analysis": [
                {"scope": "Count of Java Classes", "query": "MATCH (c:Java:Type:Class) RETURN count(c) AS n", "config": []},
                {"scope": "Count of Java Interfaces", "query": "MATCH (t:Java:Type:Interface) RETURN count(t) AS n", "config": []},
                {"scope": "Count of Java Enums", "query": "MATCH (t:Java:Type:Enum) RETURN count(t) AS n", "config": []},
                {"scope": "Count of Abstract Classes", "query": "MATCH (c:Java:Type:Class) WHERE c.abstract = true RETURN count(c) AS n", "config": []},
                {"scope": "Count of Annotation Types", "query": "MATCH (t:Java:Type:Annotation) RETURN count(t) AS n", "config": []},
                {"scope": "Count of Methods", "query": "MATCH (m:Method) RETURN count(m) AS n", "config": []},
                {"scope": "Count of Fields", "query": "MATCH (f:Field) RETURN count(f) AS n", "config": []},
                {"scope": "Count of Packages", "query": "MATCH (p:Package) RETURN count(p) AS n", "config": []},
                {"scope": "Count of SourceFiles (.java)", "query": "MATCH (f:File) WHERE f.absolute_path ENDS WITH '.java' RETURN count(f) AS n", "config": []}
            ],
            "Java Relationship Metrics": [
                {"scope": "EXTENDS Relationships", "query": "MATCH ()-[r:EXTENDS]->() RETURN count(r) AS n", "config": []},
                {"scope": "IMPLEMENTS Relationships", "query": "MATCH ()-[r:IMPLEMENTS]->() RETURN count(r) AS n", "config": []},
                {"scope": "ANNOTATED_BY Relationships", "query": "MATCH ()-[r:ANNOTATED_BY]->() RETURN count(r) AS n", "config": []},
                {"scope": "INVOKES Relationships", "query": "MATCH ()-[r:INVOKES]->() RETURN count(r) AS n", "config": []},
                {"scope": "HAS_SOURCE_FILE Relationships", "query": "MATCH ()-[r:HAS_SOURCE_FILE]->() RETURN count(r) AS n", "config": []}
            ],
            "Spring Stereotype Labels": [
                {
                    "scope": "Spring Stereotype Presence for Label: {label}",
                    "query": "MATCH (c:{label}) RETURN count(c) AS n",
                    "config": [
                        {"label": "Controller", "hint": "@RestController / @Controller"},
                        {"label": "Service", "hint": "@Service"},
                        {"label": "Repository", "hint": "@Repository"}
                    ]
                }
            ],
            "Spring Stereotype Annotations": [
                {
                    "scope": "Detection of Spring Class Annotation: {display}",
                    "query": "MATCH (c:Class)-[:ANNOTATED_BY]->()-[:OF_TYPE]->(t:Type) WHERE t.fqn = '{fqn}' RETURN count(DISTINCT c) AS n",
                    "config": [
                        {"display": "@Component", "fqn": "org.springframework.stereotype.Component"},
                        {"display": "@Configuration", "fqn": "org.springframework.context.annotation.Configuration"},
                        {"display": "@SpringBootApplication", "fqn": "org.springframework.boot.autoconfigure.SpringBootApplication"},
                        {"display": "@Aspect (AOP)", "fqn": "org.aspectj.lang.annotation.Aspect"}
                    ]
                },
                {
                    "scope": "Detection of Spring Method Annotation: {display}",
                    "query": "MATCH (c:Method)-[:ANNOTATED_BY]->()-[:OF_TYPE]->(t:Type) WHERE t.fqn = '{fqn}' RETURN count(DISTINCT c) AS n",
                    "config": [
                        {"display": "@EventListener", "fqn": "org.springframework.context.event.EventListener"},
                        {"display": "@Scheduled", "fqn": "org.springframework.scheduling.annotation.Scheduled"},
                        {"display": "@Transactional", "fqn": "org.springframework.transaction.annotation.Transactional"},
                        {"display": "@ExceptionHandler", "fqn": "org.springframework.web.bind.annotation.ExceptionHandler"}
                    ]
                }
            ],
            "Additional Spring Stereotypes": [
                {
                    "scope": "Detection of cross-project generic class annotation: {display}",
                    "query": "MATCH (c:Class)-[:ANNOTATED_BY]->()-[:OF_TYPE]->(t:Type) WHERE t.fqn = '{fqn}' RETURN count(DISTINCT c) AS n",
                    "config": [
                        {"display": "@RestControllerAdvice", "fqn": "org.springframework.web.bind.annotation.RestControllerAdvice"},
                        {"display": "@ControllerAdvice", "fqn": "org.springframework.web.bind.annotation.ControllerAdvice"},
                        {"display": "@FeignClient", "fqn": "org.springframework.cloud.openfeign.FeignClient"},
                        {"display": "@KafkaListener", "fqn": "org.springframework.kafka.annotation.KafkaListener"},
                        {"display": "@RabbitListener", "fqn": "org.springframework.amqp.rabbit.annotation.RabbitListener"},
                        {"display": "@ConfigurationProperties", "fqn": "org.springframework.boot.context.properties.ConfigurationProperties"},
                        {"display": "@Profile", "fqn": "org.springframework.context.annotation.Profile"}
                    ]
                }
            ],
            "Lombok Annotations": [
                {
                    "scope": "Lombok Annotation Usage layout: {display}",
                    "query": "MATCH (c:Class)-[:ANNOTATED_BY]->()-[:OF_TYPE]->(t:Type) WHERE t.fqn = '{fqn}' RETURN count(DISTINCT c) AS n",
                    "config": [
                        {"display": "@Data", "fqn": "lombok.Data"},
                        {"display": "@Builder", "fqn": "lombok.Builder"},
                        {"display": "@NoArgsConstructor", "fqn": "lombok.NoArgsConstructor"},
                        {"display": "@Slf4j", "fqn": "lombok.extern.slf4j.Slf4j"}
                    ]
                }
            ],
            "Code Smell Indicators": [
                {"scope": "Classes with no declared methods", "query": "MATCH (c:Class) WHERE NOT (c)-[:DECLARES]->(:Method) AND NOT c:Enum AND NOT c:Annotation RETURN count(c) AS n", "config": []},
                {"scope": "Methods never invoked (potential dead code)", "query": "MATCH (m:Method) WHERE NOT ()-[:INVOKES]->(m) AND NOT m.name IN ['main', '<init>', '<clinit>'] RETURN count(m) AS n", "config": []},
                {"scope": "Inner / Nested Class structures", "query": "MATCH (outer:Class)-[:DECLARES]->(inner:Class) RETURN count(inner) AS n", "config": []},
                {"scope": "God-Class architectural components (>20 dependencies)", "query": "MATCH (c:Class)-[:DEPENDS_ON]->(dep:Type) WITH c, count(dep) AS deps WHERE deps > 20 RETURN count(c) AS n", "config": []}
            ],
            "Architecture Layer Rules": [
                {
                    "scope": "Layer Label node tracking validation: {label}",
                    "query": "MATCH (c:{label}) RETURN count(c) AS n",
                    "config": [
                        {"label": "ApiLayer"},
                        {"label": "DomainLayer"},
                        {"label": "InfrastructureLayer"}
                    ]
                },
                {
                    "scope": "Package Layer Match Suffix: {display}",
                    "query": "MATCH (p:Package)-[:CONTAINS]->(c:Class) WHERE p.fqn ENDS WITH '{suffix}' RETURN count(DISTINCT c) AS n",
                    "config": [
                        {"display": "application layer", "suffix": ".application"},
                        {"display": "config / configuration", "suffix": ".config"},
                        {"display": "DTO / model", "suffix": ".dto"},
                        {"display": "mapper / adapter", "suffix": ".mapper"},
                        {"display": "exception / handler", "suffix": ".exception"},
                        {"display": "util / helper", "suffix": ".util"}
                    ]
                }
            ],
            "Architecture Constraint Violations": [
                {"scope": "Controller directly bypassing Service layer to Repository", "query": "MATCH (ctrl:Controller)-[:DEPENDS_ON]->(repo:Repository) RETURN count(*) AS n", "config": []},
                {"scope": "Domain Layer illegally depending on Infrastructure Layer", "query": "MATCH (d:DomainLayer)-[:DEPENDS_ON]->(i:InfrastructureLayer) RETURN count(*) AS n", "config": []},
                {"scope": "API Layer illegally depending on Infrastructure Layer", "query": "MATCH (a:ApiLayer)-[:DEPENDS_ON]->(i:InfrastructureLayer) RETURN count(*) AS n", "config": []}
            ]
        },
        "Front-End": {
            "TypeScript/JavaScript File Inventory": [
                {"scope": "Total Web/Node Module Files Count", "query": "MATCH (f:File:Node) RETURN count(f) AS n", "config": []}
            ]
        },
        "Data & Scripting": {
            "Python File Inventory": [
                {"scope": "Total Python Backend Automation Files Count", "query": "MATCH (f:File:Python) RETURN count(f) AS n", "config": []}
            ]
        },
        "Documentation": {
            "Markdown Note Inventory": [
                {"scope": "Total Cross-Linked Markdown Documentation Documents Count", "query": "MATCH (d:Document) WHERE d.type = 'markdown' RETURN count(d) AS n", "config": []}
            ]
        },
        "Graph Topology & State": {
            "Nodes & Edges": [
                {"scope": "Global Total Node Entities Count", "query": "MATCH (n) RETURN count(n) AS n", "config": []},
                {"scope": "Global Total Structural Relationship Lines Count", "query": "MATCH ()-[r]->() RETURN count(r) AS n", "config": []}
            ],
            "Enrichment & Metrics State": [
                {"scope": "RAG Enrichment Node Entities Count", "query": "MATCH (n:Entity) RETURN count(n) AS n", "config": []},
                {"scope": "Summary Embeddings Vector Layout Node Count", "query": "MATCH (n) WHERE n.summaryEmbedding IS NOT NULL RETURN count(n) AS n", "config": []},
                {"scope": "Method Analysis Metadata processing Count", "query": "MATCH (m:Method) WHERE m.code_analysis IS NOT NULL RETURN count(m) AS n", "config": []}
            ]
        },
        "NEO4J db schema": {
            "Database Metadata": [
                {
                    "scope": "Total Distinct Node Labels (Existing concepts)",
                    "query": "CALL db.labels() YIELD label RETURN count(label) AS n",
                    "config": []
                },
                {
                    "scope": "Total Distinct Relationship Types (Existing relationship types)",
                    "query": "CALL db.relationshipTypes() YIELD relationshipType RETURN count(relationshipType) AS n",
                    "config": []
                },
                {
                    "scope": "Total Distinct Property Keys (Existing property keys)",
                    "query": "CALL db.propertyKeys() YIELD propertyKey RETURN count(propertyKey) AS n",
                    "config": []
                }
            ]
        }
    }

    report = {}

    if not (hasattr(neo4j_client, 'driver') and neo4j_client._connected):
        error("Cannot extract statistics: Neo4j client is disconnected or unreachable.", component="StatisticsExtractor")
        return

    try:
        with neo4j_client.driver.session() as session:

            diag = session.run("MATCH (n) RETURN count(n) as total").single()
            info(f"Diagnostic Check - Total Nodes found by Python driver: {diag.data().get('total', 0)}", component="StatisticsExtractor")

            for category, subcategories in queries_matrix.items():
                report[category] = {}
                for subcat, entries in subcategories.items():
                    report[category][subcat] = []
                    for entry in entries:
                        scope_tmpl = entry["scope"]
                        query_tmpl = entry["query"]
                        loops = entry.get("config", [])

                        if not loops:
                            try:
                                run_res = session.run(query_tmpl).single()
                                dict_res = run_res.data() if run_res else None
                                debug(f"Returned object for '{scope_tmpl}': {run_res} | Data dict: {dict_res}", component="StatisticsExtractor")

                                result_val = dict_res.get("n", 0) if dict_res else 0
                                status_val = "✅" if result_val > 0 else "⚠️"
                                message_val = f"Found {result_val} elements." if result_val > 0 else "No tracking elements recorded."
                            except Exception as ex:
                                result_val = 0
                                status_val = "❌"
                                message_val = f"Query matching block failed: {ex}"

                            report[category][subcat].append({
                                "scope": scope_tmpl,
                                "query": query_tmpl,
                                "result": result_val,
                                "status": status_val,
                                "message": message_val
                            })
                        else:
                            for item in loops:
                                current_scope = scope_tmpl.format(**item)
                                current_query = query_tmpl.format(**item)
                                try:
                                    run_res = session.run(current_query).single()
                                    dict_res = run_res.data() if run_res else None
                                    debug(f"Returned object for '{current_scope}': {run_res} | Data dict: {dict_res}", component="StatisticsExtractor")

                                    result_val = dict_res.get("n", 0) if dict_res else 0
                                    status_val = "✅" if result_val > 0 else "⚠️"
                                    message_val = f"Found {result_val} matching items successfully." if result_val > 0 else "No matching component tracked."
                                except Exception as ex:
                                    result_val = 0
                                    status_val = "❌"
                                    message_val = f"Dynamic parsing iteration skipped: {ex}"

                                report[category][subcat].append({
                                    "scope": current_scope,
                                    "query": current_query,
                                    "result": result_val,
                                    "status": status_val,
                                    "message": message_val
                                })

        with open(stats_file, "w", encoding="utf-8") as f:
            json.dump(report, f, indent=2, ensure_ascii=False)

        success(f"Graph statistics successfully extracted and saved into {stats_file}", component="StatisticsExtractor")

    except Exception as e:
        error(f"Failed to generate and dump updated matrix statistics report: {e}", component="StatisticsExtractor")
EOF

echo "✅ Fixed Neo4jContext and EnvironmentContext imports in neo4j_statistics_extractor.py to cleanly extract Neo4j sandbox root metrics!"
