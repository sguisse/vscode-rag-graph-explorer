package com.company.auditor.core.api;

import java.util.List;
import java.util.Map;

/**
 * Payload representing indexed OpenAPI & AsyncAPI schemas and code bindings (Epic 17).
 */
public record ApiContractPayload(
        String runId,
        List<Map<String, Object>> endpoints,
        List<Map<String, Object>> schemas,
        List<Map<String, Object>> asyncChannels,
        List<Map<String, Object>> controllerBindings
) {
    public ApiContractPayload {
        endpoints = endpoints != null ? List.copyOf(endpoints) : List.of();
        schemas = schemas != null ? List.copyOf(schemas) : List.of();
        asyncChannels = asyncChannels != null ? List.copyOf(asyncChannels) : List.of();
        controllerBindings = controllerBindings != null ? List.copyOf(controllerBindings) : List.of();
    }
}