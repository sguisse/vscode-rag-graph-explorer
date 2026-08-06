export const FILE_TYPE_LIST: readonly string[] = ["class", "interface", "component", "module", "config"];

export const FILE_TYPE_ICON_MAP: { [K in (typeof FILE_TYPE_LIST)[number]]: any } = {
  class: { icon: "☕", label: "Class" },
  interface: { icon: "⚙️", label: "Interface" },
  component: { icon: "🎨", label: "Component" },
  module: { icon: "📦", label: "Module" },
  config: { icon: "🔧", label: "Configuration" },
} as const;

export type FileType = (typeof FILE_TYPE_LIST)[number];

export function isFileType(value: unknown): value is FileType {
  return typeof value === "string" && FILE_TYPE_LIST.includes(value);
}

export function getFileType(value: unknown): FileType | undefined {
  if (typeof value === "string" && FILE_TYPE_LIST.includes(value)) {
    return value as FileType;
  }
  return undefined;
}
