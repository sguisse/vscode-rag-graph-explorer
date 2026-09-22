package com.company.auditor.docgen;

import net.sourceforge.plantuml.FileFormat;
import net.sourceforge.plantuml.FileFormatOption;
import net.sourceforge.plantuml.SourceStringReader;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

import java.io.FileOutputStream;
import java.io.OutputStream;
import java.nio.file.Files;
import java.nio.file.Path;

/**
 * Renders PlantUML DSL strings into PNG image artifacts.
 */
@Service
public class PlantUmlPngRenderer {

    private static final Logger log = LoggerFactory.getLogger(PlantUmlPngRenderer.class);

    /**
     * Converts a PlantUML DSL string into a PNG file.
     *
     * @param plantUmlContent Raw PlantUML source (@startuml ... @enduml)
     * @param outputPngPath Path where the PNG image will be saved
     * @return Path to the generated PNG file
     */
    public Path renderPlantUmlToPng(String plantUmlContent, Path outputPngPath) {
        log.info("🎨 Rendering PlantUML diagram to PNG: {}", outputPngPath);
        try {
            if (outputPngPath.getParent() != null) {
                Files.createDirectories(outputPngPath.getParent());
            }

            SourceStringReader reader = new SourceStringReader(plantUmlContent);
            try (OutputStream os = new FileOutputStream(outputPngPath.toFile())) {
                reader.outputImage(os, new FileFormatOption(FileFormat.PNG));
            }

            log.info("✅ PlantUML PNG rendering complete. Output size: {} bytes", outputPngPath.toFile().length());
            return outputPngPath;
        } catch (Exception e) {
            log.error("❌ Failed to render PlantUML content to PNG: {}", e.getMessage(), e);
            throw new RuntimeException("PlantUML PNG rendering failed", e);
        }
    }
}