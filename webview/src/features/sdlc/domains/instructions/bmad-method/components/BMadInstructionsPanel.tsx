import React, { useMemo, useState, useEffect, useCallback } from 'react';
import { Bot } from 'lucide-react';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select';
import { useSdlcSessionStore } from '@/features/sdlc/core/store/useSdlcSessionStore';
import { SkillsByCategoryConfig, Skill } from '../model/skills';
import BMAD_SKILLS_DATA from '../data/bmad-skills-by-category.yaml';
import { TopMiddleBottomPanel } from '@/components/app/top-middle-bottom-panel';
import { ProjectReferencesPanel } from '@/components/app/project-references';

function formatPromptText(text: string): string {
  if (!text) return '';
  let formatted = text.replace(/\\n/g, '\n');
  formatted = formatted
    .replace(/(BUSINESS CONTEXT:)/g, '\n$1')
    .replace(/(EXPECTED ACTION:)/g, '\n\n$1')
    .replace(/(OUTPUT FORMAT:)/g, '\n\n$1')
    .trim();
  return formatted;
}

export function BMadInstructionsPanel() {
  const categories = BMAD_SKILLS_DATA as SkillsByCategoryConfig;
  const activeSessionId = useSdlcSessionStore((s) => s.activeSessionId);
  const session = useSdlcSessionStore((s) => (activeSessionId ? s.sessions[activeSessionId] : null));
  const updateSession = useSdlcSessionStore((s) => s.updateActiveSession);

  const [autoCopySample, setAutoCopySample] = useState<boolean>(true);
  const [selectedDomain, setSelectedDomain] = useState<string>('');
  const [selectedSubDomain, setSelectedSubDomain] = useState<string>('');

  const selectedCommand = (session?.instructionsPayload as any)?.selectedAgent || '';

  const selectedSkill = useMemo<Skill | null>(() => {
    if (!selectedCommand) return null;
    for (const cat of categories) {
      for (const skill of cat.skills) {
        if (skill.command === selectedCommand) return skill;
      }
    }
    return null;
  }, [categories, selectedCommand]);

  const domainMap = useMemo(() => {
    const map: Record<string, Record<string, string>> = {};

    const sourceSkills = selectedSkill?.prompts && selectedSkill.prompts.length > 0
      ? [selectedSkill]
      : categories.flatMap((cat) => cat.skills);

    sourceSkills.forEach((skill) => {
      if (!skill.prompts) return;
      skill.prompts.forEach((domainObj) => {
        Object.entries(domainObj).forEach(([domainName, promptMap]) => {
          if (!map[domainName]) {
            map[domainName] = {};
          }
          if (promptMap && typeof promptMap === 'object') {
            Object.entries(promptMap).forEach(([subDomain, rawPrompt]) => {
              map[domainName][subDomain] = formatPromptText(rawPrompt);
            });
          }
        });
      });
    });

    return map;
  }, [categories, selectedSkill]);

  const domains = useMemo(() => Object.keys(domainMap), [domainMap]);

  const subDomains = useMemo(() => {
    if (!selectedDomain || !domainMap[selectedDomain]) return [];
    return Object.keys(domainMap[selectedDomain]);
  }, [domainMap, selectedDomain]);

  const applyPromptToTextarea = useCallback(
    (promptText: string) => {
      if (!promptText) return;
      updateSession((draft) => {
        if (!draft.instructionsPayload) {
          draft.instructionsPayload = { strategy: 'bmad', promptText: '' };
        }
        draft.instructionsPayload.promptText = promptText;
      });
    },
    [updateSession]
  );

  useEffect(() => {
    if (domains.length === 0) return;

    let targetDomain = selectedDomain;
    if (!targetDomain || !domainMap[targetDomain]) {
      targetDomain = domains[0];
      setSelectedDomain(targetDomain);
    }

    const availSubDomains = domainMap[targetDomain] ? Object.keys(domainMap[targetDomain]) : [];
    let targetSubDomain = selectedSubDomain;
    if (!targetSubDomain || !availSubDomains.includes(targetSubDomain)) {
      targetSubDomain = availSubDomains[0] || '';
      setSelectedSubDomain(targetSubDomain);
    }

    if (autoCopySample && targetDomain && targetSubDomain && domainMap[targetDomain]?.[targetSubDomain]) {
      const sampleText = domainMap[targetDomain][targetSubDomain];
      applyPromptToTextarea(sampleText);
    }
  }, [domains, domainMap]);

  if (!session) return null;

  const handleCheckboxChange = (checked: boolean) => {
    setAutoCopySample(checked);
    if (checked && selectedDomain && selectedSubDomain && domainMap[selectedDomain]?.[selectedSubDomain]) {
      applyPromptToTextarea(domainMap[selectedDomain][selectedSubDomain]);
    }
  };

  const handleDomainSelect = (val: string | null) => {
    if (!val) return;
    setSelectedDomain(val);
    const availableSubs = domainMap[val] ? Object.keys(domainMap[val]) : [];
    const firstSub = availableSubs[0] || '';
    setSelectedSubDomain(firstSub);

    if (autoCopySample && val && firstSub && domainMap[val]?.[firstSub]) {
      applyPromptToTextarea(domainMap[val][firstSub]);
    }
  };

  const handleSubDomainSelect = (subDomain: string | null) => {
    if (!subDomain) return;
    setSelectedSubDomain(subDomain);
    if (autoCopySample && selectedDomain && subDomain && domainMap[selectedDomain]?.[subDomain]) {
      applyPromptToTextarea(domainMap[selectedDomain][subDomain]);
    }
  };

  return (
    <TopMiddleBottomPanel
      id="bmad-instructions-panel"
      className="h-full p-2 gap-3"
      top={
        <div className="space-y-2">
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
                  <Bot size={12} className="inline mr-1 text-indigo-400" /> Domain & Subdomain Prompt Selection
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2 pt-1">
              <label className="flex items-center gap-1.5 cursor-pointer text-[10px] font-medium text-muted-foreground hover:text-foreground shrink-0 select-none">
                <input
                  type="checkbox"
                  checked={autoCopySample}
                  onChange={(e) => handleCheckboxChange(e.target.checked)}
                  className="rounded border-border bg-background text-indigo-500 focus:ring-indigo-500 h-3.5 w-3.5 cursor-pointer accent-indigo-500"
                />
                <span>Auto-copy</span>
              </label>

              <Select value={selectedDomain} onValueChange={handleDomainSelect}>
                <SelectTrigger className="bg-background w-1/2 h-8 text-xs">
                  <SelectValue placeholder="Select Domain..." />
                </SelectTrigger>
                <SelectContent>
                  {domains.map((domain) => (
                    <SelectItem key={domain} value={domain}>
                      {domain}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select
                value={selectedSubDomain}
                onValueChange={handleSubDomainSelect}
                disabled={!selectedDomain || subDomains.length === 0}
              >
                <SelectTrigger className="bg-background w-1/2 h-8 text-xs">
                  <SelectValue placeholder="Select Subdomain..." />
                </SelectTrigger>
                <SelectContent>
                  {subDomains.map((subDomain) => (
                    <SelectItem key={subDomain} value={subDomain}>
                      {subDomain}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
      }
      middle={
        <div className="space-y-1 h-full flex flex-col min-h-[160px]">
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
            className="bg-background flex-1 font-mono text-xs resize-y min-h-[160px]"
          />
        </div>
      }
      bottom={
        <ProjectReferencesPanel localDocumentStorage="bmad-method-references" viewMode="User" />
      }
    />
  );
}
