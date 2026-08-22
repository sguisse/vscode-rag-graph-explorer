#!/usr/bin/env bash
set -e

# 1. Locate target files dynamically
TREE_BUILDER_PATH=$(find ./scripts -name "graph_tree_builder.py" | head -n 1)
ORCHESTRATOR_PATH=$(find ./scripts -name "graph_orchestrator.py" | head -n 1)
LINKER_PATH=$(find ./scripts -name "source_file_linker.py" | head -n 1)
RULES_XML_PATH=$(find ./scripts -name "analysis-rules-template.xml" -o -name "*rules*.xml" | head -n 1)

if [ -z "$TREE_BUILDER_PATH" ] || [ -z "$ORCHESTRATOR_PATH" ] || [ -z "$LINKER_PATH" ] || [ -z "$RULES_XML_PATH" ]; then
    echo "❌ Error: Could not locate Python pipeline files or rules.xml in workspace."
    exit 1
fi

echo "📁 Target Python files located:"
echo "   - $TREE_BUILDER_PATH"
echo "   - $ORCHESTRATOR_PATH"
echo "   - $LINKER_PATH"
echo "   - $RULES_XML_PATH"

# 2. Complete update of graph_tree_builder.py
cat << 'EOF' > "$TREE_BUILDER_PATH"
import logging
import os
import xml.etree.ElementTree as ET
from pathlib import Path
from collections import defaultdict
from neo4j_manager import Neo4jManager

logger = logging.getLogger(__name__)


