#!/usr/bin/env bash
set -e

echo "🚀 Updating FilePathUI model and ImpactedPathsPanel display logic..."

# Ensure target directories exist
mkdir -p webview/src/features/sdlc/domains/codebase-context/components/impacted-paths/model
mkdir -p webview/src/features/sdlc/domains/codebase-context/components/impacted-paths

# -----------------------------------------------------------------------------
# 1. Update file-path-ui.ts: Add buildFilePathUI helper function
# -----------------------------------------------------------------------------
cat << 'EOF' > webview/src/features/sdlc/domains/codebase-context/components/impacted-paths/model/file-path-ui.ts
export interface FilePathUI {
    absolutePath: string;
    relativePath: string;
    displayPath: string;
    fileName: string;
    fileExtension: string;
    isDirectory: boolean;
}

export function buildFilePathUI(rawPath: string): FilePathUI {
  const trimmed = rawPath.trim();
  if (!trimmed) {
    return {
      absolutePath: '',
      relativePath: '',
      displayPath: '',
      fileName: '',
      fileExtension: '',
      isDirectory: false,
    };
  }

  const isDirectory = trimmed.endsWith('/') || trimmed.endsWith('\\');
  const normalized = trimmed.replace(/\\/g, '/');
  const lastSlash = normalized.lastIndexOf('/');
  const fileName = lastSlash >= 0 ? normalized.substring(lastSlash + 1) : normalized;
  const lastDot = fileName.lastIndexOf('.');
  const fileExtension = lastDot >= 0 ? fileName.substring(lastDot) : '';

  let displayPath = normalized;

  if (fileExtension.toLowerCase() === '.java') {
    let clean = normalized;
    const javaMarkers = [
      '/src/main/java/', 'src/main/java/',
      '/src/test/java/', 'src/test/java/',
      '/src/main/kotlin/', 'src/main/kotlin/',
      '/src/test/kotlin/', 'src/test/kotlin/'
    ];
    let foundMarker = false;
    for (const marker of javaMarkers) {
      const idx = clean.indexOf(marker);
      if (idx !== -1) {
        clean = clean.substring(idx + marker.length);
        foundMarker = true;
        break;
      }
    }
    if (!foundMarker) {
      const pkgMarkers = ['/com/', 'com/', '/org/', 'org/', '/net/', 'net/', '/io/', 'io/', '/fr/', 'fr/', '/de/', 'de/'];
      for (const marker of pkgMarkers) {
        const idx = clean.indexOf(marker);
        if (idx !== -1) {
          const cleanMarker = marker.startsWith('/') ? marker.substring(1) : marker;
          clean = cleanMarker + clean.substring(idx + marker.length);
          foundMarker = true;
          break;
        }
      }
    }
    clean = clean.replace(/\.java$/i, '').replace(/^\/+|\/+$/g, '');
    displayPath = clean.replace(/\//g, '.');
  } else {
    let clean = normalized;
    const srcMarkers = ['/src/', 'src/'];
    let foundSrc = false;
    for (const marker of srcMarkers) {
      const idx = clean.indexOf(marker);
      if (idx !== -1) {
        displayPath = clean.substring(idx + marker.length);
        foundSrc = true;
        break;
      }
    }
    if (!foundSrc) {
      displayPath = clean.replace(/^\/+/, '');
    }
  }

  return {
    absolutePath: trimmed,
    relativePath: normalized,
    displayPath,
    fileName,
    fileExtension,
    isDirectory,
  };
}
EOF

# -----------------------------------------------------------------------------
# 2. Update impacted-paths-panel.tsx: Use FilePathUI and displayPath for path display
# -----------------------------------------------------------------------------
cat << 'EOF' > webview/src/features/sdlc/domains/codebase-context/components/impacted-paths/impacted-paths-panel.tsx
import React, { useMemo } from 'react';
import { Textarea } from '@/components/ui/textarea';
import { CodebaseData } from '@/shared/services/graph-rag-explorer';
import { useImpactedPaths } from './hooks/use-impacted-paths';
import { FilePathUI, buildFilePathUI } from './model/file-path-ui';

interface ImpactedPathsPanelProps {
  onCodebaseChange?: (codebase: CodebaseData) => void;
  upstreamDepth?: number;
  downstreamDepth?: number;
}

export function ImpactedPathsPanel({
  onCodebaseChange,
  upstreamDepth = 2,
  downstreamDepth = 2,
}: ImpactedPathsPanelProps = {}) {
  const {
    paths,
    handleTextareaChange,
  } = useImpactedPaths({
    onCodebaseChange,
    upstreamDepth,
    downstreamDepth,
  });

  const filePathUIList = useMemo<FilePathUI[]>(() => {
    if (!paths || !paths.trim()) return [];
    return paths
      .split('\n')
      .map((line) => line.trim())
      .filter(Boolean)
      .map((line) => buildFilePathUI(line));
  }, [paths]);

  const displayPathsValue = useMemo(() => {
    return filePathUIList.map((item) => item.displayPath).join('\n');
  }, [filePathUIList]);

  return (
    <div className="flex flex-col bg-background p-0 w-full h-full min-h-0 overflow-hidden">
      <Textarea
        value={displayPathsValue || paths}
        onChange={handleTextareaChange}
        placeholder="Selected paths from explorer..."
        className="bg-muted/20 border-border focus-visible:ring-1 w-full h-full min-h-[50px] font-mono text-foreground text-xs resize-none"
      />
    </div>
  );
}
EOF

echo "✅ feat: Configured ImpactedPathsPanel to format absolute/relative paths using FilePathUI model and render formatted displayPath (FQN for Java, path from src/ or root for others)!"
echo "💡 Next step: Run 'npm run build' to re-verify build cleanliness."
