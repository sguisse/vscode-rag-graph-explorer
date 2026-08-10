# Call MCP Server from Curl


``bash
SESSION_ID=$(curl -sS -D - -o /dev/null -X POST http://127.0.0.1:8800/mcp/ \
  -H 'Content-Type: application/json' \
  -H 'Accept: application/json, text/event-stream' \
  -d '{
    "jsonrpc": "2.0",
    "id": 1,
    "method": "initialize",
    "params": {
      "protocolVersion": "2024-11-05",
      "capabilities": {},
      "clientInfo": {"name": "curl-client", "version": "1.0.0"}
    }
  }' | grep -i "^mcp-session-id:" | awk '{print $2}' | tr -d '\r')

echo "Session ID: $SESSION_ID"
```


``bash
curl -N -sS -X POST http://127.0.0.1:8800/mcp/ \
  -H 'Content-Type: application/json' \
  -H 'Accept: application/json, text/event-stream' \
  -H "mcp-session-id: $SESSION_ID" \
  -d '{
    "jsonrpc": "2.0",
    "id": 2,
    "method": "tools/call",
    "params": {
      "name": "get_graph_schema",
      "arguments": {}
    }
  }' | tr '\r' '\n'
```


```bash
curl -N -sS -X POST http://127.0.0.1:8800/mcp/ \
  -H 'Content-Type: application/json' \
  -H 'Accept: application/json, text/event-stream' \
  -H "mcp-session-id: $SESSION_ID" \
  -d '{
    "jsonrpc": "2.0",
    "id": 2,
    "method": "tools/call",
    "params":{
      "name":"execute_cypher_query",
      "arguments":{"query":"MATCH (c:Java:Type:Class) RETURN count(c) AS n"}
    }
  }' | tr '\r' '\n'
```
