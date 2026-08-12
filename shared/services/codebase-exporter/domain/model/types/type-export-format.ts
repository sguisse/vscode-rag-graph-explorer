export const EXPORT_FORMAT_LIST: readonly string[] = ["YAML", "JSON", "TOML", "XML", "TXT"];

export const EXPORT_FORMAT_ICON_MAP: { [K in (typeof EXPORT_FORMAT_LIST)[number]]: any } = {
  YAML: { icon: "📄", label: "YAML" },
  JSON: { icon: "🟦", label: "JSON" },
  TOML: { icon: "🟫", label: "TOML" },
  XML: { icon: "🔤", label: "XML" },
  TXT: { icon: "📝", label: "TXT" },
} as const;

export type ExportFormat = (typeof EXPORT_FORMAT_LIST)[number];

export function isExportFormat(value: unknown): value is ExportFormat {
  return typeof value === "string" && EXPORT_FORMAT_LIST.includes(value);
}

export function getExportFormat(value: unknown): ExportFormat | undefined {
  if (typeof value === "string" && EXPORT_FORMAT_LIST.includes(value)) {
    return value as ExportFormat;
  }
  return undefined;
}
