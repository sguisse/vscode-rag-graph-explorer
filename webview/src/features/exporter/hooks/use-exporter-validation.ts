import { useState, useCallback, useEffect } from 'react';
import { useExporterStore } from '../store/useExporterStore';
import { ExporterValidatorService } from '../utils/validator.service';
import { PathMappingService } from '../utils/path-resolver';
import { fileExporterApiService } from '@/services/api/file-exporter-api.service.gen';
import { fileSystemApiService } from '@/services/api/file-system-api.service.gen';
import { ExportConfig } from '@/shared/services/file-exporter/model/file-exporter-model';

export type ValidationFieldName =
  | 'codebase_src'
  | 'reference_src'
  | 'dest'
  | 'max_chunk'
  | 'codebase_max_file'
  | 'reference_max_file'
  | 'codebase_inc_paths'
  | 'codebase_exc_paths'
  | 'codebase_inc_ext'
  | 'codebase_exc_ext'
  | 'reference_inc_paths'
  | 'reference_exc_paths'
  | 'reference_inc_ext'
  | 'reference_exc_ext'
  | 'prompt';

export interface ValidationErrors {
  [key: string]: string | null;
}

export function useExporterValidation() {
  const store = useExporterStore();
  const [touchedFields, setTouchedFields] = useState<Record<string, boolean>>({});

  const validatePathsLive = useCallback(
    async (scope: 'codebase' | 'reference' | 'dest') => {
      const wsRoot = store.workspaceRoot;
      let rawText = '';
      if (scope === 'codebase') rawText = store.config.codebase?.src || '';
      else if (scope === 'reference') rawText = store.config.reference?.src || '';
      else if (scope === 'dest') rawText = store.config.dest || '';

      const lines = rawText.split(/[,\n\r]+/).map((s) => s.trim()).filter(Boolean);
      if (lines.length === 0) return;

      try {
        const absPaths = lines.map((line) => PathMappingService.resolveToAbsolute(line, wsRoot));

        let detectedInvalid: string[] = [];

        if (typeof (fileExporterApiService as any).validatePaths === 'function') {
          const res = await (fileExporterApiService as any).validatePaths(absPaths);
          if (res?.invalidPaths) detectedInvalid = res.invalidPaths;
        } else if (typeof (fileSystemApiService as any).checkPathsExist === 'function') {
          const res = await (fileSystemApiService as any).checkPathsExist(absPaths);
          if (res?.invalidPaths) detectedInvalid = res.invalidPaths;
        }

        if (detectedInvalid.length > 0) {
          const currentInvalid = store.invalidPaths || [];
          const combined = Array.from(new Set([...currentInvalid, ...detectedInvalid]));
          if (typeof (store as any).setInvalidPaths === 'function') {
            (store as any).setInvalidPaths(combined);
          }
        }
      } catch (e) {
        console.error('[useExporterValidation] Error validating live path existence:', e);
      }
    },
    [store.workspaceRoot, store.config.codebase, store.config.reference, store.config.dest, store.invalidPaths]
  );

  const validateAllConfig = useCallback(
    (config: ExportConfig, invalidPaths: string[] = []): { errors: ValidationErrors; errorList: string[] } => {
      const errors: ValidationErrors = {};
      const errorList: string[] = [];

      // 1. Codebase Source Paths
      const codebaseSrcErr = ExporterValidatorService.validatePathList(config.codebase?.src || '', invalidPaths);
      errors['codebase_src'] = codebaseSrcErr;
      if (codebaseSrcErr) errorList.push(`Codebase Source Paths: ${codebaseSrcErr}`);

      // 2. Reference Source Paths (if populated)
      if (config.reference?.src && config.reference.src.trim().length > 0) {
        const refSrcErr = ExporterValidatorService.validatePathList(config.reference.src, invalidPaths);
        errors['reference_src'] = refSrcErr;
        if (refSrcErr) errorList.push(`Reference Source Paths: ${refSrcErr}`);
      }

      // 3. Destination Directory
      const destErr = ExporterValidatorService.validateDestDir(config.dest || '');
      errors['dest'] = destErr;
      if (destErr) errorList.push(`Destination Directory: ${destErr}`);

      // 4. Max File Size (Codebase)
      const codebaseMaxFileErr = ExporterValidatorService.validateMaxFile(config.codebase?.max_file || '');
      errors['codebase_max_file'] = codebaseMaxFileErr;
      if (codebaseMaxFileErr) errorList.push(`Codebase Max File Size: ${codebaseMaxFileErr}`);

      // 5. Max File Size (Reference)
      if (config.reference?.max_file) {
        const refMaxFileErr = ExporterValidatorService.validateMaxFile(config.reference.max_file);
        errors['reference_max_file'] = refMaxFileErr;
        if (refMaxFileErr) errorList.push(`Reference Max File Size: ${refMaxFileErr}`);
      }

      // 6. Max Chunk Size
      const maxChunkErr = ExporterValidatorService.validateMaxChunk(config.max_chunk || '');
      errors['max_chunk'] = maxChunkErr;
      if (maxChunkErr) errorList.push(`Max Chunk Size: ${maxChunkErr}`);

      // 7. Codebase Regex Syntax Validations
      const codebaseIncPathsErr = ExporterValidatorService.validateRegexSyntax(config.codebase?.inc_paths || '');
      errors['codebase_inc_paths'] = codebaseIncPathsErr;
      if (codebaseIncPathsErr) errorList.push(`Codebase Include Paths Regex: ${codebaseIncPathsErr}`);

      const codebaseExcPathsErr = ExporterValidatorService.validateRegexSyntax(config.codebase?.exc_paths || '');
      errors['codebase_exc_paths'] = codebaseExcPathsErr;
      if (codebaseExcPathsErr) errorList.push(`Codebase Exclude Paths Regex: ${codebaseExcPathsErr}`);

      const codebaseIncExtErr = ExporterValidatorService.validateRegexSyntax(config.codebase?.inc_ext || '');
      errors['codebase_inc_ext'] = codebaseIncExtErr;
      if (codebaseIncExtErr) errorList.push(`Codebase Include Extension Regex: ${codebaseIncExtErr}`);

      const codebaseExcExtErr = ExporterValidatorService.validateRegexSyntax(config.codebase?.exc_ext || '');
      errors['codebase_exc_ext'] = codebaseExcExtErr;
      if (codebaseExcExtErr) errorList.push(`Codebase Exclude Extension Regex: ${codebaseExcExtErr}`);

      // 8. Reference Regex Syntax Validations
      if (config.reference) {
        const refIncPathsErr = ExporterValidatorService.validateRegexSyntax(config.reference.inc_paths || '');
        errors['reference_inc_paths'] = refIncPathsErr;
        if (refIncPathsErr) errorList.push(`Reference Include Paths Regex: ${refIncPathsErr}`);

        const refExcPathsErr = ExporterValidatorService.validateRegexSyntax(config.reference.exc_paths || '');
        errors['reference_exc_paths'] = refExcPathsErr;
        if (refExcPathsErr) errorList.push(`Reference Exclude Paths Regex: ${refExcPathsErr}`);

        const refIncExtErr = ExporterValidatorService.validateRegexSyntax(config.reference.inc_ext || '');
        errors['reference_inc_ext'] = refIncExtErr;
        if (refIncExtErr) errorList.push(`Reference Include Extension Regex: ${refIncExtErr}`);

        const refExcExtErr = ExporterValidatorService.validateRegexSyntax(config.reference.exc_ext || '');
        errors['reference_exc_ext'] = refExcExtErr;
        if (refExcExtErr) errorList.push(`Reference Exclude Extension Regex: ${refExcExtErr}`);
      }

      return { errors, errorList };
    },
    []
  );

  useEffect(() => {
    const { errors } = validateAllConfig(store.config, store.invalidPaths);

    store.setValidationState({
      codebasePathListInvalid: Boolean(errors['codebase_src']),
      destDirInvalid: Boolean(errors['dest']),
      maxFileInvalid: Boolean(errors['codebase_max_file']),
      maxChunkInvalid: Boolean(errors['max_chunk']),
      errors,
    });
  }, [store.config, store.invalidPaths, validateAllConfig]);

  const handleBlur = async (field: ValidationFieldName) => {
    setTouchedFields((prev) => ({ ...prev, [field]: true }));

    if (field === 'codebase_src') {
      await validatePathsLive('codebase');
    } else if (field === 'reference_src') {
      await validatePathsLive('reference');
    } else if (field === 'dest') {
      await validatePathsLive('dest');
    }
  };

  const markAllTouched = async () => {
    setTouchedFields({
      codebase_src: true,
      reference_src: true,
      dest: true,
      max_chunk: true,
      codebase_max_file: true,
      reference_max_file: true,
      codebase_inc_paths: true,
      codebase_exc_paths: true,
      codebase_inc_ext: true,
      codebase_exc_ext: true,
      reference_inc_paths: true,
      reference_exc_paths: true,
      reference_inc_ext: true,
      reference_exc_ext: true,
      prompt: true,
    });

    await Promise.all([
      validatePathsLive('codebase'),
      validatePathsLive('reference'),
      validatePathsLive('dest'),
    ]);
  };

  return {
    touchedFields,
    handleBlur,
    markAllTouched,
    validateAllConfig,
  };
}
