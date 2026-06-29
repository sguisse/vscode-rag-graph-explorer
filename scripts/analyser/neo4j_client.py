from core.utils import info

class Neo4jClient:
    def __init__(self, uri: str, auth: tuple):
        self.uri = uri
        self.auth = auth
        self._connected = True
        info(f"Bolt transaction network initialized targeting embedded loop: {self.uri}", component="Neo4jClient")

    def close(self):
        self._connected = False

    def execute_write(self, cypher_query: str, parameters: dict = None):
        if not self._connected:
            raise RuntimeError("Inability to post mutations against a terminated server thread context.")
        pass
