package com.company.auditor.core.scip;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Component;

import java.io.BufferedReader;
import java.io.InputStreamReader;
import java.nio.file.Path;
import java.util.ArrayList;
import java.util.List;

/**
 * Git Delta AST Extractor & SCIP Diff Engine (Epic 13 / Story 13.1).
 * Resolves modified file paths between Git commits for incremental AST parsing.
 */
@Component
public class GitDeltaResolver {

    private static final Logger log = LoggerFactory.getLogger(GitDeltaResolver.class);

    public record GitDiffResult(
            String baseCommit,
            String headCommit,
            List<String> modifiedFiles,
            List<String> deletedFiles
    ) {}

    /**
     * Resolves changed files between baseCommit and headCommit in repositoryPath.
     */
    public GitDiffResult resolveGitDelta(Path repositoryPath, String baseCommit, String headCommit) {
        log.info("🔍 Resolving Git diff between {}..{} in {}", baseCommit, headCommit, repositoryPath);
        List<String> modified = new ArrayList<>();
        List<String> deleted = new ArrayList<>();

        try {
            List<String> command = List.of("git", "diff", "--name-status", baseCommit + ".." + headCommit);
            ProcessBuilder pb = new ProcessBuilder(command);
            pb.directory(repositoryPath.toFile());
            pb.redirectErrorStream(true);
            Process process = pb.start();

            try (BufferedReader reader = new BufferedReader(new InputStreamReader(process.getInputStream()))) {
                String line;
                while ((line = reader.readLine()) != null) {
                    String[] parts = line.trim().split("\\s+", 2);
                    if (parts.length == 2) {
                        String status = parts[0];
                        String filePath = parts[1];
                        if (isSupportedSourceFile(filePath)) {
                            if ("D".equals(status)) {
                                deleted.add(filePath);
                            } else {
                                modified.add(filePath);
                            }
                        }
                    }
                }
            }

            int exitCode = process.waitFor();
            log.info("Git diff resolution completed (exitCode={}). Modified: {}, Deleted: {}", exitCode, modified.size(), deleted.size());
            return new GitDiffResult(baseCommit, headCommit, modified, deleted);
        } catch (Exception e) {
            log.warn("⚠️ Git diff resolution failed ({}), falling back to empty delta", e.getMessage());
            return new GitDiffResult(baseCommit, headCommit, List.of(), List.of());
        }
    }

    private boolean isSupportedSourceFile(String filePath) {
        return filePath.endsWith(".java") || filePath.endsWith(".ts") || filePath.endsWith(".tsx") || filePath.endsWith(".py");
    }
}
