package com.company.auditor.drivers.java;

import org.springframework.stereotype.Service;

import java.io.BufferedReader;
import java.io.InputStreamReader;
import java.nio.file.Path;
import java.util.ArrayList;
import java.util.List;

/**
 * Process runner for executing jQAssistant CLI commands to scan Spring Boot codebases into Neo4j.
 */
@Service
public class JQAssistantScannerService {

    /**
     * Invokes jQAssistant CLI to scan target project directory and push AST nodes into Neo4j.
     */
    public boolean scanRepository(Path repositoryPath, String runId) {
        try {
            List<String> command = List.of(
                    "jqassistant", "scan",
                    "-f", repositoryPath.toString(),
                    "-DrunId=" + runId
            );

            ProcessBuilder pb = new ProcessBuilder(command);
            pb.redirectErrorStream(true);
            Process process = pb.start();

            try (BufferedReader reader = new BufferedReader(new InputStreamReader(process.getInputStream()))) {
                String line;
                while ((line = reader.readLine()) != null) {
                    // Log scanning output
                }
            }

            int exitCode = process.waitFor();
            return exitCode == 0;
        } catch (Exception e) {
            System.err.println("jQAssistant scanning execution failed: " + e.getMessage());
            return false;
        }
    }
}