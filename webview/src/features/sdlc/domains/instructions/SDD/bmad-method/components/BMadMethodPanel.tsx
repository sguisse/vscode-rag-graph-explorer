import React, { useState } from 'react';
import { ChevronDown, ChevronRight, Sparkles, ChevronsDown, ChevronsUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { TopMiddleBottomPanel } from '@/components/app/top-middle-bottom-panel';
import { SkillsByCategoryConfig, Skill } from '../../../model/skills';
import BMAD_SKILLS_DATA from '../data/bmad-skills-by-category.yaml';
import { useSdlcSessionStore } from '@/features/sdlc/core/store/useSdlcSessionStore';

export function BMadMethodPanel() {
  const categories = BMAD_SKILLS_DATA as SkillsByCategoryConfig;
  const activeSessionId = useSdlcSessionStore((s) => s.activeSessionId);
  const session = useSdlcSessionStore((s) => (activeSessionId ? s.sessions[activeSessionId] : null));
  const updateSession = useSdlcSessionStore((s) => s.updateActiveSession);

  // Track collapsed state for categories
  const [collapsedMap, setCollapsedMap] = useState<Record<string, boolean>>(() => {
    const initial: Record<string, boolean> = {};
    categories.forEach((cat) => {
      initial[cat.id] = cat.collapsed ?? false;
    });
    return initial;
  });

  const toggleCategory = (catId: string) => {
    setCollapsedMap((prev) => ({
      ...prev,
      [catId]: !prev[catId],
    }));
  };

  const handleExpandAll = () => {
    const nextMap: Record<string, boolean> = {};
    categories.forEach((cat) => {
      nextMap[cat.id] = false;
    });
    setCollapsedMap(nextMap);
  };

  const handleCollapseAll = () => {
    const nextMap: Record<string, boolean> = {};
    categories.forEach((cat) => {
      nextMap[cat.id] = true;
    });
    setCollapsedMap(nextMap);
  };

  const selectedCommand = (session?.instructionsPayload as any)?.selectedAgent || '';

  const handleSelectSkill = (skill: Skill) => {
    if (!session) return;
    updateSession((draft) => {
      if (!draft.instructionsPayload) {
        draft.instructionsPayload = { strategy: 'bmad', promptText: '' };
      }
      (draft.instructionsPayload as any).selectedAgent = skill.command;
      const agentHeader = `[SKILL / AGENT]: ${skill.emoji} ${skill.name} (${skill.command})`;
      if (!draft.instructionsPayload.promptText?.includes(skill.command)) {
        draft.instructionsPayload.promptText = `${agentHeader}\n${draft.instructionsPayload.promptText || ''}`;
      }
    });
  };

  const topContent = (
    <div className="flex justify-between items-center bg-muted/20 p-0 border-border border-b w-full font-mono text-xs shrink-0">


      <div className="flex items-center gap-0.5 pr-1 shrink-0">
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
      </div>
    </div>
  );

  const middleContent = (
    <div className="flex flex-col space-y-1 p-1 w-full h-full min-h-0 overflow-y-auto font-mono text-xs select-none">
      {categories.map((category) => {
        const isCollapsed = Boolean(collapsedMap[category.id]);

        return (
          <div key={category.id} className="space-y-0.5">
            {/* Category Header Node */}
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
              <span className="font-bold text-foreground text-xs truncate">{category.title}</span>
              <span className="text-[9px] text-muted-foreground truncate" style={{ fontSize: '9px' }}>
                : {category.description}
              </span>
            </div>

            {/* Sub-Node Skills List */}
            {!isCollapsed && (
              <div className="space-y-0.5 ml-3 pl-2 border-border/60 border-l">
                {category.skills.map((skill) => {
                  const isSelected = selectedCommand === skill.command;

                  return (
                    <div
                      key={skill.command}
                      onClick={() => handleSelectSkill(skill)}
                      className={`flex items-center gap-1.5 p-1 rounded-md cursor-pointer transition-colors ${
                        isSelected
                          ? 'bg-indigo-500/20 text-indigo-400 font-bold border border-indigo-500/30'
                          : 'hover:bg-muted/50 text-foreground/90'
                      }`}
                      data-tooltip={`${skill.name} (${skill.command})`}
                    >
                      <span className="text-xs shrink-0">{skill.emoji}</span>
                      <span className="font-medium text-xs shrink-0">{skill.name}</span>
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
      })}
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
