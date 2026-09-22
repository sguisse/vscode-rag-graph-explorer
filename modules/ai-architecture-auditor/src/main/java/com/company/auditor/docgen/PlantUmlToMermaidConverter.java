package com.company.auditor.docgen;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Component;

import java.util.ArrayList;
import java.util.List;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

/**
 * Converts PlantUML DSL strings into Mermaid flowchart DSL syntax,
 * preserving exact hex colors, C4 element styling, and BPMN task status colors.
 */
@Component
public class PlantUmlToMermaidConverter {

    private static final Logger log = LoggerFactory.getLogger(PlantUmlToMermaidConverter.class);

    private static final Pattern CIRCLE_PATTERN = Pattern.compile("circle\\s+\"([^\"]+)\"\\s+as\\s+([A-Za-z0-9_]+)(?:\\s+(#?([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3}|[a-zA-Z]+)))?");
    private static final Pattern CARD_PATTERN = Pattern.compile("card\\s+\"([^\"]+)\"\\s+as\\s+([A-Za-z0-9_]+)(?:\\s+(#?([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3}|[a-zA-Z]+)))?");
    private static final Pattern RECTANGLE_PATTERN = Pattern.compile("rectangle\\s+\"([^\"]+)\"(?:\\s+(#?([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3}|[a-zA-Z]+)))?\\s*\\{");

