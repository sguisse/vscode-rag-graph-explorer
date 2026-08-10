import { SelectedEntity, CodebaseData, CodebaseFile } from "@/shared/services/graph-rag-explorer";

export function generateMarkdownRecipe(
    selectedEntity: SelectedEntity | null,
    enableDownstream: boolean,
    enableUpstream: boolean,
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
    const dirs: string[] = [];
    if (enableDownstream) dirs.push('Downstream (Descendants callees)');
    if (enableUpstream) dirs.push('Upstream (Ascending callers)');
    md += `**Direction of Propagation :** ${dirs.length > 0 ? dirs.join(' & ') : 'None'}\n\n`;
    md += `#### 📋 List of components to retest\n\n`;
    codebase.files.forEach((file: CodebaseFile) => {
      if (impactedSet.has(file.id)) {
        md += `- [ ] **${file.name}** (\`${file.path}\`)\n`;
      }
    });
    return md;
  }
