import { cruise } from "dependency-cruiser";
import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";

const manifestPath = process.argv[2];
const outputDir = process.argv[3];

if (!manifestPath || !outputDir) {
    console.error("Usage: node analyzer.js <manifest_path> <output_dir>");
    process.exit(1);
}

try {
    const manifest = JSON.parse(fs.readFileSync(manifestPath, "utf-8"));

    process.chdir(manifest.workspace_root);

    const allowedFilesSet = new Set(manifest.files.map(f => f.replace(/\\/g, '/')));
    const webRegex = /\.(js|jsx|ts|tsx|vue|svelte|html|htm|css|scss|less)$/i;

    const relativeFilesToParse = manifest.files
        .filter(f => webRegex.test(f))
        .map(f => path.relative(manifest.workspace_root, f).replace(/\\/g, '/'))
        .filter(f => f !== '');

    if (relativeFilesToParse.length === 0) {
        process.exit(0);
    }

    console.log(`[Node AST] Démarrage de l'analyse de ${relativeFilesToParse.length} fichiers Web...`);
    const startTime = Date.now();

    // On utilise le type de sortie officiel "json"
    const cruiseResult = await cruise(
        relativeFilesToParse,
        {
            tsPreCompilationDeps: true,
            outputType: "json"
        }
    );

    const result = { entities: [], relations: [] };

    // FIX : On parse la String JSON renvoyée par dependency-cruiser
    let output;
    try {
        output = typeof cruiseResult.output === 'string' ? JSON.parse(cruiseResult.output) : cruiseResult.output;
    } catch(e) {
        console.error("Impossible de parser le résultat JSON de dependency-cruiser", e);
        process.exit(1);
    }

    if (output && output.modules) {
        output.modules.forEach(mod => {
            const sourceAbs = path.resolve(manifest.workspace_root, mod.source).replace(/\\/g, '/');
            if (!allowedFilesSet.has(sourceAbs)) return;

            result.entities.push({ id: sourceAbs, label: path.basename(sourceAbs), group: "file" });

            if (mod.dependencies) {
                mod.dependencies.forEach(dep => {
                    const targetAbs = path.resolve(manifest.workspace_root, dep.resolved).replace(/\\/g, '/');
                    if (allowedFilesSet.has(targetAbs)) {
                        result.relations.push({ source: sourceAbs, target: targetAbs, type: "imports" });
                    }
                });
            }
        });
    }

    fs.mkdirSync(outputDir, { recursive: true });
    const hash = crypto.createHash('md5').update("web_analysis").digest('hex');
    fs.writeFileSync(path.join(outputDir, `${hash}.json`), JSON.stringify(result, null, 2));

    const duration = ((Date.now() - startTime) / 1000).toFixed(2);
    console.log(`[Node AST] ✅ Parsing Web terminé en ${duration}s. (${result.entities.length} entités validées)`);

} catch (error) {
    console.error("Erreur critique dans l'analyseur Node:", error);
    process.exit(1);
}
process.exit(0);
