package com.company.auditor.docascode;

import com.company.auditor.core.graph.Neo4jSemanticGraphClient;
import com.company.auditor.docgen.MermaidPngExporter;
import com.company.auditor.docgen.PlantUmlPngRenderer;
import com.company.auditor.docgen.PlantUmlToMermaidConverter;

/**
 * Bridge class extending canonical com.company.auditor.docgen.C4DiagramExtractor
 * without default @Component annotation to resolve Spring BeanName collision.
 */
public class C4DiagramExtractor extends com.company.auditor.docgen.C4DiagramExtractor {

    public C4DiagramExtractor() {
        super();
    }

    public C4DiagramExtractor(Neo4jSemanticGraphClient graphClient) {
        super(graphClient);
    }

    public C4DiagramExtractor(Neo4jSemanticGraphClient graphClient,
                              PlantUmlPngRenderer plantUmlPngRenderer,
                              MermaidPngExporter mermaidPngExporter) {
        super(graphClient, plantUmlPngRenderer, mermaidPngExporter);
    }

    public C4DiagramExtractor(Neo4jSemanticGraphClient graphClient,
                              PlantUmlPngRenderer plantUmlPngRenderer,
                              MermaidPngExporter mermaidPngExporter,
                              PlantUmlToMermaidConverter plantUmlToMermaidConverter) {
        super(graphClient, plantUmlPngRenderer, mermaidPngExporter, plantUmlToMermaidConverter);
    }
}