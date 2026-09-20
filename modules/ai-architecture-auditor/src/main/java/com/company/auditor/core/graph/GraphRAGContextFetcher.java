package com.company.auditor.core.graph;

import com.company.auditor.core.domain.GraphSubTree;
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

    /**
     * Extracts a minified graph sub-tree for a given target class or symbol up to specified hop depth.
     */
    public GraphSubTree fetchMinifiedContext(String targetSymbol, int depth) {
        return graphClient.extractMinifiedSubTree(targetSymbol, depth);
    }

    /**
     * Formats a GraphSubTree into a compact prompt string for LLM triage context window.
     */
    public String formatForPrompt(GraphSubTree subTree) {
        StringBuilder sb = new StringBuilder();
        sb.append("TARGET SYMBOL: ").append(subTree.targetSymbol()).append("\n");
        sb.append("GRAPH CONNECTIVITY (Hop Depth ").append(subTree.hopDepth()).append("):\n");

        for (Map<String, Object> node : subTree.nodes()) {
            sb.append("  - NODE: ").append(node.get("fqn")).append("\n");
        }

        return sb.toString();
    }
}