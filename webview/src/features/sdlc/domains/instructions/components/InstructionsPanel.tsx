import React, { useMemo, useState, useEffect, useCallback } from 'react';
import { Bot, FileText } from 'lucide-react';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select';
import { useSdlcSessionStore } from '@/features/sdlc/core/store/useSdlcSessionStore';
import { SkillsByCategoryConfig, Skill } from '../model/skills';
import { INSTRUCTION_METHODS, InstructionMethodId } from '../types';
import { TopMiddleBottomPanel } from '@/components/app/top-middle-bottom-panel';
import { ProjectReferencesPanel } from '@/components/app/project-references';
import { CollapsibleCard } from '@/components/app/collapsible-card';
import { referenceApiService } from '@/services/api/reference-api.service.gen';
import { REFERENCES_PROJECT_KEY } from '@/shared/services/reference/model/reference-model';

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

export function InstructionsPanel() {
  const activeSessionId = useSdlcSessionStore((s) => s.activeSessionId);
  const session = useSdlcSessionStore((s) => (activeSessionId ? s.sessions[activeSessionId] : null));
  const updateSession = useSdlcSessionStore((s) => s.updateActiveSession);

  const strategy = (session?.instructionsPayload?.strategy as InstructionMethodId) || 'bmad';
  const methodConfig = INSTRUCTION_METHODS[strategy] || INSTRUCTION_METHODS['bmad'];
  const categories: SkillsByCategoryConfig = methodConfig.data;

  const [autoCopySample, setAutoCopySample] = useState<boolean>(true);
  const [selectedDomain, setSelectedDomain] = useState<string>('');
  const [selectedSubDomain, setSelectedSubDomain] = useState<string>('');

  const selectedCommand = (session?.instructionsPayload as any)?.selectedAgent || '';

  // Auto-sync project references into instructionsPayload.selectedReferences
  useEffect(() => {
    let isMounted = true;
    const syncReferences = async () => {
      try {
        if (referenceApiService?.loadAllReferences) {
          const refs = await referenceApiService.loadAllReferences(REFERENCES_PROJECT_KEY);
          if (isMounted && refs) {
            const preSelectedRefs = refs.filter((r) => Boolean(r.preSelected));
            console.log('[InstructionsPanel] 🔄 Syncing preSelected references to session store:', preSelectedRefs.map((r) => r.name));
            updateSession((draft) => {
              if (!draft.instructionsPayload) {
                draft.instructionsPayload = { strategy, promptText: '' };
              }
              draft.instructionsPayload.selectedReferences = preSelectedRefs;
            });
          }
        }
      } catch (err) {
        console.error('[InstructionsPanel] Error syncing references:', err);
      }
    };
    syncReferences();

    return () => {
      isMounted = false;
    };
  }, [updateSession, strategy]);

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

    const sourceSkills =
      selectedSkill?.prompts && selectedSkill.prompts.length > 0
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
      console.log('[InstructionsPanel] 📝 Applying prompt text to instructionsPayload:', promptText.substring(0, 40));
      updateSession((draft) => {
        if (!draft.instructionsPayload) {
          draft.instructionsPayload = { strategy, promptText: '' };
        }
        draft.instructionsPayload.promptText = promptText;
        if (draft.llmChat) {
          draft.llmChat.customPrompt = undefined;
        }
      });
    },
    [strategy, updateSession]
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

  const promptText = session.instructionsPayload?.promptText || '';
  const promptCharCount = promptText.length;

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
      id="instructions-panel"
      className="gap-3 p-2 h-full"
      top={
        <div className="space-y-2">
          <div className={`${methodConfig.bgBannerColor} p-3 border rounded-lg`}>
            <h4 className="font-bold text-foreground text-sm uppercase">
              {methodConfig.emoji} {methodConfig.title}
            </h4>
            <p className="mt-1 text-[10px] text-muted-foreground">{methodConfig.description}</p>
          </div>

          <div className="space-y-2 bg-card p-2.5 border border-border rounded-lg">
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-3">
                <span className="font-bold text-[10px] text-foreground uppercase">
                  <Bot size={12} className={`inline mr-1 ${methodConfig.color}`} /> Domain & Subdomain Prompt Selection
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2 pt-1">
              <label className="flex items-center gap-1.5 font-medium text-[10px] text-muted-foreground hover:text-foreground cursor-pointer select-none shrink-0">
                <input
                  type="checkbox"
                  checked={autoCopySample}
                  onChange={(e) => handleCheckboxChange(e.target.checked)}
                  className={`bg-background border-border rounded w-3.5 h-3.5 cursor-pointer ${methodConfig.accentColor}`}
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
        <CollapsibleCard
          title={
            <div className="flex items-center gap-1.5">
              <FileText size={13} className={methodConfig.color} />
              <span className="font-bold text-xs uppercase">Structured Prompt</span>
            </div>
          }
          badge={`${promptCharCount} Chars`}
          defaultExpanded={true}
          contentToCopy={promptText}
          className="flex flex-col bg-card border-border h-full min-h-0"
        >
          <div className="flex flex-col p-2 space-y-1 h-full min-h-[160px]">
            <Textarea
              value={promptText}
              onChange={(e) => {
                const newVal = e.target.value;
                console.log('[InstructionsPanel] ✏️ User edited prompt:', newVal.substring(0, 40));
                updateSession((draft) => {
                  if (!draft.instructionsPayload) draft.instructionsPayload = { strategy, promptText: '' };
                  draft.instructionsPayload.promptText = newVal;
                  if (draft.llmChat) {
                    draft.llmChat.customPrompt = undefined;
                  }
                });
              }}
              placeholder="[CONTEXT]\n...\n[EXPECTED]\n...\n[OUTPUT FORMAT]\n..."
              className="flex-1 bg-background min-h-[160px] font-mono text-xs resize-y"
            />
          </div>
        </CollapsibleCard>
      }
      bottom={
        <ProjectReferencesPanel
          localDocumentStorage="global-project-references"
          viewMode="User"
          collapsibleParentIncluded={true}
        />
      }
    />
  );
}
