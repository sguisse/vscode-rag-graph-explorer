import { FileCategoryGroup } from '../constants/exporter-constants';

/**
 * Explodes regex group alternatives (e.g. .*\.(ts|js|py)$ or (a|b)) into standalone line entries.
 */
export function explodeRegexFilter(regexStr: string): string[] {
  let results: string[] = [];
  let currentPart = '';
  let depth = 0;
  let bracketDepth = 0;
  let parts: string[] = [];

  for (let i = 0; i < regexStr.length; i++) {
    let c = regexStr[i];
    if (c === '(' && (i === 0 || regexStr[i - 1] !== '\\')) depth++;
    else if (c === ')' && (i === 0 || regexStr[i - 1] !== '\\')) depth--;
    else if (c === '[' && (i === 0 || regexStr[i - 1] !== '\\')) bracketDepth++;
    else if (c === ']' && (i === 0 || regexStr[i - 1] !== '\\')) bracketDepth--;
    else if (c === '|' && depth === 0 && bracketDepth === 0 && (i === 0 || regexStr[i - 1] !== '\\')) {
      parts.push(currentPart);
      currentPart = '';
      continue;
    }
    currentPart += c;
  }
  parts.push(currentPart);

  parts.forEach((part) => {
    const groupMatch = part.match(/\((?:\?:)?([^)]+)\)/);

    if (groupMatch) {
      const exts = groupMatch[1].split('|');
      const pre = part.substring(0, groupMatch.index!);
      const post = part.substring(groupMatch.index! + groupMatch[0].length);

      exts.forEach((ext) => {
        results.push(pre + ext + post);
      });
    } else {
      results.push(part);
    }
  });

  return results;
}

/**
 * Processes a multi-line regex string and expands all composite regex patterns line by line.
 */
export function explodeTextAreaRegex(text: string): string {
  if (!text) return '';
  let lines = text
    .split('\n')
    .map((l) => l.trim())
    .filter(Boolean);
  let explodedLines: string[] = [];
  lines.forEach((line) => {
    if (line.startsWith('#')) {
      explodedLines.push(line);
    } else {
      explodedLines.push(...explodeRegexFilter(line));
    }
  });
  const unique = Array.from(new Set(explodedLines)).sort((a, b) => a.localeCompare(b));
  return unique.join('\n');
}

/**
 * Groups extension patterns under comment category headers or un-groups them if already commented.
 */
export function groupExtensionsText(
  text: string,
  categoryGroups: FileCategoryGroup[]
): { text: string; isGrouped: boolean } {
  const lines = text
    .split('\n')
    .map((l) => l.trim())
    .filter((l) => l && !l.startsWith('#'));

  const hasComments = text.split('\n').some((l) => l.trim().startsWith('# ---'));

  if (hasComments) {
    // Ungroup mode: remove headers and sort alphabetically
    lines.sort((a, b) => a.localeCompare(b));
    return { text: lines.join('\n'), isGrouped: false };
  } else {
    // Group mode: organize matching patterns under category headers
    const groupedLines: string[] = [];
    const matchedLines = new Set<string>();

    categoryGroups.forEach((category) => {
      const catRegexes = category.extensions.map((ext) => ext.trim());
      const matchedInCat: string[] = [];

      lines.forEach((line) => {
        if (catRegexes.includes(line)) {
          matchedInCat.push(line);
          matchedLines.add(line);
        }
      });

      if (matchedInCat.length > 0) {
        matchedInCat.sort((a, b) => a.localeCompare(b));
        groupedLines.push(`# --- ${category.label} ---`);
        groupedLines.push(...matchedInCat);
      }
    });

    const remaining = lines.filter((l) => !matchedLines.has(l));
    if (remaining.length > 0) {
      remaining.sort((a, b) => a.localeCompare(b));
      groupedLines.push('# --- Miscellaneous ---');
      groupedLines.push(...remaining);
    }

    return { text: groupedLines.join('\n'), isGrouped: true };
  }
}
