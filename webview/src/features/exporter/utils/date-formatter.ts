/**
 * Formats a Date object into YY/MM/DD-HH:mm timestamp format.
 * Example: 2026-09-05 15:51 -> "26/09/05-15:51"
 */
export function formatHistoryTimestamp(date: Date = new Date()): string {
  const yy = String(date.getFullYear()).slice(-2);
  const mm = String(date.getMonth() + 1).padStart(2, '0');
  const dd = String(date.getDate()).padStart(2, '0');
  const hh = String(date.getHours()).padStart(2, '0');
  const min = String(date.getMinutes()).padStart(2, '0');
  return `${yy}/${mm}/${dd}-${hh}:${min}`;
}

/**
 * Generates display name for newly created configuration profiles:
 * YY/MM/DD-HH:mm --> ${workspaceName} --> ⚙️ New config
 */
export function generateNewConfigName(workspaceName: string, date: Date = new Date()): string {
  const ts = formatHistoryTimestamp(date);
  const ws = workspaceName || 'workspace';
  return `${ts} --> ${ws} --> ⚙️ New config`;
}

/**
 * Generates display name when duplicating an existing profile:
 * Original Name -> Original Name - copy 01 -> Original Name - copy 02 ...
 */
export function generateDuplicateName(originalDisplay: string, existingDisplays: string[]): string {
  const match = originalDisplay.match(/^(.*?)(?:\s*-\s*copy\s*(\d+))?$/i);
  const baseName = match && match[1] ? match[1].trim() : originalDisplay.trim();

  const existingSet = new Set(existingDisplays.map((d) => d.toLowerCase().trim()));

  let counter = 1;
  while (counter < 1000) {
    const numStr = String(counter).padStart(2, '0');
    const candidate = `${baseName} - copy ${numStr}`;
    if (!existingSet.has(candidate.toLowerCase())) {
      return candidate;
    }
    counter++;
  }
  return `${baseName} - copy ${Date.now()}`;
}
