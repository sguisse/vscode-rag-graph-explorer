package com.company.auditor.core.graph;

import com.company.auditor.core.domain.GraphSubTree;
import com.company.auditor.core.domain.Observation;
import org.springframework.stereotype.Component;

import java.util.List;
import java.util.Map;

/**
 * jQAssistant Graph RAG Context Fetcher.
 * Fetches minified 2-hop AST and dependency sub-trees from Neo4j to feed LLM triage prompts (<1,500 tokens).
 */
@Component
public class GraphRAGContextFetcher {

    private final Neo4jSemanticGraphClient graphClient;

    public GraphRAGContextFetcher(Neo4jSemanticGraphClient graphClient) {
        this.graphClient = graphClient;
    }

    public GraphSubTree fetchContextForSymbol(String symbol, int depth) {
        if (graphClient != null) {
            return graphClient.extractMinifiedSubTree(symbol, depth);
        }
        return new GraphSubTree(symbol, depth, List.of(), List.of(), 0);
    }

    public GraphSubTree fetchContextForObservation(Observation observation, int depth) {
        String symbol = (observation != null && observation.location() != null && observation.location().symbol() != null)
                ? observation.location().symbol()
                : "N/A";
        return fetchContextForSymbol(symbol, depth);
    }

    public String formatSubTreeForPrompt(GraphSubTree subTree) {
        if (subTree == null || subTree.nodes() == null) {
            return "";
        }
        StringBuilder sb = new StringBuilder();
        sb.append("SUB-TREE CONTEXT (Symbol: ").append(subTree.targetSymbol()).append("):\n");
        for (Map<String, Object> node : subTree.nodes()) {
            sb.append("  - NODE: ").append(node.get("fqn")).append("\n");
        }
        return sb.toString();
    }
}