import swc from "@swc/core";
import fs from "node:fs";
import path from "node:path";

export async function execute(manifest, allowedFilesSet, webRegex, relativeFilesToParse, outputJsonPath) {
    const result = { entities: [], relations: [] };
    const parseableExtensions = /\.(js|jsx|ts|tsx|mjs|cjs)$/i;
    const targetFiles = manifest.files.filter(f => parseableExtensions.test(f));

    if (targetFiles.length === 0) {
        fs.mkdirSync(path.dirname(outputJsonPath), { recursive: true });
        fs.writeFileSync(outputJsonPath, JSON.stringify(result, null, 2));
        return;
    }

    console.log(`[Node AST] Lancement de l'analyseur structurel SWC sur ${targetFiles.length} fichier(s)...`);

    const addEntity = (id, label, group) => {
        if (!result.entities.some(e => e.id === id)) {
            result.entities.push({ id, label, group });
        }
    };

    const addRelation = (source, target, type) => {
        if (!result.relations.some(r => r.source === source && r.target === target && r.type === type)) {
            result.relations.push({ source, target, type });
        }
    };

    for (const fileAbs of targetFiles) {
        const normFileAbs = fileAbs.replace(/\\/g, '/');
        if (!allowedFilesSet.has(normFileAbs)) continue;

        try {
            const content = fs.readFileSync(normFileAbs, "utf-8");
            const isTs = normFileAbs.endsWith('.ts') || normFileAbs.endsWith('.tsx');
            const isJsx = normFileAbs.endsWith('.jsx') || normFileAbs.endsWith('.tsx');

            const ast = swc.parseSync(content, {
                syntax: isTs ? "typescript" : "ecmascript",
                tsx: isTs && isJsx,
                jsx: !isTs && isJsx,
                comments: false,
                target: "es2022"
            });

            const walk = (node, currentClassId) => {
                if (!node || typeof node !== 'object') return;

                let nextClassId = currentClassId;

                if (node.type === 'ClassDeclaration' || node.type === 'ClassDecl') {
                    const className = node.identifier?.value || node.id?.value || 'AnonymousClass';
                    const classId = `${normFileAbs}::${className}`;
                    addEntity(classId, className, "class");
                    addRelation(normFileAbs, classId, "contains");
                    nextClassId = classId;
                }

                if (node.type === 'ClassMethod' || node.type === 'MethodDefinition' || node.type === 'Constructor') {
                    let methodName = node.key?.value || node.key?.identifier?.value || node.key?.id?.value;
                    if (!methodName && node.type === 'Constructor') methodName = 'constructor';

                    if (methodName && currentClassId) {
                        const className = currentClassId.split('::')[1];
                        const methodId = `${normFileAbs}::${className}.${methodName}()`;
                        addEntity(methodId, `${methodName}()`, "method");
                        addRelation(currentClassId, methodId, "contains");
                    }
                }

                if (node.type === 'FunctionDeclaration' || node.type === 'FnDecl') {
                    const funcName = node.identifier?.value || node.id?.value;
                    if (funcName && !currentClassId) {
                        const funcId = `${normFileAbs}::${funcName}()`;
                        addEntity(funcId, `${funcName}()`, "method");
                        addRelation(normFileAbs, funcId, "contains");
                    }
                }

                for (const key in node) {
                    if (Object.prototype.hasOwnProperty.call(node, key)) {
                        const child = node[key];
                        if (Array.isArray(child)) {
                            child.forEach(c => walk(c, nextClassId));
                        } else if (child && typeof child === 'object') {
                            walk(child, nextClassId);
                        }
                    }
                }
            };

            walk(ast, null);

        } catch (err) {
            console.warn(`[SWC Parser Warning] Failed compiling tokens for layout element ${normFileAbs}:`, err.message);
        }
    }

    fs.mkdirSync(path.dirname(outputJsonPath), { recursive: true });
    fs.writeFileSync(outputJsonPath, JSON.stringify(result, null, 2));
}
