import logging
from neo4j_manager import Neo4jManager
from neo4j.exceptions import ClientError, DatabaseError

logger = logging.getLogger(__name__)


class GraphEntitySetter:
    """
    Handles the final phase of graph normalization: labeling all relevant nodes
    as :Entity and assigning them a stable, unique entity_id with non-APOC fallbacks.
    """

    def __init__(self, neo4j_manager: Neo4jManager):
        self.neo4j_manager = neo4j_manager
        logger.info("Initialized GraphEntitySetter.")

    def _execute_apoc_or_fallback(self, apoc_query: str, fallback_query: str, pass_name: str):
        try:
            self.neo4j_manager.execute_write_query(apoc_query)
            logger.info(f"Successfully executed {pass_name} with APOC.")
        except (ClientError, DatabaseError) as e:
            logger.warning(f"APOC function failed during {pass_name}: {e}. Trying fallback query...")
            try:
                self.neo4j_manager.execute_write_query(fallback_query)
                logger.info(f"Successfully executed {pass_name} with fallback query.")
            except Exception as fb_err:
                logger.error(f"Fallback query failed during {pass_name}: {fb_err}", exc_info=True)

    def create_entities_and_stable_ids(self):
        logger.info("--- Starting Pass: Create Entities and Stable IDs ---")

        try:
            self.neo4j_manager.execute_write_query(
                "CREATE CONSTRAINT entity_id_unique IF NOT EXISTS FOR (e:Entity) REQUIRE e.entity_id IS UNIQUE"
            )
            logger.info("Ensured :Entity(entity_id) uniqueness constraint exists.")
        except Exception as e:
            logger.warning(f"Could not create uniqueness constraint on :Entity(entity_id): {e}")

        # 2. Project entity_id
        q2_apoc = """
        MATCH (p:Project)
        WHERE p.entity_id IS NULL
        WITH p, apoc.util.md5(["Project://", p.absolute_path]) AS eid
        WHERE NOT EXISTS { (e:Entity {entity_id: eid}) }
        SET p:Entity, p.entity_id = eid
        """
        q2_fallback = """
        MATCH (p:Project)
        WHERE p.entity_id IS NULL
        WITH p, "Project://" + coalesce(p.absolute_path, p.name, "default") AS eid
        WHERE NOT EXISTS { (e:Entity {entity_id: eid}) }
        SET p:Entity, p.entity_id = eid
        """
        self._execute_apoc_or_fallback(q2_apoc, q2_fallback, "Project entity_id generation")

        # 3. Source tree nodes
        q3_apoc = """
        MATCH (demotedRoot:Directory)
        WHERE demotedRoot.fileName = demotedRoot.absolute_path AND NOT demotedRoot:Artifact
        MATCH (descendant:File)
        WHERE descendant.absolute_path STARTS WITH demotedRoot.absolute_path
          AND NOT EXISTS { (:Artifact)-[:CONTAINS]->(descendant) }
          AND descendant.entity_id IS NULL
        WITH descendant, demotedRoot, apoc.util.md5([demotedRoot.fileName, descendant.fileName]) AS eid
        SET descendant:Entity, descendant.entity_id = eid
        """
        q3_fallback = """
        MATCH (demotedRoot:Directory)
        WHERE demotedRoot.fileName = demotedRoot.absolute_path AND NOT demotedRoot:Artifact
        MATCH (descendant:File)
        WHERE descendant.absolute_path STARTS WITH demotedRoot.absolute_path
          AND NOT EXISTS { (:Artifact)-[:CONTAINS]->(descendant) }
          AND descendant.entity_id IS NULL
        WITH descendant, demotedRoot, "SrcFile://" + demotedRoot.fileName + "_" + descendant.fileName AS eid
        SET descendant:Entity, descendant.entity_id = eid
        """
        self._execute_apoc_or_fallback(q3_apoc, q3_fallback, "Source tree entity_id generation")

        # 4. Artifact entity_id
        q4_apoc = """
        MATCH (a:Artifact)
        WHERE a.fileName IS NOT NULL AND a.entity_id IS NULL
        WITH a, apoc.util.md5([a.fileName]) AS eid
        SET a:Entity, a.entity_id = eid
        """
        q4_fallback = """
        MATCH (a:Artifact)
        WHERE a.fileName IS NOT NULL AND a.entity_id IS NULL
        WITH a, "Artifact://" + a.fileName AS eid
        SET a:Entity, a.entity_id = eid
        """
        self._execute_apoc_or_fallback(q4_apoc, q4_fallback, "Artifact entity_id generation")

        # 5. File-system-like nodes WITHIN artifacts
        q5_apoc = """
        MATCH (a:Artifact)-[:CONTAINS]->(n)
        WHERE (n:File OR n:Directory)
        AND n.fileName IS NOT NULL AND a.fileName IS NOT NULL AND n.entity_id IS NULL
        WITH n, a, apoc.util.md5([a.fileName, n.fileName]) AS eid
        SET n:Entity, n.entity_id = eid
        """
        q5_fallback = """
        MATCH (a:Artifact)-[:CONTAINS]->(n)
        WHERE (n:File OR n:Directory)
        AND n.fileName IS NOT NULL AND a.fileName IS NOT NULL AND n.entity_id IS NULL
        WITH n, a, "ArtifactNode://" + a.fileName + "_" + n.fileName AS eid
        SET n:Entity, n.entity_id = eid
        """
        self._execute_apoc_or_fallback(q5_apoc, q5_fallback, "Artifact node entity_id generation")

        # 5b. Remaining Directory nodes
        q5b_apoc = """
        MATCH (d:Directory)
        WHERE coalesce(d.absolute_path, d.fileName) IS NOT NULL
          AND d.entity_id IS NULL
        WITH coalesce(d.absolute_path, d.fileName) AS stable_path, collect(d) AS dirs
        WITH stable_path, head(dirs) AS d, apoc.util.md5(["Directory://", stable_path]) AS eid
        WHERE NOT EXISTS { (e:Entity {entity_id: eid}) }
        SET d:Entity, d.entity_id = eid
        """
        q5b_fallback = """
        MATCH (d:Directory)
        WHERE coalesce(d.absolute_path, d.fileName) IS NOT NULL
          AND d.entity_id IS NULL
        WITH coalesce(d.absolute_path, d.fileName) AS stable_path, collect(d) AS dirs
        WITH stable_path, head(dirs) AS d, "Dir://" + stable_path AS eid
        WHERE NOT EXISTS { (e:Entity {entity_id: eid}) }
        SET d:Entity, d.entity_id = eid
        """
        self._execute_apoc_or_fallback(q5b_apoc, q5b_fallback, "Remaining Directory entity_id generation")

        # 5c. Remaining File / SourceFile nodes
        q5c_apoc = """
        MATCH (f:File)
        WHERE coalesce(f.absolute_path, f.fileName) IS NOT NULL
          AND f.entity_id IS NULL
        WITH coalesce(f.absolute_path, f.fileName) AS stable_path, collect(f) AS files
        WITH stable_path, head(files) AS f, apoc.util.md5(["File://", stable_path]) AS eid
        WHERE NOT EXISTS { (e:Entity {entity_id: eid}) }
        SET f:Entity, f.entity_id = eid
        """
        q5c_fallback = """
        MATCH (f:File)
        WHERE coalesce(f.absolute_path, f.fileName) IS NOT NULL
          AND f.entity_id IS NULL
        WITH coalesce(f.absolute_path, f.fileName) AS stable_path, collect(f) AS files
        WITH stable_path, head(files) AS f, "File://" + stable_path AS eid
        WHERE NOT EXISTS { (e:Entity {entity_id: eid}) }
        SET f:Entity, f.entity_id = eid
        """
        self._execute_apoc_or_fallback(q5c_apoc, q5c_fallback, "Remaining File entity_id generation")

        # 6. Member nodes
        q6_apoc = """
        MATCH (t:Type)-[:DECLARES]->(m)
        WHERE (m:Member OR m:Method OR m:Field)
          AND t.entity_id IS NOT NULL
          AND m.entity_id IS NULL
        WITH t, m, coalesce(m.signature, m.name, m.fileName) AS member_key
        WHERE member_key IS NOT NULL
        WITH t.entity_id AS type_id, member_key, collect(m) AS members
        WITH type_id, member_key, head(members) AS m,
             apoc.util.md5(["Member://", type_id, member_key]) AS eid
        WHERE NOT EXISTS { (e:Entity {entity_id: eid}) }
        SET m:Entity, m.entity_id = eid
        """
        q6_fallback = """
        MATCH (t:Type)-[:DECLARES]->(m)
        WHERE (m:Member OR m:Method OR m:Field)
          AND t.entity_id IS NOT NULL
          AND m.entity_id IS NULL
        WITH t, m, coalesce(m.signature, m.name, m.fileName) AS member_key
        WHERE member_key IS NOT NULL
        WITH t.entity_id AS type_id, member_key, collect(m) AS members
        WITH type_id, member_key, head(members) AS m,
             "Member://" + type_id + "_" + member_key AS eid
        WHERE NOT EXISTS { (e:Entity {entity_id: eid}) }
        SET m:Entity, m.entity_id = eid
        """
        self._execute_apoc_or_fallback(q6_apoc, q6_fallback, "Member entity_id generation")

        try:
            self.neo4j_manager.execute_write_query(
                "CREATE INDEX sourcefile_path_index IF NOT EXISTS FOR (sf:SourceFile) ON (sf.absolute_path)"
            )
            logger.info("Created index on SourceFile.absolute_path.")
        except Exception as e:
            logger.warning(f"Could not create index on SourceFile.absolute_path: {e}")

        logger.info("--- Finished Pass: Create Entities and Stable IDs ---")
