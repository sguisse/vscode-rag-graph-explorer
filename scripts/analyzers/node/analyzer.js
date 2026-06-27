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

    const result = { entities: [], relations: [] };

    const addEntity = (id, label, group = "file") => {
        if (!result.entities.some(e => e.id === id)) {
            result.entities.push({ id, label, group });
        }
    };

    const addRelation = (source, target, type = "imports") => {
        if (!result.relations.some(r => r.source === source && r.target === target && r.type === type)) {
            result.relations.push({ source, target, type });
        }
    };

    if (relativeFilesToParse.length > 0) {
        console.log(`[Node AST] Démarrage de l'analyse de ${relativeFilesToParse.length} fichiers Web...`);
        const startTime = Date.now();

        // 1. Dependency-Cruiser structural web file analysis lookup pass
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
            process.exit(1);
        }

        if (output && output.modules) {
            output.modules.forEach(mod => {
                const sourceAbs = path.resolve(manifest.workspace_root, mod.source).replace(/\\/g, '/');
                if (!allowedFilesSet.has(sourceAbs)) return;

                addEntity(sourceAbs, path.basename(sourceAbs), "file");

                if (mod.dependencies) {
                    mod.dependencies.forEach(dep => {
                        const targetAbs = path.resolve(manifest.workspace_root, dep.resolved).replace(/\\/g, '/');
                        if (allowedFilesSet.has(targetAbs)) {
                            addRelation(sourceAbs, targetAbs, "imports");
                        }
                    });
                }
            });
        }

        // 2. Custom Static HTML Hyperlink and Resource Dependency Parsing Pass
        const htmlRegex = /\.(html|htm)$/i;
        const htmlFiles = manifest.files.filter(f => htmlRegex.test(f));

        htmlFiles.forEach(htmlAbs => {
            const normHtmlAbs = htmlAbs.replace(/\\/g, '/');
            if (!allowedFilesSet.has(normHtmlAbs)) return;

            try {
                const content = fs.readFileSync(normHtmlAbs, "utf-8");
                const dir = path.dirname(normHtmlAbs);

                addEntity(normHtmlAbs, path.basename(normHtmlAbs), "file");

                // Parse Script Elements (References to JS/TS engine targets)
                const scriptRegex = /<script\s+[^>]*src=["']([^"']+)["']/gi;
                let match;
                while ((match = scriptRegex.exec(content)) !== null) {
                    const targetRel = match[1];
                    if (/^(https?:)?\/\//i.test(targetRel)) continue; // Bypass absolute external CDN endpoints
                    const targetAbs = path.resolve(dir, targetRel).replace(/\\/g, '/');
                    if (allowedFilesSet.has(targetAbs)) {
                        addEntity(targetAbs, path.basename(targetAbs), "file");
                        addRelation(normHtmlAbs, targetAbs, "imports");
                    }
                }

                // Parse Link Elements (References to CSS Stylesheets or imports)
                const linkRegex = /<link\s+[^>]*href=["']([^"']+)["']/gi;
                while ((match = linkRegex.exec(content)) !== null) {
                    const targetRel = match[1];
                    if (/^(https?:)?\/\//i.test(targetRel)) continue;
                    const targetAbs = path.resolve(dir, targetRel).replace(/\\/g, '/');
                    if (allowedFilesSet.has(targetAbs)) {
                        addEntity(targetAbs, path.basename(targetAbs), "file");
                        addRelation(normHtmlAbs, targetAbs, "imports");
                    }
                }

                // Parse Anchor Navigation Elements (References to alternate relative HTML components)
                const anchorRegex = /<a\s+[^>]*href=["']([^"']+)["']/gi;
                while ((match = anchorRegex.exec(content)) !== null) {
                    const targetRel = match[1];
                    if (/^(https?:)?\/\//i.test(targetRel) || targetRel.startsWith('#')) continue;
                    const targetAbs = path.resolve(dir, targetRel).replace(/\\/g, '/');
                    if (allowedFilesSet.has(targetAbs) && htmlRegex.test(targetAbs)) {
                        addEntity(targetAbs, path.basename(targetAbs), "file");
                        addRelation(normHtmlAbs, targetAbs, "imports");
                    }
                }

            } catch (htmlErr) {
                console.error(`[HTML Parser Warning] Failed parsing layout elements for ${normHtmlAbs}:`, htmlErr);
            }
        });

        fs.mkdirSync(outputDir, { recursive: true });
        const hash = crypto.createHash('md5').update("web_analysis").digest('hex');
        fs.writeFileSync(path.join(outputDir, `${hash}.json`), JSON.stringify(result, null, 2));

        const duration = ((Date.now() - startTime) / 1000).toFixed(2);
        console.log(`[Node AST] ✅ Parsing Web terminé en ${duration}s. (${result.entities.length} entités validées)`);
    }

} catch (error) {
    console.error("Erreur critique dans l'analyseur Node:", error);
    process.exit(1);
}
process.exit(0);
