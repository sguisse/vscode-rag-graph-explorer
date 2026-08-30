# Migration Plan: Export Configuration Panel & Collapsible Cards

## Overview
Refactoring all configuration blocks (Configuration History, Source Paths, Filters & Scope Constraints, Destination Directory, Output Formatting Rules) into modern `CollapsibleCard` UI components inside `ExportConfigurationPanel` hosted in `LeftPanelContainer`.

## Structure & Architecture
- **`webview/src/components/ui/collapsible-card.tsx`**: Reusable Shadcn UI card wrapper with toggleable chevron, summary badge, and custom tooltips.
- **`webview/src/features/exporter/components/ExportConfigurationPanel.tsx`**: Container assembling configuration sections with `useExportConfiguration`.
- **`webview/src/features/exporter/layout-ctns/LeftPanelContainer.tsx`**: Hosts `ExportConfigurationPanel`.
- **`webview/src/features/exporter/layout-ctns/CenterPanelContainer.tsx`**: Hosts execution toolbar and results tabs (`ExporterPanel`).
