# Screen Blueprint & Data Origins

## 1. Screen Visual Blueprint & Component Coordinates
```
+---------------------------------------------------------------------------------------------------------+
| SECTION 1: HEADER & GLOBAL CONTROLS (<header>)                                                          |
| [Icon] Dashboard Title & Subtitle | [Refresh] [Universal Master Prompt] [User Guide] [Origins Checkbox] |
+---------------------------------------------------------------------------------------------------------+
| SECTION 2: EXECUTIVE KPI SUMMARY RACK (Grid: 2 cols mobile -> 3 cols tablet -> 5 cols desktop)          |
| [1: Tracked Apps] [2: Avg Maturity Score] [3: Target Pillars ⬆️] [4: Extracts Finished ✅] [5: Leaders]   |
+---------------------------------------------------------------------------------------------------------+
| SECTION 3: FILTER TOOLBAR & VIEW NAVIGATION STRIP                                                       |
| [Tabs: Matrix View | Pillar Delta | Extracts]  <--->  [Leader Combo] [Assessor Combo] [Pillar] [Search] |
+---------------------------------------------------------------------------------------------------------+
| SECTION 4: ASSESSMENT FRESHNESS STATUS STRIP & TODAY ANCHOR                                             |
| Today: YYYY-MM-DD | [🟡 Yellow: No Assess] [🟢 Green: <=15d] [🔵 Blue: Valid] [🔴 Red: Outdated >6M]      |
+---------------------------------------------------------------------------------------------------------+
| SECTION 5: ACTIVE VIEW CONTAINER                                                                        |
|   VIEW A: MATURITY MATRIX VIEW (activeTab === 'matrix')                                                 |
|   Row 1: Expected Target (⬆️ Target buttons)                                                           |
|   Row 2-4: Last Assessment (Date [E], Score [G], Level [G])                                            |
|   Row 5-7: Last Assessment - 1 (Prev Date [E], Prev Score [G], Prev Level [G])                        |
|   Row 8: Assessor (Extracts Col C)                                                                      |
|   Row 9-10: Extract Progression (Last Extract %, Prev Extract %)                                      |
|   Row 11: Trend Indicator (✅ Finished, ↗️ Improved, ➡️ No Change, ↘️ Degraded)                         |
|                                                                                                         |
|   VIEW B: PILLAR DELTA ANALYTICS (activeTab === 'compare')                                              |
|   [11 Pillar Cards: Dual comparative bars (Current Score vs Previous Score) + Delta Indicator]          |
|                                                                                                         |
|   VIEW C: EXTRACTS & ASSESSOR ROSTER (activeTab === 'extracts')                                         |
|   [Cards: Per-pillar owner roster, completion percentage, progress bars]                                |
+---------------------------------------------------------------------------------------------------------+
| SECTION 6: FOOTER (System metadata & sheet sync configuration notes)                                    |
+---------------------------------------------------------------------------------------------------------+
```

## 2. Complete Data Lineage: Where Data Comes From

| Field | Location | Source Sheet | Coordinates | Logic / Formatting |
| :--- | :--- | :--- | :--- | :--- |
| App Name & Code | App Card Header | Maturity-Matrix-Projects | Col D & Col B | Row index matching project envelope. |
| Leader Name | App Card Header (Dropdown) | Maturity-Matrix-Projects | Col E (E2:E50) | Synced bi-directionally via updateItem. |
| TO Generate Flag | App Card Header (Badge) | Maturity-Matrix-Projects | Col F | Boolean TRUE/FALSE toggle button. |
| Last Assessment Date | Table Row 2 | Assessments-Extracts | Col E (Row = headerRow + 1) | Compared vs TODAY: Yellow (null), Green (≤15d), Blue (valid), Red (>6M). |
| Last Assessment Score | Table Row 3 | Assessments-Extracts | Col G (Row = headerRow + 1) | Parsed numeric score rounded to 2 decimal places. |
| Assessor Name | Table Row 8 | Assessments-Extracts | Col C (Row = headerRow) | Assigned reviewer identity for that pillar. |
| Pending Progress | Table Row 9 | Assessments-Extracts | Col G (Row = headerRow + 5) | Converted to 0–100% progress bar and trend icon. |
