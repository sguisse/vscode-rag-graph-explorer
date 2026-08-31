export const BLAST_RADIUS_SCOPE_LIST: readonly string[] = ['JAVA_STACKTRACE', 'JAVA_BUILD_ERROR', 'TYPESCRIPT_BUILD_ERROR', 'BROWSER_CONSOLE', 'PYTHON'];

export const BLAST_RADIUS_SCOPE_ICON_MAP: { [K in (typeof BLAST_RADIUS_SCOPE_LIST)[number]]: any } = {
  JAVA_STACKTRACE: { icon: "☕", label: "Java Stacktrace" },
  JAVA_BUILD_ERROR: { icon: "🏗️", label: "Java Build Error" },
  TYPESCRIPT_BUILD_ERROR: { icon: "🟦", label: "TypeScript Build Error" },
  BROWSER_CONSOLE: { icon: "🌐", label: "Browser Console" },
  PYTHON: { icon: "🐍", label: "Python" },
} as const;

export type BlastRadiusScope = (typeof BLAST_RADIUS_SCOPE_LIST)[number];

export function isBlastRadiusScope(value: unknown): value is BlastRadiusScope {
  return typeof value === "string" && BLAST_RADIUS_SCOPE_LIST.includes(value);
}

export function getBlastRadiusScope(value: unknown): BlastRadiusScope | undefined {
  if (typeof value === "string" && BLAST_RADIUS_SCOPE_LIST.includes(value)) {
    return value as BlastRadiusScope;
  }
  return undefined;
}
