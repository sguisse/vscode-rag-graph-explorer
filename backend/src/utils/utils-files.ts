import * as crypto from 'crypto';
import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs';

const SCRIPT_SYNC_IGNORED_NAMES = new Set(["__pycache__", ".python_packages", ".bootstrap.lock"]);

function shouldSkipScriptSyncEntry(fileName: string): boolean {
    return SCRIPT_SYNC_IGNORED_NAMES.has(fileName) || fileName.endsWith(".pyc") || fileName.endsWith(".pyo");
}

export function copyFolderRecursiveSync(source: string, target: string) {
    if (!fs.existsSync(target)) {
        fs.mkdirSync(target, { recursive: true });
    }
    if (fs.existsSync(source)) {
        const files = fs.readdirSync(source);
        for (const file of files) {
            if (shouldSkipScriptSyncEntry(file)) continue;
            const curSource = path.join(source, file);
            const curTarget = path.join(target, file);
            if (fs.statSync(curSource).isDirectory()) {
                copyFolderRecursiveSync(curSource, curTarget);
            } else {
                fs.copyFileSync(curSource, curTarget);
            }
        }
    }
}

export function hasOutdatedFiles(source: string, target: string): boolean {
    if (!fs.existsSync(source)) return false;
    if (!fs.existsSync(target)) return true;

    const files = fs.readdirSync(source);
    for (const file of files) {
        if (shouldSkipScriptSyncEntry(file)) continue;
        const curSource = path.join(source, file);
        const curTarget = path.join(target, file);
        const sourceStat = fs.statSync(curSource);

        if (sourceStat.isDirectory()) {
            if (hasOutdatedFiles(curSource, curTarget)) return true;
            continue;
        }

        if (!fs.existsSync(curTarget)) return true;
        const targetStat = fs.statSync(curTarget);
        if (!targetStat.isFile() || targetStat.size !== sourceStat.size) return true;
        if (!fs.readFileSync(curSource).equals(fs.readFileSync(curTarget))) return true;
    }
    return false;
}


export function computeRecursivelyMD5(dirPath: string): string {
    if (!fs.existsSync(dirPath)) {
        return "";
    }
    const hash = crypto.createHash("md5");
    const stats = fs.statSync(dirPath);
    if (!stats.isDirectory()) {
        hash.update(fs.readFileSync(dirPath));
        return hash.digest("hex");
    }

    const entries = fs.readdirSync(dirPath).sort();
    for (const entry of entries) {
        if (shouldSkipScriptSyncEntry(entry)) continue;
        const fullPath = path.join(dirPath, entry);
        const entryStats = fs.statSync(fullPath);
        if (entryStats.isDirectory()) {
            hash.update(entry + ":" + computeRecursivelyMD5(fullPath));
        } else {
            const fileHash = crypto.createHash("md5").update(fs.readFileSync(fullPath)).digest("hex");
            hash.update(entry + ":" + fileHash);
        }
    }
    return hash.digest("hex");
}
