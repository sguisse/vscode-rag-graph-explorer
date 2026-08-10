import {
  CodebaseData,
  CodebaseFile,
  Dependency,
  CodebaseAttribute,
  CodebaseMethod,
  ConfigProperty,
} from '../model/codebase.model';
import { CodebaseSchema } from '../model/neo4j/codebase.schema';

  /**
   * Parses a raw JSON string, validates schema structure, and maps it to CodebaseData domain model.
   */
export function parseAndMap(jsonString: string): CodebaseData {
    let parsed: unknown;
    try {
      parsed = JSON.parse(jsonString);
    } catch (err) {
      throw new Error(`JSON parsing failed: ${err instanceof Error ? err.message : String(err)}`);
    }

    if (!CodebaseSchema.isValidPayload(parsed)) {
      throw new Error('Payload validation failed: JSON structure does not satisfy JsonSchemaRoot requirements.');
    }

    const raw = parsed as { files: any[]; dependencies: any[] };

    const files: CodebaseFile[] = raw.files.map((file, idx) => ({
      id: String(file.id ?? `file-${idx}`),
      name: String(file.name ?? ''),
      type: String(file.type ?? 'component'),
      path: String(file.path ?? ''),
      language: String(file.language ?? 'unknown'),
      size: typeof file.size === 'number' ? file.size : 0,
      complexity: typeof file.complexity === 'number' ? file.complexity : 0,
      attributes: Array.isArray(file.attributes)
        ? file.attributes.map(
            (attr: any): CodebaseAttribute => ({
              name: String(attr?.name ?? ''),
              visibility: String(attr?.visibility ?? 'public'),
            })
          )
        : undefined,
      methods: Array.isArray(file.methods)
        ? file.methods.map(
            (m: any): CodebaseMethod => ({
              id: String(m?.id ?? ''),
              name: String(m?.name ?? ''),
              description: String(m?.description ?? ''),
            })
          )
        : undefined,
      configProperties: Array.isArray(file.configProperties)
        ? file.configProperties.map(
            (cp: any): ConfigProperty => ({
              key: String(cp?.key ?? ''),
              value: String(cp?.value ?? ''),
            })
          )
        : undefined,
    }));

    const dependencies: Dependency[] = raw.dependencies.map((dep, idx) => {
      const sourceNode = String(dep.sourceNode ?? dep.source ?? '');
      const targetNode = String(dep.targetNode ?? dep.target ?? '');

      return {
        id: String(dep.id ?? `dep-${idx}`),
        sourceNode,
        sourceHandle: String(dep.sourceHandle ?? sourceNode),
        targetNode,
        targetHandle: String(dep.targetHandle ?? targetNode),
        relation: String(dep.relation ?? 'dependency'),
        label: String(dep.label ?? dep.relation ?? 'DEPENDS_ON'),
      };
    });

    return { files, dependencies };
  }
