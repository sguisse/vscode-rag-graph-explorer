import React from 'react';
import {
  ChevronDown,
  ChevronRight,
  Sparkles,
  ChevronsDown,
  ChevronsUp,
  FolderTree,
  ListOrdered,
  Search,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { TopMiddleBottomPanel } from '@/components/app/top-middle-bottom-panel';
import { FinderTree, FinderHtml } from '@/components/app/core/finder';
import { useBMadMethodPanel } from '../hooks/use-bmad-method-panel';

export function BMadMethodPanel() {
  const {
    categories,
    viewMode,
    toggleViewMode,
    collapsedMap,
    toggleCategory,
    handleExpandAll,
    handleCollapseAll,
    selectedCommand,
    handleSelectSkill,
    flatSkills,
    finder,
  } = useBMadMethodPanel();

  const topContent = (
    <div className="flex flex-col border-b border-border bg-muted/20 w-full font-mono text-xs shrink-0">
      <div className="flex justify-between items-center px-2 py-1 border-b border-border/50 w-full">
        <div className="flex items-center gap-1.5 font-bold text-foreground text-xs">
          <Sparkles size={13} className="text-indigo-400" />
          <span>BMad Skills & Agents</span>
        </div>

        <div className="flex items-center gap-0.5 shrink-0">
          <Button
            id="btn-toggle-bmad-finder"
            className={`h-7 w-7 rounded transition-colors ${
              finder.isFinderOpen
                ? 'bg-primary/20 text-primary border border-primary/40 font-bold'
                : 'text-muted-foreground hover:bg-muted hover:text-foreground'
            }`}
            variant="ghost"
            size="icon"
            onClick={finder.toggleFinder}
            data-tooltip="Find Skill (Cmd+F)"
          >
            <Search size={12} />
          </Button>

          <Button
            id="btn-toggle-bmad-view-mode"
            className="hover:bg-muted rounded w-7 h-7 text-muted-foreground hover:text-foreground transition-colors"
            variant="ghost"
            size="icon"
            onClick={toggleViewMode}
            data-tooltip={viewMode === 'tree' ? 'Switch to Flat View' : 'Switch to Tree View'}
          >
            {viewMode === 'tree' ? <FolderTree size={12} /> : <ListOrdered size={12} />}
          </Button>

          {viewMode === 'tree' && (
            <>
              <Button
                id="btn-collapse-all-bmad-skills"
                className="hover:bg-muted rounded w-7 h-7 text-muted-foreground hover:text-foreground transition-colors"
                variant="ghost"
                size="icon"
                onClick={handleCollapseAll}
                data-tooltip="Collapse All"
              >
                <ChevronsUp size={12} />
              </Button>
              <Button
                id="btn-expand-all-bmad-skills"
                className="hover:bg-muted rounded w-7 h-7 text-muted-foreground hover:text-foreground transition-colors"
                variant="ghost"
                size="icon"
                onClick={handleExpandAll}
                data-tooltip="Expand All"
              >
                <ChevronsDown size={12} />
              </Button>
            </>
          )}
        </div>
      </div>

      {finder.isFinderOpen && (
        <div className="border-t border-border/50 w-full">
          <FinderTree
            searchQuery={finder.searchQuery}
            setSearchQuery={finder.setSearchQuery}
            caseSensitive={finder.caseSensitive}
            setCaseSensitive={finder.setCaseSensitive}
            wholeWord={finder.wholeWord}
            setWholeWord={finder.setWholeWord}
            useRegex={finder.useRegex}
            setUseRegex={finder.setUseRegex}
            currentMatchIndex={finder.currentMatchIndex}
            totalMatches={finder.totalMatches}
            onNext={finder.handleNextMatch}
            onPrev={finder.handlePrevMatch}
            onClose={finder.closeFinder}
            focusTrigger={finder.focusTrigger}
            isFilterActive={finder.isFilterActive}
            setIsFilterActive={finder.setIsFilterActive}
            collapseNotMatchingNodes={finder.collapseNotMatchingNodes}
            setCollapseNotMatchingNodes={finder.setCollapseNotMatchingNodes}
            placeholder="Find skill or agent..."
          />
        </div>
      )}
    </div>
  );

  const middleContent = (
    <div className="flex flex-col space-y-1 p-1 w-full h-full min-h-0 overflow-y-auto font-mono text-xs select-none">
      {viewMode === 'tree' ? (
        categories.map((category) => {
          const isCollapsed = Boolean(collapsedMap[category.id]);
          const isCatMatching = finder.matchingIds.size === 0 || finder.matchingIds.has(category.id);
          const matchingSkills = category.skills.filter(
            (skill) =>
              finder.matchingIds.size === 0 ||
              finder.matchingIds.has(skill.command) ||
              finder.matchingIds.has(category.id)
          );

          if (finder.isFilterActive && finder.searchQuery.trim() && !isCatMatching && matchingSkills.length === 0) {
            return null;
          }

          const skillsToDisplay =
            finder.isFilterActive && finder.searchQuery.trim() ? matchingSkills : category.skills;

          return (
            <div key={category.id} id={`bmad-skill-node-${category.id}`} className="space-y-0.5">
              <div
                onClick={() => toggleCategory(category.id)}
                className="flex items-center gap-1.5 hover:bg-muted/60 p-1.5 border border-transparent rounded-md transition-colors cursor-pointer"
              >
                {isCollapsed ? (
                  <ChevronRight size={13} className="text-muted-foreground shrink-0" />
                ) : (
                  <ChevronDown size={13} className="text-muted-foreground shrink-0" />
                )}
                <span className="text-xs shrink-0">{category.emoji}</span>
                <span className="font-bold text-foreground text-xs truncate">
                  <FinderHtml
                    text={category.title}
                    searchQuery={finder.searchQuery}
                    caseSensitive={finder.caseSensitive}
                    wholeWord={finder.wholeWord}
                    useRegex={finder.useRegex}
                    currentMatchIndex={finder.currentMatchIndex}
                  />
                </span>
                <span className="text-[9px] text-muted-foreground truncate" style={{ fontSize: '9px' }}>
                  : {category.description}
                </span>
              </div>

              {!isCollapsed && (
                <div className="space-y-0.5 ml-3 pl-2 border-border/60 border-l">
                  {skillsToDisplay.map((skill) => {
                    const isSelected = selectedCommand === skill.command;

                    return (
                      <div
                        key={skill.command}
                        id={`bmad-skill-node-${skill.command}`}
                        onClick={() => handleSelectSkill(skill)}
                        className={`flex items-center gap-1.5 p-1 rounded-md cursor-pointer transition-colors ${
                          isSelected
                            ? 'bg-indigo-500/20 text-indigo-400 font-bold border border-indigo-500/30'
                            : 'hover:bg-muted/50 text-foreground/90'
                        }`}
                        data-tooltip={`${skill.name} (${skill.command})`}
                      >
                        <span className="text-xs shrink-0">{skill.emoji}</span>
                        <span className="font-medium text-xs shrink-0">
                          <FinderHtml
                            text={skill.name}
                            searchQuery={finder.searchQuery}
                            caseSensitive={finder.caseSensitive}
                            wholeWord={finder.wholeWord}
                            useRegex={finder.useRegex}
                            currentMatchIndex={finder.currentMatchIndex}
                          />
                        </span>
                        <span className="text-[9px] text-muted-foreground truncate" style={{ fontSize: '9px' }}>
                          : {skill.description}
                        </span>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })
      ) : (
        flatSkills
          .filter(({ skill, categoryTitle }) => {
            if (!finder.isFilterActive || !finder.searchQuery.trim()) return true;
            return finder.matchingIds.has(skill.command) || finder.matchingIds.has(categoryTitle);
          })
          .map(({ skill, categoryTitle, categoryEmoji }, index) => {
            const isSelected = selectedCommand === skill.command;

            return (
              <div
                key={skill.command}
                id={`bmad-skill-node-${skill.command}`}
                onClick={() => handleSelectSkill(skill)}
                className={`flex items-center gap-2 p-1.5 rounded-md cursor-pointer transition-colors border ${
                  isSelected
                    ? 'bg-indigo-500/20 text-indigo-400 font-bold border-indigo-500/30'
                    : 'border-transparent hover:bg-muted/50 text-foreground/90'
                }`}
                data-tooltip={`${skill.name} (${skill.command})`}
              >
                <span className="font-bold text-[10px] text-muted-foreground w-5 text-right shrink-0">
                  {index + 1}.
                </span>
                <span className="text-xs shrink-0">{skill.emoji}</span>
                <div className="flex flex-col min-w-0 flex-1">
                  <div className="flex items-center gap-1.5">
                    <span className="font-semibold text-xs text-foreground truncate">
                      <FinderHtml
                        text={skill.name}
                        searchQuery={finder.searchQuery}
                        caseSensitive={finder.caseSensitive}
                        wholeWord={finder.wholeWord}
                        useRegex={finder.useRegex}
                        currentMatchIndex={finder.currentMatchIndex}
                      />
                    </span>
                    <span className="px-1 py-0.2 rounded border border-border bg-muted/60 text-[9px] text-muted-foreground shrink-0 font-mono">
                      {categoryEmoji} {categoryTitle}
                    </span>
                  </div>
                  <span className="text-[10px] text-muted-foreground truncate">
                    {skill.command} : {skill.description}
                  </span>
                </div>
              </div>
            );
          })
      )}
    </div>
  );

  return (
    <TopMiddleBottomPanel
      id="panel-bmad-method-navigator"
      className="bg-card w-full h-full min-h-0 overflow-hidden"
      top={topContent}
      middle={middleContent}
    />
  );
}
