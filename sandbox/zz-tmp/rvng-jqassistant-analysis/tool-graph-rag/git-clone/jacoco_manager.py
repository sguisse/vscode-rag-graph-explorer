import logging
from typing import Dict, Any, List

from neo4j_manager import Neo4jManager

logger = logging.getLogger(__name__)


class JacocoManager:
    """
    Enrich the code graph with JaCoCo coverage information.

    Responsibilities:
    - Bridge :Jacoco:Method nodes to code methods by Class + Signature (create :REPRESENTS)
    - Copy/aggregate Jacoco counters into the corresponding code method nodes
    - Aggregate method coverage up to the Class level
    so the rest of the pipeline (RAG, analyzers) can query coverage data directly.
    """

    # Ajout de COMPLEXITY pour l'analyse des méthodes à haut risque
    COUNTER_TYPES = ["INSTRUCTION", "BRANCH", "LINE", "METHOD", "COMPLEXITY"]

    def __init__(self, neo4j_manager: Neo4jManager):
        self.neo4j_manager = neo4j_manager
        logger.info("Initialized JacocoManager.")

    def bridge_jacoco_to_methods(self) -> Dict[str, Any]:
        logger.info("--- Starting JaCoCo bridge: create :REPRESENTS relationships ---")
        # Match using exact fqn and signature equality, mirroring the kontext-e
        # jqassistant JaCoCo plugin Cypher rules:
        #   jacoco:ClassJacocoRelation  -> c.fqn = s.fqn
        #   jacoco:MethodJacocoRelation -> m.signature = jm.signature
        # jc.fqn is the dot-format FQN set by the importer (e.g. "com.example.MyClass")
        # j.signature is the Java-format signature from jvm_to_java_signature()
        cypher = """
        MATCH (jc:Jacoco:Class)-->(j:Jacoco:Method)
        MATCH (t:Type)-[:DECLARES]->(m:Method)
        WHERE j.signature IS NOT NULL AND m.signature IS NOT NULL
          AND j.signature = m.signature
          AND jc.fqn = t.fqn
        MERGE (j)-[:REPRESENTS]->(m)
        """
        counters = self.neo4j_manager.execute_write_query(cypher)
        return {"relationships_created": getattr(counters, "relationships_created", 0)}

    def _set_counter_props_for_type(self, counter_type: str) -> Dict[str, Any]:
        key = counter_type.lower()
        cypher = f"""
        MATCH (j:Jacoco:Method)-[:REPRESENTS]->(m:Method)
        OPTIONAL MATCH (j)-->(c:Jacoco:Counter {{type: '{counter_type}'}})
        WITH m, coalesce(c.covered, 0) AS covered, coalesce(c.missed, 0) AS missed
        SET m.jacoco_{key}_covered = covered,
            m.jacoco_{key}_missed = missed,
            m.jacoco_{key}_total = covered + missed
        """
        counters = self.neo4j_manager.execute_write_query(cypher)
        return {"properties_set": getattr(counters, "properties_set", 0)}

    def aggregate_coverage_to_classes(self) -> Dict[str, Any]:
        cypher = """
        MATCH (t:Type)-[:DECLARES]->(m:Method)
        WHERE m.jacoco_instruction_total IS NOT NULL
        WITH t,
             sum(m.jacoco_instruction_covered) AS i_cov, sum(m.jacoco_instruction_total) AS i_tot,
             sum(m.jacoco_branch_covered) AS b_cov, sum(m.jacoco_branch_total) AS b_tot
        SET t.jacoco_instruction_covered = i_cov,
            t.jacoco_instruction_total = i_tot,
            t.jacoco_branch_covered = b_cov,
            t.jacoco_branch_total = b_tot
        """
        counters = self.neo4j_manager.execute_write_query(cypher)
        return {"properties_set": getattr(counters, "properties_set", 0)}

    def enrich_methods_with_jacoco(self) -> Dict[str, Any]:
        """High-level method to perform JaCoCo enrichment end-to-end."""
        logger.info("--- Starting Pass: JaCoCo Enrichment ---")
        summary: Dict[str, Any] = {}
        try:
            summary["bridge"] = self.bridge_jacoco_to_methods()
            summary["counters"] = {}
            for ct in self.COUNTER_TYPES:
                summary["counters"][ct] = self._set_counter_props_for_type(ct)

            # Nouvelle étape : on fait remonter les stats sur les classes
            summary["class_aggregation"] = self.aggregate_coverage_to_classes()

        except Exception as exc:
            logger.exception("JaCoCo enrichment failed: %s", exc)
            summary["error"] = str(exc)

        logger.info("--- Finished Pass: JaCoCo Enrichment ---")
        return summary


if __name__ == "__main__":
    import os

    uri = os.environ.get("NEO4J_URI", "bolt://localhost:7688")
    user = os.environ.get("NEO4J_USER", "")
    password = os.environ.get("NEO4J_PASSWORD", "")

    nm = Neo4jManager(uri, user, password)
    with nm:
        jm = JacocoManager(nm)
        res = jm.enrich_methods_with_jacoco()
        print(res)