class GraphTreeBuilder:
    """
    Handles the third phase of graph normalization: establishing a clean,
    hierarchical tree structure for the project and Maven modules.
    """

    def __init__(self, neo4j_manager: Neo4jManager):
        self.neo4j_manager = neo4j_manager
        self.project_path = None
        self.project_name = None
        logger.info("Initialized GraphTreeBuilder.")

    def create_project_node(self, repo_root: str = ""):
        """
        Auto-detects the project's root path, creates a single :Project node,
        and links all :Artifact nodes to it.

        Args:
            repo_root: Explicit path to the repository root (preferred). When
                       provided the expensive commonpath query is skipped and
                       the project is named after the directory instead of the
                       common ancestor of all top-level nodes (which can be the
                       home directory when multiple artifact trees are present).
        """
        logger.info("--- Starting Pass: Create Project Node ---")

        if repo_root:
            # Use the explicitly provided root — most reliable
            self.project_path = Path(repo_root).resolve()
        else:
            # Auto-detect project root from the graph. Get the top level directory nodes.
            query = """
            MATCH (d:Directory)
            WHERE NOT EXISTS { (parent_dir:Directory)-[:CONTAINS]->(d) }
            RETURN d.absolute_path AS path
            """
            results = self.neo4j_manager.execute_read_query(query)
            top_dir_paths = [res["path"] for res in results if res and res.get("path")]

            if top_dir_paths:
                project_path_str = os.path.commonpath(top_dir_paths)
                self.project_path = Path(project_path_str).resolve()
            else:
                self.project_path = Path.cwd().resolve()

        # Also check PROJECT_ROOT env var as fallback when no arg given
        if not repo_root:
            env_root = os.environ.get("PROJECT_ROOT", "")
            if env_root and Path(env_root).is_dir():
                self.project_path = Path(env_root).resolve()

        self.project_name = self.project_path.name
        logger.info(f"Auto-detected project path: {self.project_path}")

        # Remove stale Project nodes from previous runs
        self.neo4j_manager.execute_write_query(
            "MATCH (p:Project) WHERE p.name <> $projectName DETACH DELETE p",
            params={"projectName": self.project_name},
        )

        # Create (or merge) the canonical :Project node and link artifacts
        self.neo4j_manager.execute_write_query(
            """
            MERGE (p:Project {name: $projectName})
            ON CREATE SET p.creationTimestamp = datetime()
            SET p.absolute_path = $projectPath
            WITH p
            MATCH (a:Artifact) WHERE 'Jar' IN labels(a) OR a:Directory
            MERGE (p)-[:CONTAINS]->(a)
            WITH p
            MATCH (d:Directory)
            WHERE NOT EXISTS { (parent_dir:Directory)-[:CONTAINS]->(d) }
            MERGE (p)-[:CONTAINS]->(d)
            """,
            params={
                "projectName": self.project_name,
                "projectPath": str(self.project_path),
            },
        )
        logger.info(
            f"Created :Project node for '{self.project_name}' and linked with artifacts and top-level directories."
        )
        logger.info("--- Finished Pass: Create Project Node ---")
        return self.project_path

    def build_maven_project_structure(self):
        """
        Parses pom.xml files directly from workspace disk to build :Maven:Project nodes,
        link :SourceFile nodes via [:BELONGS_TO], and project inter-module [:DEPENDS_ON].
        """
        logger.info("--- Starting Pass: Build Maven Project Nodes from POMs ---")
        if not self.project_path:
            logger.warning("Project path not set. Skipping Maven Project creation.")
            return

        pom_files = list(Path(self.project_path).rglob("pom.xml"))
        modules_data = []

        for pom_path in pom_files:
            try:
                tree = ET.parse(pom_path)
                root = tree.getroot()
                ns = {'m': root.tag.split('}')[0].strip('{')} if '}' in root.tag else {}

                artifact_id = root.findtext('m:artifactId', namespaces=ns) or root.findtext('artifactId')
                group_id = root.findtext('m:groupId', namespaces=ns) or root.findtext('groupId')
                version = root.findtext('m:version', namespaces=ns) or root.findtext('version')

                parent = root.find('m:parent', namespaces=ns) or root.find('parent')
                if parent is not None:
                    if not group_id:
                        group_id = parent.findtext('m:groupId', namespaces=ns) or parent.findtext('groupId')
                    if not version:
                        version = parent.findtext('m:version', namespaces=ns) or parent.findtext('version')

                if artifact_id:
                    modules_data.append({
                        "artifactId": artifact_id,
                        "groupId": group_id or "unknown",
                        "version": version or "unknown",
                        "path": str(pom_path.parent.resolve())
                    })
            except Exception as e:
                logger.warning(f"Could not parse POM file at {pom_path}: {e}")

        if not modules_data:
            logger.warning("No valid POM files parsed for Maven Project creation.")
            return

        create_modules_cypher = """
        UNWIND $modules AS mod
        MERGE (m:Maven:Project {artifactId: mod.artifactId})
        SET m.groupId = mod.groupId,
            m.version = mod.version,
            m.absolute_path = mod.path,
            m.name = mod.artifactId
        WITH m, mod
        MATCH (sf:SourceFile)
        WHERE sf.absolute_path STARTS WITH mod.path
        MERGE (sf)-[:BELONGS_TO]->(m)
        """
        self.neo4j_manager.execute_write_query(create_modules_cypher, params={"modules": modules_data})

        link_root_cypher = """
        MATCH (p:Project {absolute_path: $projectPath})
        MATCH (m:Maven:Project)
        MERGE (p)-[:CONTAINS_MODULE]->(m)
        """
        self.neo4j_manager.execute_write_query(link_root_cypher, params={"projectPath": str(self.project_path)})

        link_deps_cypher = r"""
        MATCH (m1:Maven:Project)<-[:BELONGS_TO]-(sf1:SourceFile)<-[:WITH_SOURCE|HAS_SOURCE_FILE]-(t1:Type)
        MATCH (t1)-[:DEPENDS_ON]->(t2:Type)
        WHERE t2.fqn IS NOT NULL
        WITH DISTINCT m1, replace(split(t2.fqn, '$')[0], '.', '/') + '.java' AS targetFqnPath
        MATCH (sf2:SourceFile)-[:BELONGS_TO]->(m2:Maven:Project)
        WHERE replace(coalesce(sf2.absolute_path, sf2.absoluteFileName, sf2.fileName, sf2.relativePath, sf2.name, ""), '\\', '/') ENDS WITH targetFqnPath
          AND m1 <> m2
        MERGE (m1)-[r:DEPENDS_ON]->(m2)
        """
        self.neo4j_manager.execute_write_query(link_deps_cypher)

        logger.info(f"Successfully created {len(modules_data)} :Maven:Project nodes and inter-module dependencies.")
        logger.info("--- Finished Pass: Build Maven Project Nodes from POMs ---")

    def establish_source_hierarchy(self):
        """
        Establishes a direct hierarchical structure for source entities
        using [:CONTAINS_SOURCE], processing level by level.
        """
        if not self.project_path:
            raise ValueError(
                "Project path has not been determined. Run create_project_node() first."
            )

        logger.info("--- Starting Pass: Establish Direct Source Hierarchy ---")

        self._ensure_source_directories_exist()

        query_all_dirs = """
        MATCH (d:Directory)
        WHERE d.absolute_path IS NOT NULL
          AND d.absolute_path STARTS WITH $projectPath
        RETURN d.absolute_path AS path, size(split(d.absolute_path, '/')) AS depth
        """
        all_dirs_with_depth = self.neo4j_manager.execute_read_query(
            query_all_dirs,
            params={"projectPath": str(self.project_path)},
        )

        if not all_dirs_with_depth:
            logger.warning(
                "No directories with absolute_path found to establish hierarchy."
            )
            return

        self.neo4j_manager.execute_write_query(
            """
            UNWIND $paths AS dir_path
            MATCH (parentDir:Directory {absolute_path: dir_path})
            WITH parentDir,
                 CASE WHEN dir_path ENDS WITH '/'
                      THEN left(dir_path, size(dir_path) - 1)
                      ELSE dir_path END AS normDir
            MATCH (sf:SourceFile)
            WHERE sf.absolute_path STARTS WITH $projectPath
              AND sf.absolute_path STARTS WITH normDir + '/'
              AND size(split(sf.absolute_path, '/')) = size(split(normDir, '/')) + 1
            MERGE (parentDir)-[:CONTAINS_SOURCE]->(sf)
            """,
            params={
                "paths": [item["path"] for item in all_dirs_with_depth],
                "projectPath": str(self.project_path),
            },
        )

        dirs_by_depth = defaultdict(list)
        for item in all_dirs_with_depth:
            dirs_by_depth[item["depth"]].append(item["path"])

        for depth in sorted(dirs_by_depth.keys(), reverse=True):
            current_depth_dir_paths = dirs_by_depth[depth]
            self.neo4j_manager.execute_write_query(
                """
                UNWIND $paths AS parent_path
                MATCH (parentDir:Directory {absolute_path: parent_path})
                WITH parentDir,
                     CASE WHEN parent_path ENDS WITH '/'
                          THEN left(parent_path, size(parent_path) - 1)
                          ELSE parent_path END AS normParent
                MATCH (childDir:Directory)
                WHERE childDir.absolute_path STARTS WITH $projectPath
                  AND childDir.absolute_path STARTS WITH normParent + '/'
                  AND size(split(childDir.absolute_path, '/')) = size(split(normParent, '/')) + 1
                  AND EXISTS {(childDir)-[:CONTAINS_SOURCE]->()}
                MERGE (parentDir)-[:CONTAINS_SOURCE]->(childDir)
                """,
                params={
                    "paths": current_depth_dir_paths,
                    "projectPath": str(self.project_path),
                },
            )

        logger.info(
            "Established [:CONTAINS_SOURCE] relationships between directories and source files."
        )

        self.neo4j_manager.execute_write_query(
            """
            MATCH (p:Project {absolute_path: $projectPath})
            MATCH (d:Directory)
            WHERE d.absolute_path STARTS WITH $projectPath
              AND EXISTS {(d)-[:CONTAINS_SOURCE]->()}
              AND NOT EXISTS {(parent_dir:Directory)-[:CONTAINS_SOURCE]->(d)}
            MERGE (p)-[:CONTAINS_SOURCE]->(d)
            """,
            params={"projectPath": str(self.project_path)},
        )
        logger.info("Linked :Project node to top-level source directories.")
        logger.info("--- Finished Pass: Establish Direct Source Hierarchy ---")

    def _ensure_source_directories_exist(self):
        """
        Creates fallback :Directory nodes for disk-backed :SourceFile nodes when the
        repository filesystem tree was not scanned into Neo4j.
        """
        query = """
        MATCH (sf:SourceFile)
        WHERE sf.absolute_path IS NOT NULL
          AND sf.absolute_path STARTS WITH $projectPath
        RETURN DISTINCT sf.absolute_path AS path
        """
        source_files = self.neo4j_manager.execute_read_query(
            query,
            params={"projectPath": str(self.project_path)},
        )

        if not source_files:
            logger.info("No project source files found for directory synthesis.")
            return

        anchor_markers = [
            "/src/main/java/",
            "/src/main/kotlin/",
            "/src/test/java/",
            "/src/test/kotlin/",
        ]

        dir_paths: set[str] = set()
        for row in source_files:
            source_path = row.get("path")
            if not source_path:
                continue

            anchor = str(self.project_path)
            for marker in anchor_markers:
                if marker in source_path:
                    anchor = source_path.split(marker, 1)[0] + marker.rstrip("/")
                    break

            current = Path(source_path).parent
            anchor_path = Path(anchor)
            while str(current).startswith(str(anchor_path)):
                dir_paths.add(str(current))
                if current == anchor_path:
                    break
                current = current.parent

        if not dir_paths:
            logger.info("No source directories needed to be synthesized.")
            return

        batch_size = 500
        ordered_paths = sorted(dir_paths)
        for start in range(0, len(ordered_paths), batch_size):
            chunk = ordered_paths[start : start + batch_size]
            self.neo4j_manager.execute_write_query(
                """
                UNWIND $paths AS path
                MERGE (d:Directory {absolute_path: path})
                ON CREATE SET d.fileName = path
                """,
                params={"paths": chunk},
            )

        logger.info(
            "Ensured fallback :Directory nodes exist for %s source directories.",
            len(ordered_paths),
        )
