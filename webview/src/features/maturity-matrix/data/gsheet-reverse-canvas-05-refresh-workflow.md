# Refresh Workflow & Data Synchronization

## 1. Automatic Real-Time Data Sync
The dashboard listens dynamically to the spreadsheet's props (`data`). Modifications in Google Sheets automatically trigger recalculation of all KPIs and matrix cells.

## 2. Manual "Refresh Data" Button
Forces instant state reconciliation and updates the `Synced: HH:MM:SS` badge in the header.

## 3. Bidirectional Persistence (Syncback)
All mutations (changing project leader, toggling TO Generate flag, editing qualitative comments, or setting pillar target improvement flags) trigger immediate `updateItem(...)` calls persisting back to Google Sheets.
