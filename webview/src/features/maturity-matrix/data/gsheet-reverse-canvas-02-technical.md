# Technical Documentation & JavaScript Event Handlers

## How "Target Buttons" (⬆️) Function
The Target Button row sits at the top of every expanded application matrix. It provides interactive pillar improvement targeting that persists directly back to the spreadsheet source:
1. **Trigger:** User clicks `+ Target` or `⬆️ TARGET`.
2. **Handler:** Calls `handleToggleTarget(appCode, pillarKey)`.
3. **Local State:** Inverts boolean in `project.expectedTargets[pillarKey]`.
4. **Sheet Persistence:** Calls `updateItem(10, updateArray)` to persist `'⬆️'` back to sheet *"Readme"* Row 10.
5. **Dynamic Class:** If active, renders high-contrast amber `⬆️ TARGET` with `scale-105 shadow-sm`; if inactive, renders standard grey `+ Target`.

## JavaScript Event Catalog & Handlers

| UI Element | Trigger | Handler | Action & Spreadsheet Mutation |
| :--- | :--- | :--- | :--- |
| Show Cell Origins Checkbox | onChange | setShowCellOrigins(e.target.checked) | When unchecked, sets all `[Col:Row]` badges to `display: none`. |
| Origin Tag Badge [Col:Row] | onClick | navigateToCell(sheet, col, row) | Invokes `followLink()` and opens Google Sheet with range selected. |
| Leader Dropdown | onChange | handleUpdateLeader(code, leader) | Updates state and calls `updateItem(rowIdx, [..., leader])` on Col E. |
| TO Generate Button | onClick | handleToggleToGenerate(code) | Toggles boolean and calls `updateItem(rowIdx, [..., 'TRUE'\|'FALSE'])` on Col F. |
| Save Commentary Note | onClick | handleSaveComment(code) | Saves text and calls `updateItem(8, [..., comment])` targeting Column O. |
| Refresh Data Button | onClick | handleManualRefresh() | Spins icon, forces data prop re-evaluation, and updates timestamp. |
