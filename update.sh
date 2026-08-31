#!/usr/bin/env bash
set -e

# Create necessary directories
PORTS_DIR="backend/src/services/errors/domain/model/port-out"
ADAPTERS_DIR="backend/src/services/errors"

mkdir -p "$PORTS_DIR"
mkdir -p "$ADAPTERS_DIR"

# -----------------------------------------------------------------------------
# BROWSER PORTS & ADAPTERS
# -----------------------------------------------------------------------------

cat << 'EOF' > "$PORTS_DIR/browser-error-files-identificator-service.port.ts"
import { IBlastRadiusErrorFilesIdentificatorServicePort } from './blast-radius-error-files-identificator';

export interface IBrowserErrorFilesIdentificatorServicePort extends IBlastRadiusErrorFilesIdentificatorServicePort {
}
EOF

cat << 'EOF' > "$ADAPTERS_DIR/browser-error-files-identificator-service.adapter.ts"
import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs';
import * as os from 'os';
import { AbstractServiceAdapter } from '../../core/AbstractServiceAdapter';
import { logInfo } from '../../utils/utils-log';
import { pythonScriptExecutionManager } from '../../managers/PythonScriptExecution.manager';

import { IBrowserErrorFilesIdentificatorServicePort } from './domain/model/port-out/browser-error-files-identificator-service.port';

export class BrowserErrorFilesIdentificatorAdapter extends AbstractServiceAdapter implements IBrowserErrorFilesIdentificatorServicePort, vscode.Disposable {

    constructor () {
        super()
    }

    public async searchFiles(content: string, workspaceRoot: string, onStderr?: (data: string) => void, includeOutWorkspace?: boolean): Promise<string[]> {
        const tmpFile = path.join(os.tmpdir(), `fe-err-browser-${Date.now()}.txt`);
        fs.writeFileSync(tmpFile, content, 'utf8');
        /** TODO: Handle errors properly */
        /*
        try {
            const { stdout } = await pythonScriptExecutionManager.executeScript(
                this.scriptPath,
                ['browser', workspaceRoot, tmpFile, includeOutWorkspace ? 'true' : 'false'],
                () => {},
                (err) => { if (onStderr) onStderr(err); }
            );
            return JSON.parse(stdout.trim() || '[]');
        } catch {
            return [];
        } finally {
            try { fs.unlinkSync(tmpFile); } catch {}
        }
        */
       return [];
    }

    public dispose() {

    }
}
EOF

# -----------------------------------------------------------------------------
# PYTHON PORTS & ADAPTERS
# -----------------------------------------------------------------------------

cat << 'EOF' > "$PORTS_DIR/python-error-files-identificator-service.port.ts"
import { IBlastRadiusErrorFilesIdentificatorServicePort } from './blast-radius-error-files-identificator';

export interface IPythonErrorFilesIdentificatorServicePort extends IBlastRadiusErrorFilesIdentificatorServicePort {
}
EOF

cat << 'EOF' > "$ADAPTERS_DIR/python-error-files-identificator-service.adapter.ts"
import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs';
import * as os from 'os';
import { AbstractServiceAdapter } from '../../core/AbstractServiceAdapter';
import { logInfo } from '../../utils/utils-log';
import { pythonScriptExecutionManager } from '../../managers/PythonScriptExecution.manager';

import { IPythonErrorFilesIdentificatorServicePort } from './domain/model/port-out/python-error-files-identificator-service.port';

export class PythonErrorFilesIdentificatorAdapter extends AbstractServiceAdapter implements IPythonErrorFilesIdentificatorServicePort, vscode.Disposable {

    constructor () {
        super()
    }

    public async searchFiles(content: string, workspaceRoot: string, onStderr?: (data: string) => void, includeOutWorkspace?: boolean): Promise<string[]> {
        const tmpFile = path.join(os.tmpdir(), `fe-err-python-${Date.now()}.txt`);
        fs.writeFileSync(tmpFile, content, 'utf8');
        /** TODO: Handle errors properly */
        /*
        try {
            const { stdout } = await pythonScriptExecutionManager.executeScript(
                this.scriptPath,
                ['python', workspaceRoot, tmpFile, includeOutWorkspace ? 'true' : 'false'],
                () => {},
                (err) => { if (onStderr) onStderr(err); }
            );
            return JSON.parse(stdout.trim() || '[]');
        } catch {
            return [];
        } finally {
            try { fs.unlinkSync(tmpFile); } catch {}
        }
        */
       return [];
    }

    public dispose() {

    }
}
EOF

echo "✅ feat(errors): Successfully generated browser and python error files identificator ports and adapters!"
