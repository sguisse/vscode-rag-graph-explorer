import { vsCodeApiService } from '@/services/api/vs-code-api.service.gen';

/**
 * Converts absolute workspace file or directory paths into compact display representations.
 * If the path is a Java file, formats it as package.ClassName.
 */
export function formatPathForDisplay(absPath: string, workspaceRoot: string): string {
  if (!absPath || !absPath.trim()) return '';
  const cleanAbs = absPath.replace(/^['"]|['"]$/g, '').trim();
  const normalizedAbs = cleanAbs.replace(/\\/g, '/');
  const normalizedWs = workspaceRoot ? workspaceRoot.replace(/\\/g, '/').replace(/\/+$/, '') : '';

  // Check if file/folder resides within current workspace root
  if (normalizedWs && normalizedAbs.startsWith(normalizedWs)) {
    let rel = normalizedAbs.slice(normalizedWs.length).replace(/^\/+/, '');

    // Java package.ClassName formatting
    if (rel.endsWith('.java')) {
      const javaRoots = ['src/main/java/', 'src/test/java/', 'src/java/', 'java/'];
      let pkgPath = rel;
      for (const root of javaRoots) {
        if (rel.includes(root)) {
          pkgPath = rel.substring(rel.indexOf(root) + root.length);
          break;
        }
      }
      return pkgPath.replace(/\.java$/, '').replace(/\//g, '.');
    }

    return rel || '.';
  }

  return cleanAbs;
}

/**
 * Splits the path at every / separator by inserting a <br /> tag (or standard \n line break for raw tooltips) without exceeding 44 characters per line.
 * Used for Tooltip
 */
export function formatPathWithBreakpoints(
  filePath: string,
  prefix: string = "",
  maxCharsPerLine: number = 44
): string {
  // Split on slash while retaining the trailing slash for readability
  const segments = filePath.split('/');

  let currentLine = prefix;
  const resultLines: string[] = [];

  segments.forEach((segment, index) => {
    // Append '/' to all segments except the final filename
    const formattedSegment = index < segments.length - 1 ? `${segment}/` : segment;

    // Check if adding this segment exceeds the 44-character line limit
    if ((currentLine + formattedSegment).length > maxCharsPerLine) {
      if (currentLine.trim()) {
        resultLines.push(currentLine);
      }
      currentLine = formattedSegment;
    } else {
      currentLine += formattedSegment;
    }
  });

  if (currentLine) {
    resultLines.push(currentLine);
  }

  return resultLines.join('<br />');
}



export class PathMappingService {
  private static map: Map<string, string> = new Map();

  /**
   * Registers a path mapping from display string to original absolute path.
   */
  public static registerPath(absPath: string, workspaceRoot: string): string {
    if (!absPath) return '';
    const clean = absPath.trim();
    if (!clean) return '';

    const display = formatPathForDisplay(clean, workspaceRoot);
    if (display && clean) {
      this.map.set(display, clean);
      this.map.set(display.toLowerCase(), clean);
      this.map.set(clean, clean);
      this.map.set(clean.toLowerCase(), clean);
    }
    return display;
  }

  /**
   * Resolves a display string (relative, package notation, or exact text) back to its absolute path.
   */
  public static resolveToAbsolute(displayOrAbs: string, workspaceRoot: string): string {
    const trimmed = displayOrAbs.trim();
    if (!trimmed) return '';

    if (this.map.has(trimmed)) {
      return this.map.get(trimmed)!;
    }
    if (this.map.has(trimmed.toLowerCase())) {
      return this.map.get(trimmed.toLowerCase())!;
    }

    // Convert Java package.ClassName back if possible
    if (trimmed.includes('.') && !trimmed.includes('/') && !trimmed.includes('\\') && workspaceRoot) {
      const javaRel = 'src/main/java/' + trimmed.replace(/\./g, '/') + '.java';
      return `${workspaceRoot.replace(/[/\\]+$/, '')}/${javaRel}`;
    }

    // Relative workspace path fallback
    if (workspaceRoot && !trimmed.startsWith('/') && !trimmed.match(/^[a-zA-Z]:/)) {
      return `${workspaceRoot.replace(/[/\\]+$/, '')}/${trimmed}`;
    }

    return trimmed;
  }

  public static clearMap(): void {
    this.map.clear();
  }
}
