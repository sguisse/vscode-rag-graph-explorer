#!/usr/bin/env bash
set -e

echo "✏️ Modifying existing file: 'webview/vite.config.ts'"
cat << 'EOF' > webview/vite.config.ts
/// <reference types="vitest" />
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import ViteYaml from '@modyfi/vite-plugin-yaml';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = fileURLToPath(new URL('.', import.meta.url));

export default defineConfig({
  root: __dirname,
  plugins: [react(), tailwindcss(), ViteYaml()],
  css: {
    devSourcemap: false,
  },
  test: {
    globals: true,
    environment: 'jsdom',
  },
  resolve: {
    alias: {
      '@assets': path.resolve(__dirname, '../assets'),
      '@/shared': path.resolve(__dirname, '../shared'),
      '@': path.resolve(__dirname, './src'),
    },
  },
  // CRITICAL: Force Vite to use the dev server URL for all assets (fonts, images)
  // This prevents the webview from attempting to load them via 'vscode-webview://'
  base: process.env.NODE_ENV === 'production' ? './' : 'http://localhost:5173/',
  server: {
    host: '127.0.0.1',
    port: 5173,
    strictPort: true,
    origin: 'http://localhost:5173', // Prepend origin to HMR and asset requests
    fs: {
      strict: false, // Allow serving files outside of the webview root (like ../assets)
    },
    cors: {
      origin: "*",
      methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
      allowedHeaders: ["X-Requested-With", "content-type", "Authorization"],
    },
    hmr: {
      protocol: 'ws',
      host: 'localhost',
      port: 5173,
    },
  },
  build: {
    outDir: '../dist-webview',
    emptyOutDir: true,
    chunkSizeWarningLimit: 1200,
    rollupOptions: {
      input: path.resolve(__dirname, 'index.html'),
      output: {
        entryFileNames: "assets/[name].js",
        chunkFileNames: "assets/[name].js",
        assetFileNames: "assets/[name].[ext]",
        manualChunks(id) {
          if (id.includes('node_modules')) {
            if (id.includes('cytoscape')) {
              return 'vendor-cytoscape';
            }
            if (id.includes('react') || id.includes('react-dom') || id.includes('zustand')) {
              return 'vendor-react';
            }
            if (id.includes('lucide-react')) {
              return 'vendor-lucide';
            }
            return 'vendor';
          }
        },
      },
    },
  },
});
EOF

echo "✏️ Modifying existing file: 'shared/services/maturity-matrix/model/index.ts'"
cat << 'EOF' > shared/services/maturity-matrix/model/index.ts
export * from './maturity-matrix-result.js';
export * from './mm-assessments-report.js';
export * from './mm-assessments-result.js';
EOF

echo "✏️ Modifying existing file: 'shared/services/maturity-matrix/port-out/maturity-matrix-service.port.ts'"
cat << 'EOF' > shared/services/maturity-matrix/port-out/maturity-matrix-service.port.ts
import type { MMAssessmentsReport, MMAssessmentsResult, MaturityMatrixResult } from '../model/index.js';

export interface IMaturityMatrixServicePort {
  refreshAssessments(): Promise<MMAssessmentsReport>;
  getLastAssessments(): Promise<MMAssessmentsResult>;
  getAssessmentsAt(assessmentDatetime: string): Promise<MMAssessmentsResult>;
  getAssessmentsAvailable(): Promise<string[]>; // return timestamp folder names
  extractMaturityMatrix?(): Promise<MaturityMatrixResult>;
}
EOF

echo "✏️ Modifying existing file: 'shared/services/maturity-matrix/index.ts'"
cat << 'EOF' > shared/services/maturity-matrix/index.ts
export * from './port-out/maturity-matrix-service.port.js';
export * from './model/index.js';
EOF

echo "✏️ Modifying existing file: 'backend/src/services/_python-scripts/maturity-matrix-py.service.ts'"
cat << 'EOF' > backend/src/services/_python-scripts/maturity-matrix-py.service.ts
import { exec } from 'child_process';
import * as path from 'path';
import { promisify } from 'util';
import {
  IMaturityMatrixServicePort,
  MMAssessmentsReport,
  MMAssessmentsResult,
} from '../../../../shared/services/maturity-matrix/index.js';

const execAsync = promisify(exec);

export class MaturityMatrixPyService implements IMaturityMatrixServicePort {
  private readonly scriptPath: string;

  constructor(customScriptPath?: string) {
    this.scriptPath = customScriptPath || path.resolve(
      process.cwd(),
      'scripts/architecture/maturity-matrix/maturity_matrix.py'
    );
  }