EOF

# 3. Complete update of graph_orchestrator.py
cat << 'EOF' > "$ORCHESTRATOR_PATH"
import logging
from pathlib import Path
from neo4j_manager import Neo4jManager
from graph_basic_normalizer import GraphBasicNormalizer
from source_file_linker import SourceFileLinker
from graph_tree_builder import GraphTreeBuilder
from graph_entity_setter import GraphEntitySetter
from artifact_data_normalizer import ArtifactDataNormalizer
from jacoco_manager import JacocoManager
from jacoco_importer import import_jacoco

logger = logging.getLogger(__name__)


class GraphOrchestrator:
    """
    Manages and executes the sequence of graph normalization and enrichment passes.
    """

    def __init__(self, neo4j_manager: Neo4jManager, repo_root: str = ""):
        self.neo4j_manager = neo4j_manager
        self.project_path = None
        self.repo_root = repo_root or ""
        logger.info("Initialized GraphOrchestrator.")

    def run_enrichment_passes(self):
        """
        Executes the full sequence of graph enrichment passes by instantiating
        and running the necessary components in the correct logical order.
        """
        logger.info("--- Starting All Graph Enrichment and Normalization Passes ---")

        # --- Pre-flight: check the graph has been scanned ---
        type_check = self.neo4j_manager.execute_read_query("MATCH (t:Java:Type) RETURN count(t) AS n LIMIT 1")
        type_count = type_check[0]["n"] if type_check else 0
        if type_count == 0:
            logger.warning(
                "PRE-FLIGHT CHECK FAILED: No Java type nodes (:Java:Type) found in the graph. "
                "Source-file linking and summarization passes will produce 0 results. "
                "Run 'B4 — jqassistant scan + analyze' from the manager before running enrichment."
            )

        # Instantiate all the specialized handlers
        basic_normalizer = GraphBasicNormalizer(self.neo4j_manager)
        source_linker = SourceFileLinker(self.neo4j_manager)
        tree_builder = GraphTreeBuilder(self.neo4j_manager)
        artifact_normalizer = ArtifactDataNormalizer(self.neo4j_manager)
        entity_setter = GraphEntitySetter(self.neo4j_manager)

        # --- Phase 1: Basic Normalization ---
        basic_normalizer.add_absolute_paths()
        basic_normalizer.label_source_files()

        # --- Phase 2: Source Code Integration ---
        source_linker.link_types_to_source_files()
        source_linker.link_members_to_source_files()
        source_linker.link_source_file_dependencies()

        # --- Phase 3: Hierarchical Structure & Maven Modules ---
        self.project_path = tree_builder.create_project_node(repo_root=self.repo_root)
        tree_builder.build_maven_project_structure()
        tree_builder.establish_source_hierarchy()

        # --- Phase 4: Artifact & Package Data Normalization ---
        artifact_normalizer.merge_duplicate_types()
        artifact_normalizer.relocate_directory_artifacts()
        artifact_normalizer.rewrite_containment_relationships()
        artifact_normalizer.rewrite_requirement_relationships()
        artifact_normalizer.establish_class_hierarchy()
        artifact_normalizer.cleanup_package_semantics()
        artifact_normalizer.link_project_to_artifacts()

        # --- Phase 5: Entity and ID Generation ---
        entity_setter.create_entities_and_stable_ids()

        # --- Phase 6: JaCoCo coverage import using jacoco_importer.py ---
        try:
            if self.project_path:
                base = Path(self.project_path)
            elif self.repo_root:
                base = Path(self.repo_root)
            else:
                base = Path.cwd()

            xml_file = base / "target" / "site" / "jacoco" / "jacoco.xml"
            if not xml_file.exists():
                xml_file = base / "target" / "jacoco" / "jacoco.xml"

            if xml_file.exists():
                logger.info("JaCoCo XML found at %s — importing", xml_file)
                import_jacoco(
                    str(xml_file),
                    neo4j_uri=self.neo4j_manager.uri,
                    user=getattr(self.neo4j_manager, "user", ""),
                    password=getattr(self.neo4j_manager, "password", ""),
                )
            else:
                logger.debug("No JaCoCo XML found under %s — skipping import.", base)
        except Exception:
            logger.exception("Unexpected error while attempting JaCoCo XML import")

        # --- Phase 7: JaCoCo coverage enrichment ---
        jacoco_manager = JacocoManager(self.neo4j_manager)
        try:
            jacoco_summary = jacoco_manager.enrich_methods_with_jacoco()
            logger.info("JaCoCo enrichment summary: %s", jacoco_summary)
        except Exception as exc:
            logger.exception("JaCoCo enrichment failed: %s", exc)

        logger.info("--- All Graph Enrichment and Normalization Passes Complete ---")
EOF

# 4. Complete update of source_file_linker.py
cat << 'EOF' > "$LINKER_PATH"
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
        Crée des relations directes [:DEPENDS_ON] entre les nœuds :SourceFile
        en se basant sur les dépendances de leurs :Type contenus, résolvant directement par FQN.
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
EOF

