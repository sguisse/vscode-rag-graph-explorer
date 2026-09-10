import { RpcMethodEnum } from "../config/rpc-methods.enum.gen";

export const DEFAULT_RPC_TIMEOUT = 15000;

/**
 * Method-specific RPC timeout definitions (in milliseconds).
 */
export const RPC_METHOD_TIMEOUTS: Partial<Record<RpcMethodEnum, number>> = {
    [RpcMethodEnum.LLMCHAT_EXECUTE_CHAT]: 120000, // 2 minutes for LLM execution
    [RpcMethodEnum.LLMCHAT_STREAM_CHAT]: 120000,  // 2 minutes for LLM streaming initialization
    [RpcMethodEnum.LLMCHAT_LIST_AVAILABLE_MODELS]: 30000,   // 30 seconds for listing models
    [RpcMethodEnum.LLMCHAT_HEALTH_CHECK]: 30000,  // 30 seconds for health check
};

/**
 * Retrieves the timeout for a given RPC method name.
 * Falls back to DEFAULT_RPC_TIMEOUT (15s) if not specified in the map.
 */
export function getRpcTimeout(method: string): number {
    return (RPC_METHOD_TIMEOUTS as Record<string, number>)[method] ?? DEFAULT_RPC_TIMEOUT;
}