  private async runPythonAction(action: string, extraArgs: string = ''): Promise<string> {
    const command = `python3 "${this.scriptPath}" --action ${action} ${extraArgs}`.trim();
    const { stdout, stderr } = await execAsync(command, {
      env: {
        ...process.env,
        PYTHONPATH: `${process.cwd()}:${process.env.PYTHONPATH || ''}`,
      },
      maxBuffer: 50 * 1024 * 1024, // 50MB buffer to handle large CSV outputs
    });

    if (stderr && stderr.trim().length > 0) {
      console.warn(`[MaturityMatrixPyService] Python stderr: ${stderr}`);
    }

    return stdout.trim();
  }

  async refreshAssessments(): Promise<MMAssessmentsReport> {
    const rawOutput = await this.runPythonAction('refresh-assessments');
    return JSON.parse(rawOutput) as MMAssessmentsReport;
  }

  async getLastAssessments(): Promise<MMAssessmentsResult> {
    const rawOutput = await this.runPythonAction('get-last-assessments');
    return JSON.parse(rawOutput) as MMAssessmentsResult;
  }

  async getAssessmentsAt(assessmentDatetime: string): Promise<MMAssessmentsResult> {
    const rawOutput = await this.runPythonAction('get-assessments-at', `--assessment-datetime "${assessmentDatetime}"`);
    return JSON.parse(rawOutput) as MMAssessmentsResult;
  }

  async getAssessmentsAvailable(): Promise<string[]> {
    const rawOutput = await this.runPythonAction('get-assessments-available');
    return JSON.parse(rawOutput) as string[];
  }
}
EOF

echo "✏️ Modifying existing file: 'backend/src/services/maturity-matrix/maturity-matrix-service.adapter.ts'"
cat << 'EOF' > backend/src/services/maturity-matrix/maturity-matrix-service.adapter.ts
import * as vscode from 'vscode';
import { AbstractServiceAdapter } from '../../core/AbstractServiceAdapter.js';
import { logInfo } from '../../utils/utils-log.js';
import {
  IMaturityMatrixServicePort,
  MMAssessmentsReport,
  MMAssessmentsResult,
  MaturityMatrixResult,
} from '../../../../shared/services/maturity-matrix/index.js';
import { MaturityMatrixPyService } from '../_python-scripts/maturity-matrix-py.service.js';

export class MaturityMatrixAdapter extends AbstractServiceAdapter implements IMaturityMatrixServicePort, vscode.Disposable {
  private readonly pyService: MaturityMatrixPyService;

  constructor() {
    super();
    this.pyService = new MaturityMatrixPyService();
  }

  public async refreshAssessments(): Promise<MMAssessmentsReport> {
    logInfo('[maturity-matrix] Refreshing assessments...');
    const result = await this.pyService.refreshAssessments();
    logInfo(`[maturity-matrix] Refresh completed. Report path: ${result.reportPath}`);
    return result;
  }

  public async getLastAssessments(): Promise<MMAssessmentsResult> {
    logInfo('[maturity-matrix] Fetching last assessments...');
    const result = await this.pyService.getLastAssessments();
    logInfo(`[maturity-matrix] Fetched last assessments at: ${result.assessmentDatetime}`);
    return result;
  }

  public async getAssessmentsAt(assessmentDatetime: string): Promise<MMAssessmentsResult> {
    logInfo(`[maturity-matrix] Fetching assessments at assessmentDatetime: ${assessmentDatetime}...`);
    const result = await this.pyService.getAssessmentsAt(assessmentDatetime);
    logInfo(`[maturity-matrix] Fetched assessments snapshot at: ${result.assessmentDatetime}`);
    return result;
  }

  public async getAssessmentsAvailable(): Promise<string[]> {
    logInfo('[maturity-matrix] Fetching available assessment timestamps...');
    const timestamps = await this.pyService.getAssessmentsAvailable();
    logInfo(`[maturity-matrix] Found ${timestamps.length} available assessment snapshot(s).`);
    return timestamps;
  }

  public async extractMaturityMatrix(): Promise<MaturityMatrixResult> {
    logInfo('[maturity-matrix] Extracting maturity matrix...');
    return {
      label: 'Maturity Matrix',
      generatedAt: new Date().toISOString(),
      message: 'not yet implemented',
      rows: [
        ['status', 'message'],
        ['not yet implemented', 'not yet implemented'],
      ],
    };
  }

  public dispose() {
    // Reserved for future cleanup.
  }
}
EOF

echo "✅ fix(ts): Resolved Vitest type overload in vite.config.ts and added explicit .js extensions for NodeNext ESM imports"
