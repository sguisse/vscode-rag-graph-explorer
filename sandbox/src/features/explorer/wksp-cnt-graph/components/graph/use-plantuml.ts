import { useMemo } from 'react';
import { FOLDER_KEYS_REGISTERED_CONFIG, CodebaseFile, Dependency } from '@/services/codebase';

export function usePlantUml(searchFilteredFiles: CodebaseFile[], visibleFiles: Record<string, boolean>, dependencies: Dependency[]) {
  return useMemo(() => {
    let puml = `' Real-time synchronization state\n@startuml Codebase_Architecture_State\n\n`;

    FOLDER_KEYS_REGISTERED_CONFIG.forEach(f => {
      const folderFiles = searchFilteredFiles.filter(file => file.path.startsWith(f));
      if (folderFiles.length > 0) {
        puml += `package "${f}" {\n`;
        folderFiles.forEach(file => {
          if (file.type === 'config') {
            puml += `  class ${file.id.replace(/\.[^/.]+$/, "")} << (C, #f59e0b) Config >> {\n`;
            file.configProperties?.forEach((prop) => { puml += `    {field} ${prop.key}\n`; });
            puml += `  }\n`;
          } else {
            const stereotype = file.type === 'interface' ? '<< Interface >>' : file.type === 'component' ? '<< Component >>' : '';
            puml += `  class ${file.id.replace(/\.[^/.]+$/, "")} ${stereotype} {\n`;
            file.attributes?.forEach((attr) => { puml += `    {field} ${attr.name}\n`; });
            file.methods?.forEach((m) => { puml += `    {method} + ${m.name}\n`; });
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
        let arrow: string;
        switch (dep.relation) {
          case 'aggregation': arrow = '--o'; break;
          case 'composition': arrow = '--*'; break;
          case 'implementation': arrow = '--|>'; break;
          case 'extends': arrow = '-->>'; break;
          default: arrow = '-->'; break;
        }
        puml += `${sourceNode} ${arrow} ${targetNode} : ${label}\n`;
      }
    });

    return puml + `\n@enduml`;
  }, [searchFilteredFiles, visibleFiles, dependencies]);
}
