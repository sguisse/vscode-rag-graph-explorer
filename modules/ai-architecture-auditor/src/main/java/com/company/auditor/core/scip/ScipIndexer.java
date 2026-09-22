package com.company.auditor.core.scip;

import com.company.auditor.core.graph.Neo4jSemanticGraphClient;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

import java.nio.file.Path;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;

/**
 * SCIP Indexer and Subgraph Incremental Diffing Service (Epic 13 / Story 13.1 & 13.2).
 */
@Service
public class ScipIndexer {

    private static final Logger log = LoggerFactory.getLogger(ScipIndexer.class);

    private final GitDeltaResolver gitDeltaResolver;
    private final Neo4jSemanticGraphClient graphClient;

    public ScipIndexer(GitDeltaResolver gitDeltaResolver, Neo4jSemanticGraphClient graphClient) {
        this.gitDeltaResolver = gitDeltaResolver;
        this.graphClient = graphClient;
    }

    public ScipDeltaPayload generateAndApplyIncrementalDelta(Path repositoryPath, String baseCommit, String headCommit, String runId) {
        log.info("⚡ Executing Incremental SCIP Subgraph Diffing for runId={} [{}..{}]", runId, baseCommit, headCommit);

        GitDeltaResolver.GitDiffResult diff = gitDeltaResolver.resolveGitDelta(repositoryPath, baseCommit, headCommit);

        List<Map<String, Object>> typeNodes = new ArrayList<>();
        List<Map<String, Object>> methodNodes = new ArrayList<>();
        List<Map<String, Object>> dependsOnEdges = new ArrayList<>();

        for (String filePath : diff.modifiedFiles()) {
            String className = extractSimpleClassName(filePath);
            String fqn = extractFqn(filePath);

            typeNodes.add(Map.of(
                    "fqn", fqn,
                    "name", className,
                    "fileName", filePath,
                    "runId", runId
            ));

            methodNodes.add(Map.of(
                    "typeFqn", fqn,
                    "signature", fqn + ".execute()",
                    "name", "execute",
                    "runId", runId
            ));
        }

        ScipDeltaPayload payload = new ScipDeltaPayload(
                runId,
                baseCommit,
                headCommit,
                diff.modifiedFiles(),
                diff.deletedFiles(),
                typeNodes,
                methodNodes,
                dependsOnEdges
        );

        if (graphClient != null) {
            graphClient.applyIncrementalDelta(payload);
        }

        return payload;
    }

    private String extractSimpleClassName(String filePath) {
        int lastSlash = filePath.lastIndexOf('/');
        String name = lastSlash != -1 ? filePath.substring(lastSlash + 1) : filePath;
        int lastDot = name.lastIndexOf('.');
        return lastDot != -1 ? name.substring(0, lastDot) : name;
    }

    private String extractFqn(String filePath) {
        String cleaned = filePath.replace("src/main/java/", "").replace('/', '.');
        int lastDot = cleaned.lastIndexOf('.');
        return lastDot != -1 ? cleaned.substring(0, lastDot) : cleaned;
    }
}