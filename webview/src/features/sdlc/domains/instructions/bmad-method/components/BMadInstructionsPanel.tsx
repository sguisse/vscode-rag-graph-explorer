import React, { useMemo } from 'react';
import { Bot } from 'lucide-react';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem, SelectGroup, SelectLabel } from '@/components/ui/select';
import { useSdlcSessionStore } from '@/features/sdlc/core/store/useSdlcSessionStore';
import { SkillCategory, Skill } from '../model/skills';
import BMAD_SKILLS_DATA from '../data/bmad-skills-by-category.json';

export function BMadInstructionsPanel() {
  const categories = BMAD_SKILLS_DATA as SkillCategory[];
  const activeSessionId = useSdlcSessionStore((s) => s.activeSessionId);
  const session = useSdlcSessionStore((s) => (activeSessionId ? s.sessions[activeSessionId] : null));
  const updateSession = useSdlcSessionStore((s) => s.updateActiveSession);

  if (!session) return null;

  const selectedCommand = (session.instructionsPayload as any)?.selectedAgent || '';

  const selectedSkill = useMemo<Skill | null>(() => {
    if (!selectedCommand) return null;
    for (const cat of categories) {
      for (const skill of cat.skills) {
        if (skill.command === selectedCommand) return skill;
      }
    }
    return null;
  }, [categories, selectedCommand]);

  const handleAgentSelect = (val: string | null) => {
    if (!val) return;
    updateSession((draft) => {
      if (!draft.instructionsPayload) {
        draft.instructionsPayload = { strategy: 'bmad', promptText: '' };
      }
      (draft.instructionsPayload as any).selectedAgent = val;

      let skillName = val;
      let skillEmoji = '🤖';
      categories.forEach((cat) => {
        cat.skills.forEach((s) => {
          if (s.command === val) {
            skillName = s.name;
            skillEmoji = s.emoji;
          }
        });
      });

      const header = `[SKILL / AGENT]: ${skillEmoji} ${skillName} (${val})`;
      if (!draft.instructionsPayload.promptText?.includes(val)) {
        draft.instructionsPayload.promptText = `${header}\n${draft.instructionsPayload.promptText || ''}`;
      }
    });
  };

  return (
    <div className="space-y-3 p-3 font-mono text-xs animate-in fade-in h-full overflow-y-auto">
      <div className="bg-indigo-500/5 p-3 border border-indigo-500/20 rounded-lg">
        <h4 className="font-bold text-foreground text-sm uppercase">BMad Agent Framework</h4>
        <p className="text-[10px] text-muted-foreground mt-1">
          Structured prompting leveraging specific Agents and Skills for high-quality, predictable outputs.
        </p>
      </div>

      <div className="space-y-2 bg-card p-2.5 border border-border rounded-lg">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-3">
            <span className="font-bold text-[10px] text-foreground uppercase">
              <Bot size={12} className="inline mr-1 text-indigo-400" /> Agent / Skill Selection
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2 pt-1">
          <Select value={selectedCommand} onValueChange={handleAgentSelect}>
            <SelectTrigger className="bg-background w-full h-8 text-xs">
              <SelectValue placeholder="Select an Agent or Skill...">
                {selectedSkill ? (
                  <span className="flex items-center gap-1.5 truncate">
                    <span className="text-xs shrink-0">{selectedSkill.emoji}</span>
                    <span className="font-medium text-xs truncate shrink-0">{selectedSkill.name}</span>
                    <span className="text-[9px] text-muted-foreground truncate" style={{ fontSize: '9px' }}>
                      : {selectedSkill.description}
                    </span>
                  </span>
                ) : null}
              </SelectValue>
            </SelectTrigger>
            <SelectContent className="max-h-64 overflow-y-auto">
              {categories.map((cat) => (
                <SelectGroup key={cat.id}>
                  <SelectLabel className="flex items-center gap-1.5 font-bold text-[10px] text-muted-foreground uppercase py-1">
                    <span className="text-xs shrink-0">{cat.emoji}</span>
                    <span className="font-bold text-xs text-foreground truncate">{cat.title}</span>
                    <span className="text-[9px] text-muted-foreground truncate" style={{ fontSize: '9px' }}>
                      : {cat.description}
                    </span>
                  </SelectLabel>
                  {cat.skills.map((skill) => (
                    <SelectItem key={skill.command} value={skill.command}>
                      <span className="flex items-center gap-1.5 truncate">
                        <span className="text-xs shrink-0">{skill.emoji}</span>
                        <span className="font-medium text-xs truncate shrink-0">{skill.name}</span>
                        <span className="text-[9px] text-muted-foreground truncate" style={{ fontSize: '9px' }}>
                          : {skill.description}
                        </span>
                      </span>
                    </SelectItem>
                  ))}
                </SelectGroup>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="space-y-1">
        <label className="block font-bold text-[10px] text-muted-foreground uppercase">Structured Prompt:</label>
        <Textarea
          value={session.instructionsPayload?.promptText || ''}
          onChange={(e) =>
            updateSession((draft) => {
              if (!draft.instructionsPayload) draft.instructionsPayload = { strategy: 'bmad', promptText: '' };
              draft.instructionsPayload.promptText = e.target.value;
            })
          }
          placeholder="[CONTEXT]\n...\n[EXPECTED]\n...\n[OUTPUT FORMAT]\n..."
          className="bg-background min-h-[220px] font-mono text-xs resize-y"
        />
      </div>
    </div>
  );
}
