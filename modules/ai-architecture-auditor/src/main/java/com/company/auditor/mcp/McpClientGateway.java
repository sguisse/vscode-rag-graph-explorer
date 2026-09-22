package com.company.auditor.mcp;

import com.company.auditor.analyzers.nl2cypher.Nl2CypherAgent;
import com.company.auditor.analyzers.rasa.RasaIndexEngine;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.stereotype.Component;

import java.util.List;
import java.util.Map;

/**
 * Model Context Protocol (MCP) Tool Gateway & AI Assistant Integration (Workstream 2 / Phase 2).
 * Exposes high-level architectural analysis tools (nl2cypher_query, rasa_context, hexagonal_check)
 * to external AI assistants (Cursor, VS Code, Claude Code).
 */
@Component
public class McpClientGateway {

    private static final Logger log = LoggerFactory.getLogger(McpClientGateway.class);

    private final Nl2CypherAgent nl2CypherAgent;
    private final RasaIndexEngine rasaIndexEngine;

    public record McpToolRequest(String toolName, Map<String, Object> arguments) {}
    public record McpToolResponse(boolean success, String toolName, Object content, String errorMessage) {}

    @Autowired
    public McpClientGateway(@Autowired(required = false) @Qualifier("nl2CypherAnalyzerAgent") Nl2CypherAgent nl2CypherAgent,
                            @Autowired(required = false) RasaIndexEngine rasaIndexEngine) {
        this.nl2CypherAgent = nl2CypherAgent;
        this.rasaIndexEngine = rasaIndexEngine;
    }

    public List<String> listAvailableTools() {
        return List.of(
                "query_code_graph_cypher",
                "assemble_rasa_context",
                "execute_hexagonal_check"
        );
    }

    public McpToolResponse handleMcpToolCall(McpToolRequest request) {
        if (request == null || request.toolName() == null) {
            return new McpToolResponse(false, "unknown", null, "Invalid MCP tool request");
        }

        log.info("🔌 [MCP Gateway] Received tool invocation: '{}'", request.toolName());

        switch (request.toolName()) {
            case "query_code_graph_cypher" -> {
                String naturalQuery = (String) request.arguments().getOrDefault("query", "Show all REST endpoints");
                if (nl2CypherAgent != null) {
                    var result = nl2CypherAgent.executeNaturalLanguageQuery(naturalQuery);
                    return new McpToolResponse(result.success(), request.toolName(), result, result.errorMessage());
                }
                return new McpToolResponse(false, request.toolName(), null, "NL2CypherAgent not available");
            }
            case "assemble_rasa_context" -> {
                String symbol = (String) request.arguments().getOrDefault("symbol", "OrderService");
                String runId = (String) request.arguments().getOrDefault("runId", "run-mcp");
                if (rasaIndexEngine != null) {
                    var result = rasaIndexEngine.assembleRasaContext(symbol, "MCP context fetch", runId);
                    return new McpToolResponse(true, request.toolName(), result, null);
                }
                return new McpToolResponse(false, request.toolName(), null, "RasaIndexEngine not available");
            }
            default -> {
                return new McpToolResponse(false, request.toolName(), null, "Unsupported MCP tool name: " + request.toolName());
            }
        }
    }
}