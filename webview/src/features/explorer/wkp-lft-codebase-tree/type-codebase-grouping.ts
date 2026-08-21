export const CODEBASE_GROUPING_LIST: readonly string[] = ["scope", "folder", "tags", "package", "typology"];

export const CODEBASE_GROUPING_ICON_MAP: { [K in (typeof CODEBASE_GROUPING_LIST)[number]]: any } = {
  scope: { icon: "📄", label: "By Scope" },
  folder: { icon: "📁", label: "By Folder" },
  tags: { icon: "🏷️", label: "By Tags" },
  package: { icon: "📦", label: "By Package" },
  typology: { icon: "🧩", label: "By Typology" },
} as const;

export type CodebaseGrouping = (typeof CODEBASE_GROUPING_LIST)[number];

export function isCodebaseGrouping(value: unknown): value is CodebaseGrouping {
  return typeof value === "string" && CODEBASE_GROUPING_LIST.includes(value);
}

export function getCodebaseGrouping(value: unknown): CodebaseGrouping | undefined {
  if (typeof value === "string" && CODEBASE_GROUPING_LIST.includes(value)) {
    return value as CodebaseGrouping;
  }
  return undefined;
}
