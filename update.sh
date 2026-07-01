#!/usr/bin/env bash
set -e

# Ensure the targeted directory path exists securely
mkdir -p scripts/analyser/tools/neo4j

# Completely rewrite neo4j_client.py to aggressively suppress and mute database server warning notification logs
cat << 'EOF' > scripts/analyser/tools/neo4j/neo4j_client.py
import sys
import subprocess
import logging
import warnings
from core.utils import info, error

# Force total muting of the internal neo4j driver log streams and notification handlers
logging.getLogger("neo4j").setLevel(logging.ERROR)
logging.getLogger("neo4j.notifications").setLevel(logging.ERROR)
warnings.filterwarnings("ignore", message=".*notification.*")
warnings.filterwarnings("ignore", message=".*DBMS.*")

# Secure dynamic runtime provisioning of the official python driver dependency
try:
    from neo4j import GraphDatabase
except ImportError:
    info("Provisioning missing python package dependency layer: 'neo4j' driver client...", component="Neo4jClient")
    try:
        subprocess.run([sys.executable, "-m", "pip", "install", "neo4j", "--break-system-packages"], stdout=subprocess.PIPE, stderr=subprocess.PIPE)
        from neo4j import GraphDatabase
    except Exception as e:
        error(f"Failed to download and register official neo4j driver module dependencies: {e}", component="Neo4jClient")
        raise e

class Neo4jClient:
    def __init__(self, uri: str, auth: tuple):
        self.uri = uri
        self.auth = auth
        try:
            # Pass configurations to deactivate notification callbacks inside the driver context session
            self.driver = GraphDatabase.driver(
                uri,
                auth=auth,
                notifications_min_severity="OFF"
            )
            # Verify connectivity state immediately upon initiation
            self.driver.verify_connectivity()
            self._connected = True
            info(f"Bolt transaction network channel fully active and listening: {self.uri}", component="Neo4jClient")
        except Exception as err:
            self._connected = False
            error(f"Database network connection mapping failure over endpoint [{uri}]: {err}", component="Neo4jClient")

    def close(self):
        if hasattr(self, "driver") and self.driver:
            self.driver.close()
        self._connected = False
        info("Bolt network driver connection pool closed down cleanly.", component="Neo4jClient")

    def execute_write(self, cypher_query: str, parameters: dict = None):
        if not self._connected:
            error("Cannot post structural mutations against an uninitialized or dead database instance profile.", component="Neo4jClient")
            return

        if parameters is None:
            parameters = {}

        try:
            with self.driver.session() as session:
                session.execute_write(lambda tx: tx.run(cypher_query, parameters))
        except Exception as query_fault:
            error(f"Cypher statement execution execution block aborted: {query_fault}\nQuery: {cypher_query}", component="Neo4jClient")
EOF

# Recompile extension to synchronize script tracking contexts
npm run compile

echo "✅ fix: Configured explicit logging filters and 'notifications_min_severity=OFF' inside 'neo4j_client.py' to suppress verbose DBMS server unindexed multi-label notification alerts."
