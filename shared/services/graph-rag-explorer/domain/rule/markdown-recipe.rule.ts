import { SelectedEntity, ImpactDirection, CodebaseData, CodebaseFile } from '../model/codebase.model';

export function generateMarkdownRecipe(
  selectedEntity: SelectedEntity | null,
  impactDirection: ImpactDirection,
  impactedSet: Set<string>,
  codebase: CodebaseData
): string {
  let md = `### 🛡️ Impact Plan & Polyglot Recipe Sheet\n\n`;
  let startElement = 'Undefined';
  if (selectedEntity) {
    if (selectedEntity.type === 'member') {
      startElement = `Method \`${selectedEntity.memberId}()\` of \`${selectedEntity.nodeId}\``;
    } else {
      startElement = `File \`${selectedEntity.nodeId}\``;
    }
  }
  md += `**Trigger Element :** ${startElement}\n`;
  md += `**Direction of Propagation :** ${impactDirection === 'aval' ? 'Downstream (Descendants callees)' : 'Upstream (Ascending callers)'}\n\n`;
  md += `#### 📋 List of components to retest\n\n`;
  codebase.files.forEach((file: CodebaseFile) => {
    if (impactedSet.has(file.id)) {
      md += `- [ ] **${file.name}** (\`${file.path}\`)\n`;
    }
  });
  return md;
}
