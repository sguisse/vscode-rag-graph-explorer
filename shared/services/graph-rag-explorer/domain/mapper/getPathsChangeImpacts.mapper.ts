import { log } from 'node:console';
import { logInfo } from '../../../../../backend/src/utils/utils-log';
import {
  CodebaseData,
  CodebaseFile,
  CodebaseMethod,
  CodebaseAttribute,
  Dependency
} from '../model/codebase.model'; // Ajuster l'import selon la structure du projet

export interface RawNeo4jRecord {
  fileId: string;
  name: string;
  fileName: string;
  path: string;
  typeLabels?: string[];
  fqn?: string;
  methodsData?: Array<{
    id: string;
    visibility: string;
    name: string;
    signature?: string;
    summary?: string;
  }>;
  fieldsData?: Array<{
    name: string;
    type?: string;
    visibility: string;
  }>;
  relsData?: Array<{
    id: string;
    source: string;
    target: string;
    type: string;
  }>;
}

export function mapToCodebaseData(records: RawNeo4jRecord[]): CodebaseData {
  const filesMap = new Map<string, CodebaseFile>();
  const dependenciesMap = new Map<string, Dependency>();

  for (const record of records) {
    // 1. Identifying language and component type
    const language = inferLanguage(record.path);
    const fileType = inferFileType(record.typeLabels, record.fileName);
    const fileScope = inferFileScope(record.typeLabels, record.fileName);

    // 2. Method mapping
    const methods: CodebaseMethod[] = (record.methodsData || [])
      .filter((m) => m && m.id)
      .map((m) => ({
        id: m.id,
        visibility: m.visibility || 'default', // By default, visibility can be set to 'default' if not provided
        name: m.name,
        signature: m.signature || undefined,
        description: m.summary || undefined,
      }));

    // 3. Mapping attributes/fields
    const attributes: CodebaseAttribute[] = (record.fieldsData || [])
      .filter((f) => f && f.name)
      .map((f) => ({
        name: f.name,
        visibility: f.visibility || 'default', // By default, visibility can be set to 'default' if not provided
        type: f.type || undefined,
      }));

    // 4. Mapping Tags (if any) - Assuming tags are derived from typeLabels or other properties
    const tags: string[] = record.typeLabels || [];
    // merge with scope
    if (fileScope) {
      tags.push(fileScope);
    }

    // 5. Construction / Updating the CodebaseFile (Deduplication)
    if (!filesMap.has(record.fileId)) {
      filesMap.set(record.fileId, {
        id: record.fileId || record.path,
        name: record.name,
        path: record.path,
        type: fileType,
        language,
        tags,
        methods,
        attributes,
      });
    } else {
      const existingFile = filesMap.get(record.fileId)!;

      // Merging methods without duplicates
      const existingMethodIds = new Set(existingFile.methods?.map((m) => m.id));
      methods.forEach((m) => {
        if (!existingMethodIds.has(m.id)) {
          existingFile.methods?.push(m);
        }
      });

      // Merging attributes
      const existingAttrNames = new Set(existingFile.attributes?.map((a) => a.name));
      attributes.forEach((a) => {
        if (!existingAttrNames.has(a.name)) {
          existingFile.attributes?.push(a);
        }
      });
    }

    // 5. Mapping dependencies (Inter-file relations)
    if (record.relsData) {
      for (const rel of record.relsData) {
        if (rel && rel.source && rel.target && !dependenciesMap.has(rel.id)) {
          dependenciesMap.set(rel.id, {
            id: rel.id,
            sourceNode: rel.source,
            sourceHandle: 'source',
            targetNode: rel.target,
            targetHandle: 'target',
            relation: rel.type,
            label: rel.type,
            source: rel.source,
            target: rel.target,
          });
        }
      }
    }
  }

  logInfo(`Mapped ${filesMap.size} unique files and ${dependenciesMap.size} unique dependencies from Neo4j records.`);
  logInfo(`Files: ${JSON.stringify(Array.from(filesMap.values()))}`);

  return {
    files: Array.from(filesMap.values()),
    dependencies: Array.from(dependenciesMap.values()),
  };
}

/**
 * Infers the component type from Neo4j labels or the file name
 */
function inferFileType(labels?: string[], fileName?: string): string {
  if (labels) {
    if (labels.includes('Interface')) return 'interface';
    if (labels.includes('Class')) return 'class';
    if (labels.includes('Enum')) return 'enum';
    if (labels.includes('Record')) return 'record';
  }

  if (fileName) {
    if (fileName.endsWith('.properties') || fileName.endsWith('.yaml') || fileName.endsWith('.yml') || fileName.endsWith('.json')) {
      return 'config';
    }
    else if (fileName.includes('use')) {
      return 'hook';
    }
    else if (fileName.includes('store')) {
      return 'store';
    }
    else if (fileName.endsWith('.jsx') || fileName.endsWith('.tsx')) {
      return 'ui-script';
    }
    else if (fileName.endsWith('.js') || fileName.endsWith('.ts')) {
      return 'ui-component';
    }
 }

  return 'file';
}

/**
 * Define the scope of the file based on its labels or name. This is used to categorize files in the codebase.
 */
function inferFileScope(labels?: string[], fileName?: string): string {
  if (labels) {
    if (labels.includes('Java')) return 'backend';
    if (labels.includes('TypeScript')) return 'frontend';
  }

  if (fileName) {
    if (fileName.endsWith('.java') || fileName.endsWith('.class') || fileName.endsWith('.py') ) {
      return 'backend';
    }
    else if (fileName.endsWith('.ts') || fileName.endsWith('.tsx') || fileName.endsWith('.js') || fileName.endsWith('.jsx')) {
      return 'frontend';
    }
    else if (fileName.includes('config') || fileName.endsWith('.json') || fileName.endsWith('.properties') || fileName.endsWith('.yaml') || fileName.endsWith('.yml')) {
      return 'config';
    }
  }

  return 'other';
}

/**
 * Infers the programming language from the file extension
 */
function inferLanguage(filePath: string): string {
  const ext = filePath.split('.').pop()?.toLowerCase();
  switch (ext) {
    case 'java':
      return 'java';
    case 'kt':
      return 'kotlin';
    case 'ts':
    case 'tsx':
      return 'typescript';
    case 'js':
    case 'jsx':
      return 'javascript';
    case 'py':
      return 'python';
    case 'yaml':
    case 'yml':
    case 'json':
    case 'properties':
      return 'properties';
    default:
      return ext || 'unknown';
  }
}
