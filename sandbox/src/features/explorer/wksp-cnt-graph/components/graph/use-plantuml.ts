import { useMemo } from 'react';

export function usePlantUml(searchFilteredFiles: any[], visibleFiles: Record<string, boolean>, dependencies: any[]) {
  return useMemo(() => {
    let puml = `' Real-time synchronization state\n@startuml Codebase_Architecture_State\n\n`;

    ['frontend', 'backend', 'config'].forEach(f => {
      const folderFiles = searchFilteredFiles.filter(file => file.path.startsWith(f));
      if (folderFiles.length > 0) {
        puml += `package "${f}" {\n`;
        folderFiles.forEach(file => {
          if (file.type === 'config') {
            puml += `  class ${file.id.replace(/\.[^/.]+$/, "")} << (C, #f59e0b) Config >> {\n`;
            file.configProperties?.forEach((prop: any) => { puml += `    {field} ${prop.key}\n`; });
            puml += `  }\n`;
          } else {
            const stereotype = file.type === 'interface' ? '<< Interface >>' : file.type === 'component' ? '<< Component >>' : '';
            puml += `  class ${file.id.replace(/\.[^/.]+$/, "")} ${stereotype} {\n`;
            file.attributes?.forEach((attr: any) => { puml += `    {field} ${attr.name}\n`; });
            file.methods?.forEach((m: any) => { puml += `    {method} + ${m.name}\n`; });
            puml += `  }\n`;
          }
        });
        puml += `}\n\n`;
      }
    });

    dependencies.forEach(dep => {
      if (visibleFiles[dep.sourceNode] && visibleFiles[dep.targetNode]) {
        const sourceNode = dep.sourceNode.replace(/\.[^/.]+$/, "");
        const targetNode = dep.targetNode.replace(/\.[^/.]+$/, "");
        const label = `"${dep.label}"`;
        // Use different arrow types based on relationship type
        let arrow: string;
        switch (dep.relation) {
          case 'aggregation':
            arrow = '--o';
            break;
          case 'composition':
            arrow = '--*';
            break;
          case 'implementation':
            arrow = '--|>';
            break;
          case 'extends':
            arrow = '-->>';
            break;
          default:
            arrow = '-->';
            break;
        }
        puml += `${sourceNode} ${arrow} ${targetNode} : ${label}\n`;
      }
    });

    return puml + `\n@enduml`;
  }, [searchFilteredFiles, visibleFiles, dependencies]);
}
