#!/usr/bin/env bash
set -e

# Update local-image-reader.delegate.ts with IMAGE_NOT_FOUND_PATH fallback
cat << 'EOF' > backend/src/services/vscode/delegate/local-image-reader.delegate.ts
import * as vscode from 'vscode';
import path from 'path';
import fs from 'fs';
import { logError, logInfo, logWarn } from '../../../utils/utils-log';
import { getWorkspaceRoot, getCurrentExtensionContext } from '../../../utils/utils-vscode';

const IMAGE_NOT_FOUND_PATH = 'assets/brands/image-not-found.png';

const iconBase64Cache = new Map<string, string>();

const MIME_TYPE_MAP: Record<string, string> = {
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.png': 'image/png',
  '.svg': 'image/svg+xml',
  '.gif': 'image/gif',
  '.webp': 'image/webp',
};

interface ImageResult {
  buffer: Buffer;
  mimeType: string;
}

/**
 * Normalizes SVG tags to ensure explicit width/height attributes are present.
 * This allows the HTML5/Cytoscape <canvas> element to correctly resize the vector image.
 */
function normalizeSvgContent(svgString: string): string {
  const svg = svgString.trim();
  const svgTagMatch = svg.match(/<svg\b[^>]*>/i);
  if (!svgTagMatch) return svg;

  const svgTag = svgTagMatch[0];
  const hasWidth = /\bwidth\s*=/i.test(svgTag);
  const hasHeight = /\bheight\s*=/i.test(svgTag);
  const viewBoxMatch = svgTag.match(/\bviewBox\s*=\s*["']\s*([0-9.-]+)\s+([0-9.-]+)\s+([0-9.-]+)\s+([0-9.-]+)\s*["']/i);

  let widthVal = '100';
  let heightVal = '100';

  if (viewBoxMatch) {
    widthVal = viewBoxMatch[3];
    heightVal = viewBoxMatch[4];
  }

  let updatedSvgTag = svgTag;

  if (!hasWidth) {
    updatedSvgTag = updatedSvgTag.replace('>', ` width="${widthVal}">`);
  }
  if (!hasHeight) {
    updatedSvgTag = updatedSvgTag.replace('>', ` height="${heightVal}">`);
  }
  if (!/\bpreserveAspectRatio\s*=/i.test(updatedSvgTag)) {
    updatedSvgTag = updatedSvgTag.replace('>', ` preserveAspectRatio="xMidYMid meet">`);
  }

  return svg.replace(svgTag, updatedSvgTag);
}

/**
 * Resolves a relative, asset, or workspace path to an absolute filesystem path.
 */
function resolveLocalFilePath(filePath: string): string {
  const cleanPath = filePath.replace(/^file:\/\//, '');
  if (path.isAbsolute(cleanPath)) {
    return cleanPath;
  }

  const workspaceFolders = vscode.workspace.workspaceFolders;
  const rootPath = workspaceFolders?.[0]?.uri.fsPath || getWorkspaceRoot();
  const extensionPath = getCurrentExtensionContext()?.extensionPath;

  if ((cleanPath.startsWith('assets/') || cleanPath.startsWith('/assets/')) && extensionPath) {
    const candidateExtensionPath = path.join(extensionPath, cleanPath.replace(/^\/?/, ''));
    if (fs.existsSync(candidateExtensionPath)) {
      return candidateExtensionPath;
    }
  }

  return rootPath ? path.join(rootPath, cleanPath) : cleanPath;
}

/**
 * Determines the MIME type from the file extension.
 */
function getMimeTypeFromExtension(filePath: string): string {
  const ext = path.extname(filePath).toLowerCase();
  return MIME_TYPE_MAP[ext] || 'image/png';
}

/**
 * Reads a remote image via HTTP/HTTPS.
 */
async function readRemoteImage(url: string): Promise<ImageResult | null> {
  const response = await fetch(url);
  if (!response.ok) {
    logWarn(`[image-reader.delegate] Failed to download remote image '${url}': status ${response.status}`);
    return null;
  }

  let mimeType = 'image/png';
  const contentType = response.headers.get('content-type');
  if (contentType && contentType.startsWith('image/')) {
    mimeType = contentType;
  }

  const arrayBuffer = await response.arrayBuffer();
  let buffer = Buffer.from(arrayBuffer);

  if (mimeType === 'image/svg+xml') {
    const normalizedSvg = normalizeSvgContent(buffer.toString('utf-8'));
    buffer = Buffer.from(normalizedSvg, 'utf-8');
  }

  return { buffer, mimeType };
}

/**
 * Reads a local image from the hard drive.
 */
async function readLocalImage(filePath: string): Promise<ImageResult | null> {
  const resolvedPath = resolveLocalFilePath(filePath);

  if (!fs.existsSync(resolvedPath)) {
    logWarn(`[image-reader.delegate] Image file not found: ${resolvedPath}`);
    return null;
  }

  const mimeType = getMimeTypeFromExtension(resolvedPath);
  let buffer = await fs.promises.readFile(resolvedPath);

  if (mimeType === 'image/svg+xml') {
    const normalizedSvg = normalizeSvgContent(buffer.toString('utf-8'));
    buffer = Buffer.from(normalizedSvg, 'utf-8');
  }

  return { buffer, mimeType };
}

/**
 * Main delegate function: Converts any image reference to a normalized Base64 URI.
 * Falls back to IMAGE_NOT_FOUND_PATH if image is missing or unreadable.
 */
export async function readImageAsBase64(filePathOrUrl: string): Promise<string> {
  if (!filePathOrUrl) {
    return '';
  }

  if (iconBase64Cache.has(filePathOrUrl)) {
    logInfo(`[image-reader.delegate] Base64 image returned from cache for: ${filePathOrUrl}`);
    return iconBase64Cache.get(filePathOrUrl)!;
  }

  logInfo(`[image-reader.delegate] readImageAsBase64 invoked for: ${filePathOrUrl}`);

  try {
    const isRemote = filePathOrUrl.startsWith('http://') || filePathOrUrl.startsWith('https://');
    let result = isRemote
      ? await readRemoteImage(filePathOrUrl)
      : await readLocalImage(filePathOrUrl);

    // Fallback to default image if target image was not found
    if (!result && filePathOrUrl !== IMAGE_NOT_FOUND_PATH) {
      logWarn(`[image-reader.delegate] Image not found for '${filePathOrUrl}'. Falling back to default: ${IMAGE_NOT_FOUND_PATH}`);
      result = await readLocalImage(IMAGE_NOT_FOUND_PATH);
    }

    if (!result) {
      return '';
    }

    const dataUri = `data:${result.mimeType};base64,${result.buffer.toString('base64')}`;
    iconBase64Cache.set(filePathOrUrl, dataUri);

    return dataUri;
  } catch (err) {
    logError(`[image-reader.delegate] Failed to read base64 image for ${filePathOrUrl}:`, err as Error);

    // Attempt fallback in case of unexpected errors
    if (filePathOrUrl !== IMAGE_NOT_FOUND_PATH) {
      try {
        const fallbackResult = await readLocalImage(IMAGE_NOT_FOUND_PATH);
        if (fallbackResult) {
          const dataUri = `data:${fallbackResult.mimeType};base64,${fallbackResult.buffer.toString('base64')}`;
          iconBase64Cache.set(filePathOrUrl, dataUri);
          return dataUri;
        }
      } catch {
        // Ignore secondary fallback errors
      }
    }

    return '';
  }
}
EOF

# Rebuild workspace
npm run build
