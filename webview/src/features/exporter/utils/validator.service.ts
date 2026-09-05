export interface FieldValidationErrors {
  src?: string | null;
  dest?: string | null;
  max_file?: string | null;
  max_chunk?: string | null;
  inc_paths?: string | null;
  exc_paths?: string | null;
  inc_ext?: string | null;
  exc_ext?: string | null;
}

export const ExporterValidatorService = {
  /**
   * Validates regex pattern per line ignoring comment lines (#)
   */
  validateRegexSyntax(val: string): string | null {
    if (!val || !val.trim()) return null;
    const lines = val.split('\n');
    for (const line of lines) {
      const trimmed = line.trim();
      if (trimmed && !trimmed.startsWith('#')) {
        try {
          new RegExp(trimmed);
        } catch (e) {
          return `Invalid regex on line: "${trimmed}"`;
        }
      }
    }
    return null;
  },

  /**
   * Validates source path list requirement & local file system existence
   */
  validatePathList(val: string, invalidPaths: string[] = []): string | null {
    if (!val || !val.trim()) {
      return "At least one source path is required.";
    }
    const paths = val.split(/[,\n\r]+/).map((p) => p.trim()).filter(Boolean);
    if (paths.length === 0) {
      return "At least one source path is required.";
    }
    for (const rawPath of paths) {
      if (invalidPaths.includes(rawPath)) {
        return `The path '${rawPath}' does not exist on the local file system.`;
      }
    }
    return null;
  },

  /**
   * Validates destination directory non-empty requirement
   */
  validateDestDir(val: string): string | null {
    if (!val || !val.trim()) {
      return "Destination directory path is required.";
    }
    return null;
  },

  /**
   * Validates max file size (must be a strict positive number > 0)
   */
  validateMaxFile(val: string): string | null {
    const cleanVal = (val || '').trim();
    if (!cleanVal || isNaN(Number(cleanVal))) {
      return "Must be a strict positive number. No letters allowed.";
    }
    return Number(cleanVal) > 0 ? null : "Must be a positive number greater than 0.";
  },

  /**
   * Validates max chunk size (must be a non-negative number >= 0)
   */
  validateMaxChunk(val: string): string | null {
    const cleanVal = (val || '').trim();
    if (!cleanVal || isNaN(Number(cleanVal))) {
      return "Must be a strict non-negative number. No letters allowed.";
    }
    return Number(cleanVal) >= 0 ? null : "Must be a non-negative number (0 for unlimited).";
  },
};