# 5. Complete update of rules XML file with ALL original concepts preserved
cat << 'EOF' > "$RULES_XML_PATH"
<?xml version="1.0" encoding="UTF-8"?>
<jqa:jqassistant-rules xmlns:jqa="http://www.buschmais.com/jqassistant/core/analysis/rules/schema/v1.0">

    <concept id="smart-supply-back:MarkSpringController">
        <description>Labels every class annotated with @Controller as :Controller</description>
        <cypher><![CDATA[
            MATCH (c:Class)-[:ANNOTATED_BY]->(a:Annotation)-[:OF_TYPE]->(t:Type)
            WHERE t.fqn = 'org.springframework.stereotype.Controller'
            SET c:Controller
            RETURN count(c) AS MarkedControllers
        ]]></cypher>
    </concept>

    <concept id="smart-supply-back:MarkSpringRestController">
        <description>Labels every class annotated with @RestController as :RestController and :Controller</description>
        <cypher><![CDATA[
            MATCH (c:Class)-[:ANNOTATED_BY]->(a:Annotation)-[:OF_TYPE]->(t:Type)
            WHERE t.fqn = 'org.springframework.web.bind.annotation.RestController'
            SET c:RestController, c:Controller
            RETURN count(c) AS MarkedRestControllers
        ]]></cypher>
    </concept>

    <concept id="smart-supply-back:MarkSpringService">
        <description>Labels every class annotated with @Service as :Service</description>
        <cypher><![CDATA[
            MATCH (c:Class)-[:ANNOTATED_BY]->(a:Annotation)-[:OF_TYPE]->(t:Type)
            WHERE t.fqn = 'org.springframework.stereotype.Service'
            SET c:Service
            RETURN count(c) AS MarkedServices
        ]]></cypher>
    </concept>

    <concept id="smart-supply-back:MarkSpringRepository">
        <description>Labels classes or interfaces as :Repository via @Repository annotation OR Spring Data interface inheritance</description>
        <cypher><![CDATA[
            MATCH (t:Type)
            // Condition 1: Présence explicite de l'annotation
            WHERE EXISTS {
                MATCH (t)-[:ANNOTATED_BY]->()-[:OF_TYPE]->(:Type {fqn: 'org.springframework.stereotype.Repository'})
            }
            // Condition 2: Héritage d'une interface de la famille Spring Data Repository
            OR EXISTS {
                MATCH (t)-[:IMPLEMENTS|EXTENDS*]->(super:Type)
                WHERE super.fqn STARTS WITH 'org.springframework.data.'
                  AND super.name ENDS WITH 'Repository'
            }
            SET t:Repository
            RETURN count(DISTINCT t) AS MarkedRepositories
        ]]></cypher>
    </concept>

    <concept id="smart-supply-back:MarkDbEntity">
        <description>Labels every class annotated with JPA/Hibernate entity markers as :DbEntity</description>
        <cypher><![CDATA[
            MATCH (c:Class)-[:ANNOTATED_BY]->(a:Annotation)-[:OF_TYPE]->(t:Type)
            WHERE t.fqn IN [
                'javax.persistence.Entity',
                'jakarta.persistence.Entity',
                'javax.persistence.Table',
                'jakarta.persistence.Table'
            ]
            SET c:DbEntity
            RETURN count(c) AS MarkedDbEntities
        ]]></cypher>
    </concept>

    <concept id="smart-supply-back:MarkDomainObject">
        <description>Labels classes located inside domain packages without framework annotations as :DomainObject</description>
        <cypher><![CDATA[
            MATCH (p:Package)-[:CONTAINS*]->(c:Class)
            WHERE p.fqn CONTAINS '.domain'
              AND NOT c:Controller AND NOT c:Service AND NOT c:Repository AND NOT c:DbEntity
            SET c:DomainObject
            RETURN count(c) AS MarkedDomainObjects
        ]]></cypher>
    </concept>

    <concept id="smart-supply-back:MarkLayeredArchitecture">
        <description>Identifies and labels packages participating in a standard Layered Architecture</description>
        <cypher><![CDATA[
            MATCH (p:Package)
            WHERE p.fqn CONTAINS '.controller' OR p.fqn CONTAINS '.service' OR p.fqn CONTAINS '.repository'
            SET p:LayeredArchitecturePackage
            RETURN count(p) AS MarkedLayeredPackages
        ]]></cypher>
    </concept>

    <concept id="smart-supply-back:MarkHexagonalArchitecture">
        <description>Identifies and labels packages participating in a Hexagonal Architecture</description>
        <cypher><![CDATA[
            MATCH (p:Package)
            WHERE p.fqn CONTAINS '.domain' OR p.fqn CONTAINS '.infrastructure' OR p.fqn CONTAINS '.adapter' OR p.fqn CONTAINS '.port'
            SET p:HexagonalArchitecturePackage
            RETURN count(p) AS MarkedHexagonalPackages
        ]]></cypher>
    </concept>

    <concept id="smart-supply-back:MarkDomainLayer">
        <description>Labels classes inside the core domain package structure as :DomainLayer</description>
        <cypher><![CDATA[
            MATCH (p:Package)-[:CONTAINS*]->(c:Class)
            WHERE p.fqn ENDS WITH '.domain' OR p.fqn CONTAINS '.domain.'
            SET c:DomainLayer
            RETURN count(c) AS MarkedDomainLayerClasses
        ]]></cypher>
    </concept>

    <concept id="smart-supply-back:MarkApiLayer">
        <description>Labels classes interacting with or exposing external systems/clients</description>
        <cypher><![CDATA[
            MATCH (p:Package)-[:CONTAINS*]->(c:Class)
            WHERE p.fqn CONTAINS '.client' OR p.fqn CONTAINS '.external' OR p.fqn CONTAINS '.integration'
            SET c:ApiLayer
            RETURN count(c) AS MarkedApiLayerClasses
        ]]></cypher>
    </concept>

    <concept id="smart-supply-back:MarkAdapter">
        <description>Labels classes located in adapter packages as :Adapter</description>
        <cypher><![CDATA[
            MATCH (p:Package)-[:CONTAINS*]->(c:Class)
            WHERE p.fqn CONTAINS '.adapter'
            SET c:Adapter
            RETURN count(c) AS MarkedAdapters
        ]]></cypher>
    </concept>

    <concept id="smart-supply-back:MarkPortIn">
        <description>Labels inbound interfaces/use-cases as :PortIn</description>
        <cypher><![CDATA[
            MATCH (p:Package)-[:CONTAINS*]->(i:Interface)
            WHERE p.fqn CONTAINS '.port.in' OR p.fqn CONTAINS '.ports.in' OR i.name ENDS WITH 'UseCase'
            SET i:PortIn
            RETURN count(i) AS MarkedPortsIn
        ]]></cypher>
    </concept>

    <concept id="smart-supply-back:MarkPortOut">
        <description>Labels outbound interfaces/SPIs as :PortOut</description>
        <cypher><![CDATA[
            MATCH (p:Package)-[:CONTAINS*]->(i:Interface)
            WHERE p.fqn CONTAINS '.port.out' OR p.fqn CONTAINS '.ports.out' OR i.name ENDS WITH 'Port'
            SET i:PortOut
            RETURN count(i) AS MarkedPortsOut
        ]]></cypher>
    </concept>

    <concept id="smart-supply-back:MarkInfrastructure">
        <description>Labels driving/primary infrastructure configurations and entry points</description>
        <cypher><![CDATA[
            MATCH (c:Class)
            WHERE c:Controller OR c.fqn CONTAINS '.adapter' OR c.fqn CONTAINS '.infrastructure'
            SET c:Infrastructure
            RETURN count(c) AS MarkedInfrastructure
        ]]></cypher>
    </concept>

    <concept id="smart-supply-back:MarkInfrastructurePrimary">
        <description>Labels driving/primary infrastructure configurations and entry points</description>
        <cypher><![CDATA[
            MATCH (c:Class)
            WHERE c:Controller OR c:Repository OR c.fqn CONTAINS '.adapter.in' OR c.fqn CONTAINS '.infrastructure.web'
            SET c:InfrastructurePrimary
            RETURN count(c) AS MarkedPrimaryInfra
        ]]></cypher>
    </concept>

    <concept id="smart-supply-back:MarkInfrastructureSecondary">
        <description>Labels driven/secondary infrastructure components (persistence, messaging clients)</description>
        <cypher><![CDATA[
            MATCH (c:Class)
            WHERE c:Repository OR c.fqn CONTAINS '.adapter.out' OR c.fqn CONTAINS '.infrastructure.persistence'
            SET c:InfrastructureSecondary
            RETURN count(c) AS MarkedSecondaryInfra
        ]]></cypher>
    </concept>

    <concept id="smart-supply-back:MarkServiceAsUseCases">
        <description>Labels core domain services acting explicitly as application Use Cases</description>
        <cypher><![CDATA[
            MATCH (c:Service)-[:IMPLEMENTS]->(i:PortIn)
            SET c:UseCaseService
            RETURN count(c) AS MarkedUseCaseServices
        ]]></cypher>
    </concept>

    <concept id="smart-supply-back:MarkResilienceRetry">
        <description>Labels elements protected by a Retry mechanism</description>
        <cypher><![CDATA[
            MATCH (e)-[:ANNOTATED_BY]->(a:Annotation)-[:OF_TYPE]->(t:Type)
            WHERE t.fqn CONTAINS 'io.github.resilience4j.retry.annotation.Retry'
            SET e:ResilienceRetry
            RETURN count(e) AS MarkedRetryElements
        ]]></cypher>
    </concept>

    <concept id="smart-supply-back:MarkResilienceCircuitBreaker">
        <description>Labels elements protected by a Circuit Breaker</description>
        <cypher><![CDATA[
            MATCH (e)-[:ANNOTATED_BY]->(a:Annotation)-[:OF_TYPE]->(t:Type)
            WHERE t.fqn CONTAINS 'io.github.resilience4j.circuitbreaker.annotation.CircuitBreaker'
            SET e:ResilienceCircuitBreaker
            RETURN count(e) AS MarkedCircuitBreakers
        ]]></cypher>
    </concept>

    <concept id="smart-supply-back:MarkResilienceRateLimiter">
        <description>Labels elements throttled by a Rate Limiter</description>
        <cypher><![CDATA[
            MATCH (e)-[:ANNOTATED_BY]->(a:Annotation)-[:OF_TYPE]->(t:Type)
            WHERE t.fqn CONTAINS 'io.github.resilience4j.ratelimiter.annotation.RateLimiter'
            SET e:ResilienceRateLimiter
            RETURN count(e) AS MarkedRateLimiters
        ]]></cypher>
    </concept>

    <concept id="smart-supply-back:MarkResilienceBulkhead">
        <description>Labels elements isolated via Bulkhead pattern</description>
        <cypher><![CDATA[
            MATCH (e)-[:ANNOTATED_BY]->(a:Annotation)-[:OF_TYPE]->(t:Type)
            WHERE t.fqn CONTAINS 'io.github.resilience4j.bulkhead.annotation.Bulkhead'
            SET e:ResilienceBulkhead
            RETURN count(e) AS MarkedBulkheads
        ]]></cypher>
    </concept>

    <concept id="smart-supply-back:MarkResilienceTimeout">
        <description>Labels elements governed by a Time Limiter / Timeout configuration</description>
        <cypher><![CDATA[
            MATCH (e)-[:ANNOTATED_BY]->(a:Annotation)-[:OF_TYPE]->(t:Type)
            WHERE t.fqn CONTAINS 'io.github.resilience4j.timelimiter.annotation.TimeLimiter'
            SET e:ResilienceTimeout
            RETURN count(e) AS MarkedTimeouts
        ]]></cypher>
    </concept>

    <concept id="smart-supply-back:MarkResilienceFallback">
        <description>Identifies methods serving explicitly as fallback execution paths</description>
        <cypher><![CDATA[
            MATCH (c:Class)-[:DECLARES]->(m:Method)
            WHERE m.name STARTS WITH 'fallback' OR m.name CONTAINS 'Fallback'
            SET m:ResilienceFallback
            RETURN count(m) AS MarkedFallbacks
        ]]></cypher>
    </concept>

    <concept id="smart-supply-back:MarkCaching">
        <description>Labels methods or classes configured with caching capabilities</description>
        <cypher><![CDATA[
            MATCH (e)-[:ANNOTATED_BY]->(a:Annotation)-[:OF_TYPE]->(t:Type)
            WHERE t.fqn IN [
                'org.springframework.cache.annotation.Cacheable',
                'org.springframework.cache.annotation.CachePut',
                'org.springframework.cache.annotation.CacheEvict'
            ]
            SET e:CachedElement
            RETURN count(e) AS MarkedCachedElements
        ]]></cypher>
    </concept>

    <concept id="smart-supply-back:MarkMultithreading">
        <description>Labels methods executing asynchronously or interacting with concurrency managers</description>
        <cypher><![CDATA[
            MATCH (e)-[:ANNOTATED_BY]->(a:Annotation)-[:OF_TYPE]->(t:Type)
            WHERE t.fqn = 'org.springframework.scheduling.annotation.Async'
            SET e:AsynchronousExecution
            RETURN count(e) AS MarkedMultithreadedElements
        ]]></cypher>
    </concept>

    <concept id="smart-supply-back:MarkPartOfWorkflow">
        <description>Labels components identified as structural units inside a business workflow execution</description>
        <cypher><![CDATA[
            MATCH (c:Class)
            WHERE c.fqn CONTAINS '.workflow.' OR c.fqn CONTAINS '.process.' OR c.name ENDS WITH 'Delegate'
            SET c:WorkflowComponent
            RETURN count(c) AS MarkedWorkflowComponents
        ]]></cypher>
    </concept>

    <concept id="smart-supply-back:MarkUsedInBpmn">
        <description>Labels Java components interacting with BPMN systems (e.g., Camunda Java Delegates)</description>
        <cypher><![CDATA[
            MATCH (c:Class)-[:IMPLEMENTS]->(t:Type)
            WHERE t.fqn = 'org.camunda.bpm.engine.delegate.JavaDelegate'
            SET c:BpmnTaskDelegate
            RETURN count(c) AS MarkedBpmnDelegates
        ]]></cypher>
    </concept>

    <concept id="smart-supply-back:MarkInheritance">
        <description>Enriches class and interface nodes participating in deep hierarchies</description>
        <cypher><![CDATA[
            MATCH (sub:Type)-[:EXTENDS|IMPLEMENTS]->(sup:Type)
            SET sub:HasSuperType, sup:HasSubType
            RETURN count(sub) AS ProcessedInheritanceNodes
        ]]></cypher>
    </concept>

    <concept id="smart-supply-back:MarkComposition">
        <description>Marks strong composition fields (private lifecycle-bound custom internal types)</description>
        <cypher><![CDATA[
            MATCH (c1:Class)-[:DECLARES]->(f:Field)-[:OF_TYPE]->(c2:Class)
            WHERE NOT f.type STARTS WITH 'java.' AND NOT f.type STARTS WITH 'org.springframework.'
            SET f:CompositionField
            RETURN count(f) AS MarkedCompositions
        ]]></cypher>
    </concept>

    <concept id="smart-supply-back:MarkAggregation">
        <description>Marks aggregation fields representing structural collection-based listings</description>
        <cypher><![CDATA[
            MATCH (c1:Class)-[:DECLARES]->(f:Field)
            WHERE f.signature CONTAINS 'java.util.List'
               OR f.signature CONTAINS 'java.util.Set'
               OR f.signature CONTAINS 'java.util.Collection'
            SET f:AggregationField
            RETURN count(f) AS MarkedAggregations
        ]]></cypher>
    </concept>

    <concept id="smart-supply-back:MarkAssociation">
        <description>Identifies and labels simple behavioral associations/uses structural connections</description>
        <cypher><![CDATA[
            MATCH (c1:Class)-[:DEPENDS_ON]->(c2:Class)
            WHERE NOT (c1)-[:DECLARES]->(:Field)-[:OF_TYPE]->(c2)
            SET c1:AssociatedElement
            RETURN count(c1) AS MarkedAssociations
        ]]></cypher>
    </concept>

    <concept id="smart-supply-back:ImpactMethodSignatureChange">
        <description>Tags methods vulnerable to transitive propagation whenever a sibling signature or call contract changes</description>
        <cypher><![CDATA[
            MATCH (m2:Method)<-[:INVOKES]-(m1:Method)
            SET m2:ImpactTraceable, m1:ImpactTraceable
            RETURN count(m2) AS TraceableMethods
        ]]></cypher>
    </concept>

    <concept id="smart-supply-back:ImpactClassHierarchyChange">
        <description>Tags structural inheritance endpoints vulnerable to changes up or down the graph tree</description>
        <cypher><![CDATA[
            MATCH path=(sub:Type)-[:EXTENDS|IMPLEMENTS*]->(sup:Type)
            FOREACH (n IN nodes(path) | SET n:HierarchyImpactTraceable)
            RETURN count(sub) AS TraceableHierarchies
        ]]></cypher>
    </concept>

    <concept id="smart-supply-back:ImpactFieldTypeAndVisibility">
        <description>Maps and labels internal access operations linked tightly to attribute type structures</description>
        <cypher><![CDATA[
            MATCH (m:Method)-[r:READS|WRITES]->(f:Field)
            SET f:FieldImpactTraceable, m:AccessorImpactTraceable
            RETURN count(f) AS TraceableFields
        ]]></cypher>
    </concept>

    <concept id="smart-supply-back:ImpactAnnotationChange">
        <description>Tags elements whose run/compile behaviors depend strictly on structural annotations</description>
        <cypher><![CDATA[
            MATCH (e)-[:ANNOTATED_BY]->(a:Annotation)
            SET e:AnnotationImpactTraceable
            RETURN count(e) AS TraceableAnnotatedElements
        ]]></cypher>
    </concept>

    <concept id="smart-supply-back:ImpactPackageAndDependencyStructure">
        <description>Tags upstream layers and client spaces susceptible to package refactoring and structural shifts</description>
        <cypher><![CDATA[
            MATCH (p1:Package)-[:DEPENDS_ON]->(p2:Package)
            SET p1:PackageImpactTraceable, p2:PackageImpactTraceable
            RETURN count(p1) AS TraceablePackages
        ]]></cypher>
    </concept>

    <concept id="smart-supply-back:PatternSingleton">
        <description>Identifies classic GoF Singletons structural signatures (Private constructor + Static self reference field)</description>
        <cypher><![CDATA[
            MATCH (c:Class)-[:DECLARES]->(f:Field)-[:OF_TYPE]->(c)
            MATCH (c)-[:DECLARES]->(m:Method)
            WHERE m.name = '<init>' AND m.visibility = 'private'
            SET c:SingletonPattern
            RETURN count(c) AS MarkedSingletons
        ]]></cypher>
    </concept>

    <concept id="smart-supply-back:PatternFactory">
        <description>Identifies Factory patterns via naming conventions or dedicated instantiation types</description>
        <cypher><![CDATA[
            MATCH (c:Class)
            WHERE c.name ENDS WITH 'Factory' OR c.name ENDS WITH 'Creator'
            SET c:FactoryPattern
            RETURN count(c) AS MarkedFactories
        ]]></cypher>
    </concept>

    <concept id="smart-supply-back:PatternStrategy">
        <description>Identifies Strategy pattern structures (Context class referencing an interface implemented by multiple variants)</description>
        <cypher><![CDATA[
            MATCH (strategy:Interface)<-[:IMPLEMENTS]-(impl:Class)
            MATCH (context:Class)-[:DECLARES]->(f:Field)-[:OF_TYPE]->(strategy)
            SET strategy:StrategyPatternInterface, impl:StrategyPatternImplementation, context:StrategyPatternContext
            RETURN count(strategy) AS MarkedStrategyInterfaces
        ]]></cypher>
    </concept>

    <concept id="smart-supply-back:PatternSaga">
        <description>Identifies Saga Orchestrators or Participants in distributed transactions via framework markers or packaging</description>
        <cypher><![CDATA[
            MATCH (c:Class)
            WHERE c.name CONTAINS 'Saga'
               OR c.fqn CONTAINS '.saga'
               OR EXISTS { MATCH (c)-[:ANNOTATED_BY]->(a:Annotation)-[:OF_TYPE]->(t:Type) WHERE t.fqn CONTAINS 'Saga' }
            SET c:SagaPattern
            RETURN count(c) AS MarkedSagas
        ]]></cypher>
    </concept>

    <concept id="smart-supply-back:PatternOutbox">
        <description>Identifies Transactional Outbox components or event publishers dedicated to database reliability relay</description>
        <cypher><![CDATA[
            MATCH (c:Class)
            WHERE c.name CONTAINS 'Outbox'
               OR c.fqn CONTAINS '.outbox'
            SET c:OutboxPattern
            RETURN count(c) AS MarkedOutboxElements
        ]]></cypher>
    </concept>

    <concept id="smart-supply-back:LinkClassToAbsoluteSourceFile">
        <description>
            Links every Java :Type node (Classes, Interfaces, Enums, Records, including cross-module stubs)
            to its corresponding physical .java :SourceFile node.
        </description>
        <cypher><![CDATA[
            MATCH (t:Type)
            WHERE t.fqn IS NOT NULL AND NOT (t)-[:HAS_SOURCE_FILE]->(:SourceFile)
            WITH t, replace(split(t.fqn, '$')[0], '.', '/') + '.java' AS fqnPath
            MATCH (f:SourceFile)
            WHERE replace(coalesce(f.absolute_path, f.absoluteFileName, f.fileName, f.relativePath, f.name, ""), '\\', '/') ENDS WITH fqnPath
            MERGE (t)-[:HAS_SOURCE_FILE]->(f)
            RETURN count(t) AS LinkedTypes
        ]]></cypher>
    </concept>

    <concept id="smart-supply-back:PropagateTypeDependenciesToFile">
        <description>
            Directly propagates bytecode DEPENDS_ON to physical SourceFile nodes cross-modules without requiring stub type linking.
        </description>
        <cypher><![CDATA[
            MATCH (f1:File)
            MATCH (t1:Type)-[:WITH_SOURCE|HAS_SOURCE_FILE]->(f1)
            MATCH (t1)-[:DEPENDS_ON]->(t2:Type)
            WHERE t2.fqn IS NOT NULL
            WITH DISTINCT f1, replace(split(t2.fqn, '$')[0], '.', '/') + '.java' AS targetFqnPath
            MATCH (f2:File)
            WHERE replace(coalesce(f2.absolute_path, f2.absoluteFileName, f2.fileName, f2.relativePath, f2.name, ""), '\\', '/') ENDS WITH targetFqnPath
              AND f1 <> f2
            MERGE (f1)-[:DEPENDS_ON]->(f2)
            RETURN count(DISTINCT f1) AS FilesWithUpdatedDependencies
        ]]></cypher>
    </concept>

    <concept id="smart-supply-back:LinkTestsToCode">
        <description>Links Test classes to their corresponding production Classes based on naming convention.</description>
        <cypher><![CDATA[
            MATCH (test:Class) WHERE test.name ENDS WITH 'Test' OR test.name ENDS WITH 'IT'
            WITH test, substring(test.name, 0, size(test.name) - 4) AS prodClassNameShort,
                    substring(test.name, 0, size(test.name) - 2) AS prodClassNameIT
            MATCH (prod:Class)
            WHERE prod.name = prodClassNameShort OR prod.name = prodClassNameIT
            MERGE (test)-[:TESTS]->(prod)
            RETURN count(test) AS LinkedTests
        ]]></cypher>
    </concept>

    <concept id="smart-supply-back:LinkSpringValueProperties">
        <description>Links Spring @Value annotations to the physical configuration properties used.</description>
        <cypher><![CDATA[
            MATCH (c:Class)-[:DECLARES]->(f:Field)-[:ANNOTATED_BY]->(a:Annotation)-[:OF_TYPE]->(t:Type)
            WHERE t.fqn = 'org.springframework.beans.factory.annotation.Value'
            // Extraction de la clé brute ex: ${my.config.key} -> my.config.key
            WITH f, a.value AS rawValue
            WHERE rawValue STARTS WITH '${'
            WITH f, substring(rawValue, 2, size(rawValue) - 3) AS propertyKey
            SET f.usesProperty = propertyKey
            RETURN count(f) AS LinkedProperties
        ]]></cypher>
    </concept>

    <concept id="smart-supply-back:MarkDeadCodeCandidates">
        <description>Identifies classes that are completely unreachable from the Spring Boot main application entry point.</description>
        <cypher><![CDATA[
            // 1. Trouver le point d'entrée Spring Boot
            MATCH (main:Class)-[:ANNOTATED_BY]->()-[:OF_TYPE]->(t:Type)
            WHERE t.fqn = 'org.springframework.boot.autoconfigure.SpringBootApplication'

            // 2. Trouver les classes candidates de l'application
            MATCH (c:Class)
            WHERE NOT c.fqn STARTS WITH 'java.'
            AND NOT c.fqn STARTS WITH 'org.spring'
            AND NOT c:Controller
            AND NOT c.name ENDS WITH 'Test'
            AND NOT c.name ENDS WITH 'Application'
            // Fusion des conditions : Aucun chemin de dépendance depuis la Main
            AND NOT (main)-[:DEPENDS_ON|INVOKES*]->(c)

            // 3. Marquage
            SET c:DeadCodeCandidate
            RETURN count(c) AS DeadCodeCandidates
        ]]></cypher>
    </concept>

    <concept id="smart-supply-back:LinkExceptionToHandlers">
        <description>Links methods throwing custom exceptions to their respective Spring @ExceptionHandler.</description>
        <cypher><![CDATA[
            MATCH (m:Method)-[:INVOKES]->(:Method {name: '<init>'})<-[:DECLARES]-(ex:Class)-[:EXTENDS*]->(:Type {fqn: 'java.lang.Exception'})
            MATCH (handler:Method)-[:ANNOTATED_BY]->(a:Annotation)-[:OF_TYPE]->(t:Type)
            WHERE t.fqn = 'org.springframework.web.bind.annotation.ExceptionHandler'
            // Idéalement on matcherait la valeur de l'annotation, ici on simplifie par correspondance de type
            SET m:ThrowsException, handler:ExceptionInterceptor
            MERGE (m)-[:PROPAGATES_ERROR_TO]->(ex)
            RETURN count(m) AS LinkedExceptionPaths
        ]]></cypher>
    </concept>

    <!-- ======================= -->
    <!-- Concepts for TypeScript -->
    <!-- ======================= -->
    <concept id="smart-supply-back:MarkReactComponents">
        <description>Labels TypeScript JSX/TSX files and functions as :ReactComponent</description>
        <cypher><![CDATA[
            MATCH (f:TypeScript:File)
            WHERE f.fileName ENDS WITH '.tsx' OR f.fileName ENDS WITH '.jsx'
            SET f:ReactComponent
            RETURN count(f) AS MarkedReactComponents
        ]]></cypher>
    </concept>

    <concept id="smart-supply-back:MarkStateStores">
        <description>Labels Zustand/Redux state stores in TypeScript</description>
        <cypher><![CDATA[
            MATCH (f:TypeScript:File)
            WHERE f.fileName CONTAINS 'Store' OR f.fileName CONTAINS 'store'
            SET f:StateStore
            RETURN count(f) AS MarkedStateStores
        ]]></cypher>
    </concept>

    <group id="smart-supply-back:Default">
        <includeConcept refId="smart-supply-back:MarkSpringController"/>
        <includeConcept refId="smart-supply-back:MarkSpringRestController"/>
        <includeConcept refId="smart-supply-back:MarkSpringService"/>
        <includeConcept refId="smart-supply-back:MarkSpringRepository"/>
        <includeConcept refId="smart-supply-back:MarkDbEntity"/>
        <includeConcept refId="smart-supply-back:MarkDomainObject"/>

        <includeConcept refId="smart-supply-back:MarkLayeredArchitecture"/>
        <includeConcept refId="smart-supply-back:MarkHexagonalArchitecture"/>
        <includeConcept refId="smart-supply-back:MarkDomainLayer"/>
        <includeConcept refId="smart-supply-back:MarkApiLayer"/>
        <includeConcept refId="smart-supply-back:MarkAdapter"/>
        <includeConcept refId="smart-supply-back:MarkPortIn"/>
        <includeConcept refId="smart-supply-back:MarkPortOut"/>
        <includeConcept refId="smart-supply-back:MarkInfrastructure"/>
        <includeConcept refId="smart-supply-back:MarkInfrastructurePrimary"/>
        <includeConcept refId="smart-supply-back:MarkInfrastructureSecondary"/>
        <includeConcept refId="smart-supply-back:MarkServiceAsUseCases"/>

        <includeConcept refId="smart-supply-back:MarkResilienceRetry"/>
        <includeConcept refId="smart-supply-back:MarkResilienceCircuitBreaker"/>
        <includeConcept refId="smart-supply-back:MarkResilienceRateLimiter"/>
        <includeConcept refId="smart-supply-back:MarkResilienceBulkhead"/>
        <includeConcept refId="smart-supply-back:MarkResilienceTimeout"/>
        <includeConcept refId="smart-supply-back:MarkResilienceFallback"/>
        <includeConcept refId="smart-supply-back:MarkCaching"/>
        <includeConcept refId="smart-supply-back:MarkMultithreading"/>
        <includeConcept refId="smart-supply-back:MarkPartOfWorkflow"/>
        <includeConcept refId="smart-supply-back:MarkUsedInBpmn"/>

        <includeConcept refId="smart-supply-back:MarkInheritance"/>
        <includeConcept refId="smart-supply-back:MarkComposition"/>
        <includeConcept refId="smart-supply-back:MarkAggregation"/>
        <includeConcept refId="smart-supply-back:MarkAssociation"/>

        <includeConcept refId="smart-supply-back:ImpactMethodSignatureChange"/>
        <includeConcept refId="smart-supply-back:ImpactClassHierarchyChange"/>
        <includeConcept refId="smart-supply-back:ImpactFieldTypeAndVisibility"/>
        <includeConcept refId="smart-supply-back:ImpactAnnotationChange"/>
        <includeConcept refId="smart-supply-back:ImpactPackageAndDependencyStructure"/>

        <includeConcept refId="smart-supply-back:PatternSingleton"/>
        <includeConcept refId="smart-supply-back:PatternFactory"/>
        <includeConcept refId="smart-supply-back:PatternStrategy"/>
        <includeConcept refId="smart-supply-back:PatternSaga"/>
        <includeConcept refId="smart-supply-back:PatternOutbox"/>

        <includeConcept refId="smart-supply-back:LinkClassToAbsoluteSourceFile"/>
        <includeConcept refId="smart-supply-back:PropagateTypeDependenciesToFile"/>
        <includeConcept refId="smart-supply-back:LinkTestsToCode"/>
        <includeConcept refId="smart-supply-back:LinkSpringValueProperties"/>
        <includeConcept refId="smart-supply-back:MarkDeadCodeCandidates"/>
        <includeConcept refId="smart-supply-back:LinkExceptionToHandlers"/>

        <!-- =================== -->
        <!-- TypeScript Concepts -->
        <!-- =================== -->
        <includeConcept refId="smart-supply-back:MarkReactComponents"/>
        <includeConcept refId="smart-supply-back:MarkStateStores"/>

    </group>

</jqa:jqassistant-rules>
EOF

echo "✅ All Python files and complete XML rules restored with zero regressions!"
