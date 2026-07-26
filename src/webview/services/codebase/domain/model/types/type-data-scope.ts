export const DATA_SCOPE_LIST: readonly string[] = ["LOCAL_ONLY", "REMOTE_SYNC"];

export const DATA_SCOPE_ICON_MAP: { [K in (typeof DATA_SCOPE_LIST)[number]]: any } = {
  LOCAL_ONLY: { icon: "🏠", label: "Local Only" },
  REMOTE_SYNC: { icon: "🌐", label: "Remote Sync" },
} as const;

export type DataScope = (typeof DATA_SCOPE_LIST)[number];

export function isDataScope(value: unknown): value is DataScope {
  return typeof value === "string" && DATA_SCOPE_LIST.includes(value);
}

export function getDataScope(value: unknown): DataScope | undefined {
  if (typeof value === "string" && DATA_SCOPE_LIST.includes(value)) {
    return value as DataScope;
  }
  return undefined;
}
