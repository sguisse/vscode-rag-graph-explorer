import sys
import subprocess
from core.utils import info, error

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
            self.driver = GraphDatabase.driver(uri, auth=auth)
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
