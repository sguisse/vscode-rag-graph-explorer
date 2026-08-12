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
    name: string;
    signature?: string;
    summary?: string;
  }>;
  fieldsData?: Array<{
    name: string;
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
    // 1. Identification de la langue et du type de composant
    const language = inferLanguage(record.path);
    const fileType = inferFileType(record.typeLabels, record.fileName);

    // 2. Mapping des méthodes
    const methods: CodebaseMethod[] = (record.methodsData || [])
      .filter((m) => m && m.id)
      .map((m) => ({
        id: m.id,
        name: m.name,
        signature: m.signature || undefined,
        description: m.summary || undefined,
      }));

    // 3. Mapping des attributs/champs
    const attributes: CodebaseAttribute[] = (record.fieldsData || [])
      .filter((f) => f && f.name)
      .map((f) => ({
        name: f.name,
        visibility: f.visibility || 'private',
      }));

    // 4. Construction / Mise à jour du CodebaseFile (Dédoublonnage)
    if (!filesMap.has(record.fileId)) {
      filesMap.set(record.fileId, {
        id: record.fileId || record.path,
        name: record.name,
        path: record.path,
        type: fileType,
        language,
        methods,
        attributes,
      });
    } else {
      const existingFile = filesMap.get(record.fileId)!;

      // Fusion des méthodes sans doublons
      const existingMethodIds = new Set(existingFile.methods?.map((m) => m.id));
      methods.forEach((m) => {
        if (!existingMethodIds.has(m.id)) {
          existingFile.methods?.push(m);
        }
      });

      // Fusion des attributs
      const existingAttrNames = new Set(existingFile.attributes?.map((a) => a.name));
      attributes.forEach((a) => {
        if (!existingAttrNames.has(a.name)) {
          existingFile.attributes?.push(a);
        }
      });
    }

    // 5. Mapping des dépendances (Relations inter-fichiers)
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

  return {
    files: Array.from(filesMap.values()),
    dependencies: Array.from(dependenciesMap.values()),
  };
}

/**
 * Déduit le type de composant à partir des labels Neo4j ou du nom de fichier
 */
function inferFileType(labels?: string[], fileName?: string): string {
  if (labels) {
    if (labels.includes('Interface')) return 'interface';
    if (labels.includes('Class')) return 'class';
    if (labels.includes('Controller') || labels.includes('RestController')) return 'component';
    if (labels.includes('Service') || labels.includes('Repository')) return 'component';
  }

  if (fileName) {
    if (fileName.endsWith('.properties') || fileName.endsWith('.yaml') || fileName.endsWith('.yml')) {
      return 'config';
    }
  }

  return 'class';
}

/**
 * Déduit le langage de programmation à partir de l'extension de fichier
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
    case 'properties':
      return 'properties';
    default:
      return ext || 'unknown';
  }
}
