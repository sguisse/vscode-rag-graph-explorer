import { CodebaseFile } from '../model/codebase.model';

export function filterCodebaseFiles(
  files: CodebaseFile[],
  searchTerm: string,
  displayLevel: string,
  visibleFiles: Record<string, boolean>,
  maxNodesLimit: number
): CodebaseFile[] {
  return files.filter(file => {
    const matchesSearch = file.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          file.path.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesLevel = displayLevel === 'all' || file.type === displayLevel;
    return matchesSearch && visibleFiles[file.id] && matchesLevel;
  }).slice(0, maxNodesLimit);
}
