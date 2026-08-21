export interface JsonSchemaProperty {
  type: string;
  enum?: string[];
  required?: string[];
  items?: JsonSchemaProperty;
  properties?: Record<string, JsonSchemaProperty>;
  description?: string;
}

export interface JsonSchemaRoot extends JsonSchemaProperty {
  $schema: string;
  title: string;
  description: string;
}

export class CodebaseSchema {
  private static stringProp(enumVals?: string[]): JsonSchemaProperty {
    return enumVals ? { type: 'string', enum: enumVals } : { type: 'string' };
  }

  private static numberProp(): JsonSchemaProperty {
    return { type: 'number' };
  }

  private static arrayOfObjects(
    properties: Record<string, JsonSchemaProperty>,
    required?: string[]
  ): JsonSchemaProperty {
    return {
      type: 'array',
      items: {
        type: 'object',
        ...(required ? { required } : {}),
        properties,
      },
    };
  }

  /**
   * Generates the JSON Schema Root programmatically without static JSON strings.
   */
  public static getSchema(): JsonSchemaRoot {
    return {
      $schema: 'https://json-schema.org/draft/2020-12/schema',
      title: 'PolyglotDependencyUmlSchema',
      description: 'Data structure defining a polyglot ecosystem with its multi-level UML relationships',
      type: 'object',
      required: ['files', 'dependencies'],
      properties: {
        files: {
          type: 'array',
          items: {
            type: 'object',
            required: ['id', 'name', 'type', 'path', 'language'],
            properties: {
              id: this.stringProp(),
              name: this.stringProp(),
              type: this.stringProp(['class', 'interface', 'component', 'module', 'config']),
              path: this.stringProp(),
              language: this.stringProp(),
              size: this.numberProp(),
              complexity: this.numberProp(),
              attributes: this.arrayOfObjects({
                name: this.stringProp(),
                visibility: this.stringProp(['', 'private', 'public', 'protected']),
              }),
              methods: this.arrayOfObjects({
                id: this.stringProp(),
                name: this.stringProp(),
                visibility: this.stringProp(['', 'private', 'public', 'protected']),
                description: this.stringProp(),
              }),
              configProperties: this.arrayOfObjects({
                key: this.stringProp(),
                value: this.stringProp(),
              }),
            },
          },
        },
        dependencies: this.arrayOfObjects(
          {
            id: this.stringProp(),
            source: this.stringProp(),
            sourceHandle: this.stringProp(),
            target: this.stringProp(),
            targetHandle: this.stringProp(),
            relation: this.stringProp([
              'dependency',
              'association',
              'aggregation',
              'composition',
              'implementation',
              'extends',
            ]),
            label: this.stringProp(),
          },
          ['id', 'source', 'target', 'relation']
        ),
      },
    };
  }

  /**
   * Serializes the JSON Schema into a JSON string.
   * @param space Number of spaces to use for formatting indentation (default: 2).
   *              Use 0 for minified JSON.
   */
  public static getSchemaAsString(space: number = 2): string {
    return JSON.stringify(this.getSchema(), null, space);
  }

  /**
   * Validates structural compliance against schema requirements.
   */
  public static isValidPayload(raw: unknown): boolean {
    if (!raw || typeof raw !== 'object') return false;

    const data = raw as Record<string, unknown>;

    if (!Array.isArray(data.files) || !Array.isArray(data.dependencies)) {
      return false;
    }

    const isFileValid = data.files.every(
      (f: any) =>
        f &&
        typeof f.id === 'string' &&
        typeof f.name === 'string' &&
        typeof f.type === 'string' &&
        typeof f.path === 'string' &&
        typeof f.language === 'string'
    );

    const isDepValid = data.dependencies.every(
      (d: any) =>
        d &&
        typeof d.id === 'string' &&
        (typeof d.source === 'string' || typeof d.sourceNode === 'string') &&
        (typeof d.target === 'string' || typeof d.targetNode === 'string') &&
        typeof d.relation === 'string'
    );

    return isFileValid && isDepValid;
  }

}
