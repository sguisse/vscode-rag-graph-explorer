# Migration Plan: Codebase Exporter

## Overview
Migrating the pure VS Code `files-exporter` extension into `webview/src/features/exporter/`.

## Target Architecture
- **State Management**: React state + Zustand layout integration.
- **Backend Communication**: RPC API wrapper (`codebaseExporterApiService`, `vsCodeApiService`).
- **UI Toolkit**: Shadcn UI, Tailwind CSS v4, Lucide React icons.
