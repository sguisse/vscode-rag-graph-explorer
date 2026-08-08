import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import { execSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const manifestPath = process.argv[2];
const outputDir = process.argv[3];

if (!manifestPath || !outputDir) {
    console.error("Usage: node node_analyzer.js <manifest_path> <output_dir>");
    process.exit(1);
}

try {
    const dcInstallScript = path.join(__dirname, "dependency_cruiser", "install.py");
    const swcInstallScript = path.join(__dirname, "swc", "install.py");
    try {
        execSync(`python3 "${dcInstallScript}"`, { stdio: "inherit" });
        execSync(`python3 "${swcInstallScript}"`, { stdio: "inherit" });
    } catch (err) {
        console.error("Lifecycle installation failure during Node tool checking setup:", err);
        process.exit(1);
    }

    const manifest = JSON.parse(fs.readFileSync(manifestPath, "utf-8"));
    process.chdir(manifest.workspace_root);

    const allowedFilesSet = new Set(manifest.files.map(f => f.replace(/\\/g, '/')));
    const webRegex = /\.(js|jsx|ts|tsx|vue|svelte|html|htm|css|scss|less)$/i;

    const relativeFilesToParse = manifest.files
        .filter(f => webRegex.test(f))
        .map(f => path.relative(manifest.workspace_root, f).replace(/\\/g, '/'))
        .filter(f => f !== '');

    // Set up explicit tool output targets inside designated raw output directories
    const dcOutputJsonPath = path.join(outputDir, "dependency_cruiser", "graph.json");
    const swcOutputJsonPath = path.join(outputDir, "swc", "graph.json");

    // Execute strategies to write their data directly to their respective folders
    const dcStrategyPath = "./dependency_cruiser/run_analyze_dependency_cruiser.js";
    const { execute: executeDC } = await import(dcStrategyPath);
    await executeDC(manifest, allowedFilesSet, webRegex, relativeFilesToParse, dcOutputJsonPath);

    const swcStrategyPath = "./swc/run_analyze_swc.js";
    const { execute: executeSWC } = await import(swcStrategyPath);
    await executeSWC(manifest, allowedFilesSet, webRegex, relativeFilesToParse, swcOutputJsonPath);

    // Merge and reconcile individual outputs from local flat files
    const result = { entities: [], relations: [] };

    const mergeIntoResult = (filePath) => {
        if (!fs.existsSync(filePath)) return;
        try {
            const data = JSON.parse(fs.readFileSync(filePath, "utf-8"));
            (data.entities || []).forEach(ent => {
                if (!result.entities.some(e => e.id === ent.id)) {
                    result.entities.push(ent);
                }
            });
            (data.relations || []).forEach(rel => {
                if (!result.relations.some(r => r.source === rel.source && r.target === rel.target && r.type === rel.type)) {
                    result.relations.push(rel);
                }
            });
        } catch (e) {}
    };

    mergeIntoResult(dcOutputJsonPath);
    mergeIntoResult(swcOutputJsonPath);

    // Custom Static HTML Hyperlink and Resource Dependency Parsing Pass
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

    const htmlRegex = /\.(html|htm)$/i;
    const htmlFiles = manifest.files.filter(f => htmlRegex.test(f));

    htmlFiles.forEach(htmlAbs => {
        const normHtmlAbs = htmlAbs.replace(/\\/g, '/');
        if (!allowedFilesSet.has(normHtmlAbs)) return;

        try {
            const content = fs.readFileSync(normHtmlAbs, "utf-8");
            const dir = path.dirname(normHtmlAbs);

            addEntity(normHtmlAbs, path.basename(normHtmlAbs), "file");

            const scriptRegex = /<script\s+[^>]*src=["']([^"']+)["']/gi;
            let match;
            while ((match = scriptRegex.exec(content)) !== null) {
                const targetRel = match[1];
                if (/^(https?:)?\/\//i.test(targetRel)) continue;
                const targetAbs = path.resolve(dir, targetRel).replace(/\\/g, '/');
                if (allowedFilesSet.has(targetAbs)) {
                    addEntity(targetAbs, path.basename(targetAbs), "file");
                    addRelation(normHtmlAbs, targetAbs, "imports");
                }
            }

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

    console.log(`[Node AST] ✅ Parsing Web terminé. (${result.entities.length} entités validées)`);
} catch (error) {
    console.error("Erreur critique dans l'analyseur Node:", error);
    process.exit(1);
}
process.exit(0);
