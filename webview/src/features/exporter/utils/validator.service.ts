export const ExporterValidatorService = {
  validateRegexSyntax(val: string): string | null {
    if (!val || !val.trim()) return null;
    const patterns = val.split(/[\n,;]+/);
    for (const p of patterns) {
      const trimmed = p.trim();
      if (trimmed && !trimmed.startsWith('#')) {
        try {
          new RegExp(trimmed);
        } catch (e: any) {
          return `Invalid regex "${trimmed}": ${e?.message || 'Syntax error'}`;
        }
      }
    }
    return null;
  },

  validatePathList(val: string, invalidPaths: string[] = []): string | null {
    if (!val || !val.trim()) {
      return "At least one path is required.";
    }
    const paths = val.split(/[,\n\r]+/).map((p) => p.trim()).filter(Boolean);
    if (paths.length === 0) {
      return "At least one path is required.";
    }
    for (const rawPath of paths) {
      if (invalidPaths.includes(rawPath)) {
        return `The path '${rawPath}' does not exist on the local file system.`;
      }
    }
    return null;
  },

  validateDestDir(val: string): string | null {
    if (!val || !val.trim()) {
      return "Destination directory path is required.";
    }
    return null;
  },

  validateMaxFile(val: string): string | null {
    const cleanVal = (val || '').trim();
    if (!cleanVal || isNaN(Number(cleanVal))) {
      return "Must be a strict positive number. No letters allowed.";
    }
    return Number(cleanVal) > 0 ? null : "Must be a positive number greater than 0.";
  },

  validateMaxChunk(val: string): string | null {
    const cleanVal = (val || '').trim();
    if (!cleanVal || isNaN(Number(cleanVal))) {
      return "Must be a strict non-negative number. No letters allowed.";
    }
    return Number(cleanVal) >= 0 ? null : "Must be a non-negative number (0 for unlimited).";
  },
};