    /**
     * Converts PlantUML diagram DSL into equivalent styled Mermaid flowchart DSL.
     */
    public String convertPlantUmlToMermaid(String plantUmlDsl) {
        if (plantUmlDsl == null || plantUmlDsl.isBlank()) {
            return "flowchart TD\n    empty[\"Empty Diagram\"]";
        }

        StringBuilder mermaid = new StringBuilder();
        mermaid.append("flowchart TD\n");

        List<String> styleStatements = new ArrayList<>();
        String[] lines = plantUmlDsl.split("\r?\n");
        boolean inLegend = false;

        for (String line : lines) {
            String trimmed = line.trim();

            if (trimmed.startsWith("@startuml") || trimmed.startsWith("@enduml") || trimmed.startsWith("!include") || trimmed.startsWith("!pragma")) {
                continue;
            }

            if (trimmed.startsWith("legend") || trimmed.startsWith("endlegend")) {
                inLegend = trimmed.startsWith("legend");
                continue;
            }
            if (inLegend) {
                continue;
            }

            // Convert C4 Person: Person(alias, "Label", "Desc")
            if (trimmed.startsWith("Person(")) {
                String content = extractMacroArgs(trimmed, "Person");
                String[] args = parseArgs(content);
                if (args.length >= 2) {
                    String alias = cleanQuotes(args[0]);
                    String label = cleanQuotes(args[1]);
                    mermaid.append("    ").append(alias).append("[\"👤 ").append(label).append("\"]\n");
                    styleStatements.add("style " + alias + " fill:#08427B,stroke:#052E56,color:#ffffff,stroke-width:2px");
                }
                continue;
            }

            // Convert C4 Container: Container(alias, "Label", "Tech", "Desc")
            if (trimmed.startsWith("Container(") || trimmed.startsWith("ContainerDb(")) {
                boolean isDb = trimmed.startsWith("ContainerDb(");
                String macro = isDb ? "ContainerDb" : "Container";
                String content = extractMacroArgs(trimmed, macro);
                String[] args = parseArgs(content);
                if (args.length >= 2) {
                    String alias = cleanQuotes(args[0]);
                    String label = cleanQuotes(args[1]);
                    String icon = isDb ? "💾 " : "📦 ";
                    mermaid.append("    ").append(alias).append("[\"").append(icon).append(label);
                    if (args.length >= 3 && !args[2].isBlank()) {
                        mermaid.append(" (").append(cleanQuotes(args[2])).append(")");
                    }
                    mermaid.append("\"]\n");
                    styleStatements.add("style " + alias + " fill:#1168BD,stroke:#0B4884,color:#ffffff,stroke-width:2px");
                }
                continue;
            }

            // Convert C4 System_Boundary or rectangle container
            if (trimmed.startsWith("System_Boundary(") || trimmed.startsWith("rectangle ")) {
                if (trimmed.contains("{")) {
                    Matcher mRect = RECTANGLE_PATTERN.matcher(trimmed);
                    if (mRect.find()) {
                        String title = mRect.group(1);
                        String hexColor = mRect.group(3);
                        String subGraphId = title.replaceAll("[^a-zA-Z0-9_]", "_");
                        mermaid.append("    subgraph ").append(subGraphId).append(" [\"").append(title).append("\"]\n");
                        if (hexColor != null && !hexColor.isBlank()) {
                            String colorVal = hexColor.startsWith("#") ? hexColor : "#" + hexColor;
                            styleStatements.add("style " + subGraphId + " fill:" + colorVal + ",stroke:#90CAF9,stroke-width:1.5px");
                        } else {
                            styleStatements.add("style " + subGraphId + " fill:#FAFAFA,stroke:#438DD5,stroke-width:2px,stroke-dasharray:5 5");
                        }
                    } else if (trimmed.startsWith("System_Boundary(")) {
                        String title = extractBoundaryTitle(trimmed);
                        String subGraphId = title.replaceAll("[^a-zA-Z0-9_]", "_");
                        mermaid.append("    subgraph ").append(subGraphId).append(" [\"").append(title).append("\"]\n");
                        styleStatements.add("style " + subGraphId + " fill:#FAFAFA,stroke:#438DD5,stroke-width:2px,stroke-dasharray:5 5");
                    }
                }
                continue;
            }

            if (trimmed.equals("}")) {
                mermaid.append("    end\n");
                continue;
            }

            // Convert BPMN Control Nodes (circle "Start" as START #28a745)
            if (trimmed.startsWith("circle ")) {
                Matcher matcher = CIRCLE_PATTERN.matcher(trimmed);
                if (matcher.find()) {
                    String label = matcher.group(1);
                    String alias = matcher.group(2);
                    String hexColor = matcher.group(4);
                    mermaid.append("    ").append(alias).append("((\"").append(label).append("\"))\n");
                    if (hexColor != null && !hexColor.isBlank()) {
                        String colorVal = hexColor.startsWith("#") ? hexColor : "#" + hexColor;
                        styleStatements.add("style " + alias + " fill:" + colorVal + ",stroke:#1e7e34,color:#ffffff,stroke-width:2px");
                    }
                }
                continue;
            }

            // Convert Card nodes (card "Step [STATUS]" as Alias #color)
            if (trimmed.startsWith("card ")) {
                Matcher matcher = CARD_PATTERN.matcher(trimmed);
                if (matcher.find()) {
                    String label = matcher.group(1);
                    String alias = matcher.group(2);
                    String hexColor = matcher.group(4);
                    mermaid.append("    ").append(alias).append("[\"").append(label).append("\"]\n");
                    if (hexColor != null && !hexColor.isBlank()) {
                        String colorVal = hexColor.startsWith("#") ? hexColor : "#" + hexColor;
                        styleStatements.add("style " + alias + " fill:" + colorVal + ",stroke:#1E293B,color:#ffffff,stroke-width:1.5px");
                    }
                }
                continue;
            }

            // Convert C4 Rel: Rel(from, to, "Label", "Tech")
            if (trimmed.startsWith("Rel(")) {
                String content = extractMacroArgs(trimmed, "Rel");
                String[] args = parseArgs(content);
                if (args.length >= 3) {
                    mermaid.append("    ").append(cleanQuotes(args[0])).append(" -->|").append(cleanQuotes(args[2])).append("| ").append(cleanQuotes(args[1])).append("\n");
                } else if (args.length >= 2) {
                    mermaid.append("    ").append(cleanQuotes(args[0])).append(" --> ").append(cleanQuotes(args[1])).append("\n");
                }
                continue;
            }

            // Convert standard PlantUML arrows: A --> B or A --> B : Label
            if (trimmed.contains("-->")) {
                String[] parts = trimmed.split("-->");
                if (parts.length == 2) {
                    String from = parts[0].trim();
                    String right = parts[1].trim();
                    if (right.contains(":")) {
                        String[] rightParts = right.split(":", 2);
                        String to = rightParts[0].trim();
                        String label = rightParts[1].trim();
                        mermaid.append("    ").append(from).append(" -->|").append(label).append("| ").append(to).append("\n");
                    } else {
                        mermaid.append("    ").append(from).append(" --> ").append(right).append("\n");
                    }
                }
                continue;
            }
        }

        if (!styleStatements.isEmpty()) {
            mermaid.append("\n");
            for (String styleStmt : styleStatements) {
                mermaid.append("    ").append(styleStmt).append("\n");
            }
        }

        return mermaid.toString();
    }

    private String extractMacroArgs(String line, String macroName) {
        int start = line.indexOf(macroName + "(");
        if (start != -1) {
            start += macroName.length() + 1;
            int end = line.lastIndexOf(")");
            if (end > start) {
                return line.substring(start, end);
            }
        }
        return "";
    }

    private String[] parseArgs(String rawArgs) {
        if (rawArgs == null || rawArgs.isBlank()) {
            return new String[0];
        }
        return rawArgs.split("\\s*,\\s*(?=(?:[^\"]*\"[^\"]*\")*[^\"]*$)");
    }

    private String cleanQuotes(String val) {
        if (val == null) return "";
        String trimmed = val.trim();
        if (trimmed.startsWith("\"") && trimmed.endsWith("\"") && trimmed.length() >= 2) {
            return trimmed.substring(1, trimmed.length() - 1);
        }
        return trimmed;
    }

    private String extractBoundaryTitle(String line) {
        Pattern p = Pattern.compile("\"([^\"]+)\"");
        Matcher m = p.matcher(line);
        if (m.find()) {
            return m.group(1);
        }
        return "Boundary";
    }
}
