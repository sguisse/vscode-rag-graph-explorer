export interface CopilotOrganization {
  id: number;
  login: string;
  name: string;
}

export interface CopilotEndpoints {
  api: string;
  'origin-tracker': string;
  proxy: string;
  telemetry: string;
  exp: string;
  [key: string]: string;
}

export interface CopilotQuotaSnapshot {
  overage_count: number;
  overage_permitted: boolean;
  percent_remaining: number;
  quota_id: string;
  quota_remaining: number;
  unlimited: boolean;
  timestamp_utc: string;
  has_quota: boolean;
  quota_reset_at: number;
  token_based_billing: boolean;
  credits_used: number;
  overage_entitlement: number;
  remaining: number;
  entitlement: number;
}

export interface CopilotQuotaSnapshots {
  chat?: CopilotQuotaSnapshot;
  completions?: CopilotQuotaSnapshot;
  premium_interactions?: CopilotQuotaSnapshot;
  [key: string]: CopilotQuotaSnapshot | undefined;
}

export interface CopilotAccountInfo {
  login: string;
  access_type_sku: string;
  analytics_tracking_id: string;
  assigned_date: string;
  can_signup_for_limited: boolean;
  chat_enabled: boolean;
  cli_enabled: boolean;
  copilotignore_enabled: boolean;
  copilot_plan: string;
  editor_preview_features_enabled: boolean;
  is_mcp_enabled: boolean;
  is_staff: boolean;
  organization_login_list: string[];
  organization_list: CopilotOrganization[];
  restricted_telemetry: boolean;
  cli_remote_control_enabled: boolean;
  copilot_app_enabled: boolean;
  cloud_session_storage_enabled: boolean;
  endpoints: CopilotEndpoints;
  can_upgrade_plan: boolean;
  te: boolean;
  quota_reset_date: string;
  quota_snapshots: CopilotQuotaSnapshots;
  quota_reset_date_utc: string;
  token_based_billing: boolean;
}
