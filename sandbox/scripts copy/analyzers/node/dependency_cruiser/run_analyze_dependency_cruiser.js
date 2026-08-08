import { cruise } from "dependency-cruiser";
import path from "node:path";
import fs from "node:fs";

export async function execute(manifest, allowedFilesSet, webRegex, relativeFilesToParse, outputJsonPath) {
    const result = { entities: [], relations: [] };

    if (relativeFilesToParse.length === 0) {
        fs.mkdirSync(path.dirname(outputJsonPath), { recursive: true });
        fs.writeFileSync(outputJsonPath, JSON.stringify(result, null, 2));
        return;
    }

    console.log(`[Node AST] Démarrage de l'analyse de ${relativeFilesToParse.length} fichiers Web via dependency-cruiser...`);
    const cruiseResult = await cruise(
        relativeFilesToParse,
        {
            tsPreCompilationDeps: true,
            outputType: "json"
        }
    );

    let output;
    try {
        output = typeof cruiseResult.output === 'string' ? JSON.parse(cruiseResult.output) : cruiseResult.output;
    } catch(e) {
        console.error("Impossible de parser le résultat JSON de dependency-cruiser", e);
        fs.mkdirSync(path.dirname(outputJsonPath), { recursive: true });
        fs.writeFileSync(outputJsonPath, JSON.stringify(result, null, 2));
        return;
    }

    if (output && output.modules) {
        output.modules.forEach(mod => {
            const sourceAbs = path.resolve(manifest.workspace_root, mod.source).replace(/\\/g, '/');
            if (!allowedFilesSet.has(sourceAbs)) return;

            if (!result.entities.some(e => e.id === sourceAbs)) {
                result.entities.push({ id: sourceAbs, label: path.basename(sourceAbs), group: "file" });
            }

            if (mod.dependencies) {
                mod.dependencies.forEach(dep => {
                    const targetAbs = path.resolve(manifest.workspace_root, dep.resolved).replace(/\\/g, '/');
                    if (allowedFilesSet.has(targetAbs)) {
                        if (!result.relations.some(r => r.source === sourceAbs && r.target === targetAbs && r.type === "imports")) {
                            result.relations.push({ source: sourceAbs, target: targetAbs, type: "imports" });
                        }
                    }
                });
            }
        });
    }

    fs.mkdirSync(path.dirname(outputJsonPath), { recursive: true });
    fs.writeFileSync(outputJsonPath, JSON.stringify(result, null, 2));
}
