import React from 'react';
import { ChevronDown, ChevronRight, Folder, FileCode, Database } from 'lucide-react';
import { Checkbox } from '@/components/ui/checkbox';
import { FinderHtml } from '@/components/app/core/finder/FinderHtml';
import { TriStateCheckbox } from './TriStateCheckbox';
import { RecursiveFolderNodeProps } from '../model-ui';
import { DYNAMIC_COLORS } from '../constants/codebase-explorer.constants';
import { getAllFilesFromNode, nodeHasMatches } from '../utils/codebase-tree.utils';

export function RecursiveFolderNode({
  node,
  depth,
  expandedFolders,
  visibleFiles,
  toggleFolder,
  toggleFileCheckbox,
  setSelectedEntity,
  onFocusNode,
  theme,
  toggleFileListCheckbox,
  handleFileDoubleClick,
  handleFolderDoubleClick,
  handleFileClick,
  handleFolderClick,
  finderState,
}: RecursiveFolderNodeProps) {
  const isFilterActiveWithQuery = finderState.isFilterActive && Boolean(finderState.searchQuery.trim());

  if (isFilterActiveWithQuery && !nodeHasMatches(node, finderState.matchingFileIds)) {
    return null;
  }

  const isExpanded =
    isFilterActiveWithQuery && !finderState.collapseNodeSearchNotCompliantEnabled
      ? true
      : (expandedFolders[node.id] ?? true);

  const allNodeFiles = getAllFilesFromNode(node);

  const displayFiles = isFilterActiveWithQuery
    ? node.files.filter((f) => finderState.matchingFileIds.has(f.id))
    : node.files;

  const isAllChecked = allNodeFiles.length > 0 && allNodeFiles.every((f) => visibleFiles[f.id]);
  const isSomeChecked = allNodeFiles.some((f) => visibleFiles[f.id]);
  const isIndeterminate = isSomeChecked && !isAllChecked;

  return (
    <div key={node.id} className="mb-1">
      <div className="group flex items-center gap-1.5 hover:bg-muted/50 px-1 py-1 rounded">
        <TriStateCheckbox
          checked={isAllChecked}
          indeterminate={isIndeterminate}
          onChange={() => toggleFileListCheckbox(allNodeFiles)}
        />
        <div
          className="flex flex-1 items-center gap-1.5 min-w-0 cursor-pointer"
          onClick={() => handleFolderClick(node.id, node.folderPath)}
          onDoubleClick={(e) => handleFolderDoubleClick(node.folderPath, allNodeFiles, e)}
        >
          {isExpanded ? (
            <ChevronDown size={14} className="shrink-0" />
          ) : (
            <ChevronRight size={14} className="shrink-0" />
          )}
          <Folder size={14} className={`${theme.fill} ${theme.text} shrink-0`} />
          <span className="font-semibold text-foreground/90 truncate" title={node.name}>
            {finderState.isFinderOpen && finderState.searchQuery ? (
              <FinderHtml
                text={`${node.name}/`}
                searchQuery={finderState.searchQuery}
                caseSensitive={finderState.caseSensitive}
                wholeWord={finderState.wholeWord}
                useRegex={finderState.useRegex}
                currentMatchIndex={finderState.currentMatchIndex}
                matchStartIndex={-1}
              />
            ) : (
              `${node.name}/`
            )}
          </span>
        </div>
      </div>

      {isExpanded && (
        <div className="space-y-1 mt-1 ml-2.5 pl-3 border-border border-l">
          {displayFiles.map((file) => {
            const matchIndex = finderState.matchingFileIndexMap.get(file.id) ?? -1;
            return (
              <div
                key={file.id}
                id={`tree-file-node-${file.id}`}
                className="group flex items-center gap-1.5 hover:bg-muted px-2 py-1 rounded transition-colors"
              >
                <Checkbox
                  checked={!!visibleFiles[file.id]}
                  onCheckedChange={() => toggleFileCheckbox(file.id)}
                  onClick={(e) => e.stopPropagation()}
                  className="w-3.5 h-3.5 shrink-0"
                />
                <span
                  className={`flex items-center gap-1.5 truncate cursor-pointer flex-1 min-w-0 ${
                    visibleFiles[file.id] ? 'text-foreground font-medium' : 'text-muted-foreground line-through'
                  }`}
                  onClick={() => handleFileClick(file)}
                  onDoubleClick={(e) => handleFileDoubleClick(file, e)}
                >
                  {file.type === 'config' ? (
                    <Database size={13} className="text-amber-500 shrink-0" />
                  ) : (
                    <FileCode
                      size={13}
                      className={
                        file.type === 'interface'
                          ? 'text-indigo-400 shrink-0'
                          : theme.iconColor || 'text-slate-400'
                      }
                    />
                  )}
                  <span className="truncate">
                    {finderState.isFinderOpen && finderState.searchQuery ? (
                      <FinderHtml
                        text={file.name}
                        searchQuery={finderState.searchQuery}
                        caseSensitive={finderState.caseSensitive}
                        wholeWord={finderState.wholeWord}
                        useRegex={finderState.useRegex}
                        currentMatchIndex={finderState.currentMatchIndex}
                        matchStartIndex={matchIndex}
                      />
                    ) : (
                      file.name
                    )}
                  </span>
                </span>
              </div>
            );
          })}

          {node.children.map((childNode, childIdx) => (
            <RecursiveFolderNode
              key={childNode.id}
              node={childNode}
              depth={depth + 1}
              expandedFolders={expandedFolders}
              visibleFiles={visibleFiles}
              toggleFolder={toggleFolder}
              toggleFileCheckbox={toggleFileCheckbox}
              setSelectedEntity={setSelectedEntity}
              onFocusNode={onFocusNode}
              theme={DYNAMIC_COLORS[(depth + childIdx) % DYNAMIC_COLORS.length]}
              toggleFileListCheckbox={toggleFileListCheckbox}
              handleFileDoubleClick={handleFileDoubleClick}
              handleFolderDoubleClick={handleFolderDoubleClick}
              handleFileClick={handleFileClick}
              handleFolderClick={handleFolderClick}
              finderState={finderState}
            />
          ))}
        </div>
      )}
    </div>
  );
}
