# PR Behavioral Specification & Dashboard Controls

## "Show Cell Origins" Checkbox & Tag Display Rules
- **When Disabled (Checkbox Unchecked):** Tags like `[E:100]`, `[C:84]` are strictly hidden (`display: none`).
- **When Enabled (Checkbox Checked):** Interactive origin badges appear next to cell values.
- **Clicking an Origin Tag:** Opens Google Sheets with the exact cell or range highlighted.
- **Hover Tooltips:** Always display full origin coordinates (`'Assessments-Extracts'!E100`).

## Assessment Date Health Rules (compared to TODAY)
- **Yellow (Null / Missing):** No assessment done.
- **Green (≤ 15 Days vs TODAY):** Fresh assessment completed within 15 days.
- **Blue (Valid < 6 Months):** Compliant active assessment.
- **Red (Outdated > 6 Months):** Exceeded 182 days without review.
- **Indicator Trends:** ✅ Finished (100%), ↗️ Improved (Current > Baseline), ➡️ No Change, ↘️ Degraded.
