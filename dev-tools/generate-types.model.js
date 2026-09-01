export interface TypeValueDefinition {
  value: string;
  label: string;
  icon?: string;
}

export interface TypeDefinition {
  name: string;
  path: string;
  values: TypeValueDefinition[];
}
