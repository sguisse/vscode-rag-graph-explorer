import logging
from typing import List, Dict, Any
from tqdm import tqdm
from pathlib import Path

from neo4j_manager import Neo4jManager
from java_source_parser import JavaSourceParser
from kotlin_source_parser import KotlinSourceParser


logger = logging.getLogger(__name__)


class SourceFileLinker:
    """
    Parses a project's source files and enriches the jQAssistant graph by
    connecting :Type nodes to their corresponding :SourceFile nodes via a
    [:WITH_SOURCE] relationship.
    """

    def __init__(self, neo4j_manager: Neo4jManager):
        self.neo4j_manager = neo4j_manager
        logger.info("Initialized SourceFileLinker.")

    def link_types_to_source_files(self):
        """
        Executes the full source file linking process: parsing the source
        directory and then updating the graph with the discovered relationships.
        """
        logger.info("--- Starting Pass: Link Types to Source Files ---")
        try:
            source_metadata = self._parse_source_files()
            if not source_metadata:
                logger.warning(
                    "No Java or Kotlin source files found or parsed. "
                    "Skipping type linking."
                )
                return

            self._enrich_graph_with_types(source_metadata)
            logger.info("--- Finished Pass: Link Types to Source Files ---")
        except Exception as e:
            logger.error(f"Type linking pass failed: {e}", exc_info=True)
            raise

    def link_members_to_source_files(self):
        """
        Creates [:WITH_SOURCE] relationships directly from
        :Method and :Field nodes to their corresponding :SourceFile nodes.
        """
        logger.info("--- Starting Pass: Link Members to Source Files ---")
        query = """
        MATCH (type:Type)-[:DECLARES]->(member:Member)
        MATCH (type)-[:WITH_SOURCE]->(sourceFile:SourceFile)
        WITH DISTINCT member, sourceFile
        MERGE (member)-[r:WITH_SOURCE]->(sourceFile)
        RETURN count(r) AS relationshipsCreated
        """
        result = self.neo4j_manager.execute_write_query(query)
        relationships_created = result.relationships_created
        logger.info(
            f"Created {relationships_created} [:WITH_SOURCE] "
            "relationships from members to source files."
        )
        logger.info("--- Finished Pass: Link Members to Source Files ---")

    def _parse_source_files(self) -> List[Dict[str, Any]]:
        """
        Parses all Java and Kotlin files by querying Neo4j for their locations.
        """
        all_source_metadata: List[Dict[str, Any]] = []

        java_parser = JavaSourceParser(self.neo4j_manager)
        all_source_metadata.extend(java_parser.parse_project())

        try:
            kotlin_parser = KotlinSourceParser(self.neo4j_manager)
            all_source_metadata.extend(kotlin_parser.parse_project())
        except ImportError as e:
            logger.warning(f"Kotlin parsing skipped: {e}")
        except Exception as e:
            logger.error(f"Error during Kotlin parsing: {e}")

        return all_source_metadata

    def _enrich_graph_with_types(self, source_metadata: List[Dict[str, Any]]):
        """
        Connects :File nodes to :Type nodes based on parsed metadata.
        """
        logger.info(
            f"Starting graph enrichment for {len(source_metadata)} source files."
        )

        cypher_query = """
        UNWIND $metadata AS file_data
        MATCH (file:SourceFile {absolute_path: file_data.path})
        UNWIND file_data.fqns AS type_fqn
        MATCH (type:Type {fqn: type_fqn})
        WHERE type:Class OR type:Interface OR type:Enum
        MERGE (type)-[r:WITH_SOURCE]->(file)
        RETURN count(r) AS relationships_created
        """
        total_relationships_created = 0
        batch_size = 1000

        for i in tqdm(
            range(0, len(source_metadata), batch_size),
            desc="Enriching Neo4j graph with type links",
        ):
            batch = source_metadata[i : i + batch_size]
            try:
                summary = self.neo4j_manager.execute_write_query(
                    cypher_query, params={"metadata": batch}
                )
                total_relationships_created += summary.relationships_created
            except Exception as e:
                logger.error(
                    f"Error enriching graph with batch starting at index {i}: {e}"
                )

        logger.info(
            f"Successfully created {total_relationships_created} new [:WITH_SOURCE] "
            "relationships from Type to File."
        )

        return total_relationships_created

    def link_source_file_dependencies(self):
        """
        Creates direct relationships [:DEPENDS_ON] between :SourceFile nodes
        based on the dependencies of their :Type contents, resolving directly by FQN.
        """
        logger.info("--- Starting Pass: Link SourceFile Dependencies ---")
        query = r"""
        MATCH (sf1:SourceFile)<-[:WITH_SOURCE|HAS_SOURCE_FILE]-(t1:Type)-[:DEPENDS_ON]->(t2:Type)
        WHERE t2.fqn IS NOT NULL
        WITH DISTINCT sf1, replace(split(t2.fqn, '$')[0], '.', '/') + '.java' AS targetFqnPath
        MATCH (sf2:SourceFile)
        WHERE replace(coalesce(sf2.absolute_path, sf2.absoluteFileName, sf2.fileName, sf2.relativePath, sf2.name, ""), '\\', '/') ENDS WITH targetFqnPath
          AND sf1 <> sf2
        MERGE (sf1)-[r:DEPENDS_ON]->(sf2)
        RETURN count(r) AS relationshipsCreated
        """
        result = self.neo4j_manager.execute_write_query(query)
        logger.info(f"Created {result.relationships_created} direct [:DEPENDS_ON] between SourceFiles.")
        logger.info("--- Finished Pass: Link SourceFile Dependencies ---")
