package com.company.auditor.drivers.java;

import com.company.auditor.core.domain.AnalysisContext;
import com.company.auditor.core.domain.Observation;
import com.company.auditor.core.spi.LanguageDriver;
import org.springframework.stereotype.Component;

import java.nio.file.Files;
import java.nio.file.Path;
import java.util.ArrayList;
import java.util.List;

@Component
public class JavaSpringDriver implements LanguageDriver {

    @Override
    public String id() {
        return "java-spring-boot";
    }

    @Override
    public boolean supports(Path repositoryPath) {
        return Files.exists(repositoryPath.resolve("pom.xml")) || Files.exists(repositoryPath.resolve("build.gradle"));
    }

    @Override
    public void buildCodeGraph(Path repositoryPath, String runId) {
        // Triggers jQAssistant CLI scan to populate Neo4j with :Type, :Method, :DEPENDS_ON nodes
    }

    @Override
    public List<Observation> executeStaticRules(AnalysisContext context) {
        return new ArrayList<>();
    }
}