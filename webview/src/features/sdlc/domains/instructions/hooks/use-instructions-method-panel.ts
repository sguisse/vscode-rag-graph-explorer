import { useState, useMemo, useCallback, useEffect } from 'react';
import { SkillsByCategoryConfig, Skill } from '../model/skills';
import { INSTRUCTION_METHODS, InstructionMethodId } from '../types';
import { useSdlcSessionStore } from '@/features/sdlc/core/store/useSdlcSessionStore';
import { useFinderTree, FindableTreeItem } from '@/components/app/core/finder';

export type InstructionsMethodPanelViewMode = 'tree' | 'flat';

export function useInstructionsMethodPanel() {
  const activeSessionId = useSdlcSessionStore((s) => s.activeSessionId);
  const session = useSdlcSessionStore((s) => (activeSessionId ? s.sessions[activeSessionId] : null));
  const updateSession = useSdlcSessionStore((s) => s.updateActiveSession);

  const currentStrategy = session?.instructionsPayload?.strategy as InstructionMethodId;
  const initialMethod: InstructionMethodId = INSTRUCTION_METHODS[currentStrategy] ? currentStrategy : 'bmad';

  const [selectedMethod, setSelectedMethod] = useState<InstructionMethodId>(initialMethod);
  const [viewMode, setViewMode] = useState<InstructionsMethodPanelViewMode>('tree');

  useEffect(() => {
    if (currentStrategy && INSTRUCTION_METHODS[currentStrategy] && currentStrategy !== selectedMethod) {
      setSelectedMethod(currentStrategy);
    }
  }, [currentStrategy]);

  const methodConfig = INSTRUCTION_METHODS[selectedMethod] || INSTRUCTION_METHODS['bmad'];
  const categories: SkillsByCategoryConfig = methodConfig.data;

  const [collapsedMap, setCollapsedMap] = useState<Record<string, boolean>>(() => {
    const initial: Record<string, boolean> = {};
    categories.forEach((cat) => {
      initial[cat.id] = cat.collapsed ?? false;
    });
    return initial;
  });

  useEffect(() => {
    const nextMap: Record<string, boolean> = {};
    categories.forEach((cat) => {
      nextMap[cat.id] = cat.collapsed ?? false;
    });
    setCollapsedMap(nextMap);
  }, [selectedMethod]);

  const handleMethodChange = useCallback(
    (methodId: InstructionMethodId) => {
      setSelectedMethod(methodId);
      updateSession((draft) => {
        if (!draft.instructionsPayload) {
          draft.instructionsPayload = { strategy: methodId, promptText: '' };
        } else {
          draft.instructionsPayload.strategy = methodId;
        }
      });
    },
    [updateSession]
  );

  const toggleViewMode = useCallback(() => {
    setViewMode((prev) => (prev === 'tree' ? 'flat' : 'tree'));
  }, []);

  const toggleCategory = useCallback((catId: string) => {
    setCollapsedMap((prev) => ({
      ...prev,
      [catId]: !prev[catId],
    }));
  }, []);

  const handleExpandAll = useCallback(() => {
    const nextMap: Record<string, boolean> = {};
    categories.forEach((cat) => {
      nextMap[cat.id] = false;
    });
    setCollapsedMap(nextMap);
  }, [categories]);

  const handleCollapseAll = useCallback(() => {
    const nextMap: Record<string, boolean> = {};
    categories.forEach((cat) => {
      nextMap[cat.id] = true;
    });
    setCollapsedMap(nextMap);
  }, [categories]);

  const selectedCommand = (session?.instructionsPayload as any)?.selectedAgent || '';

  const handleSelectSkill = useCallback(
    (skill: Skill) => {
      if (!session) return;
      updateSession((draft) => {
        if (!draft.instructionsPayload) {
          draft.instructionsPayload = { strategy: selectedMethod, promptText: '' };
        }
        draft.instructionsPayload.strategy = selectedMethod;
        (draft.instructionsPayload as any).selectedAgent = skill.command;
        const agentHeader = `[SKILL / AGENT]: ${skill.emoji} ${skill.name} (${skill.command})`;
        if (!draft.instructionsPayload.promptText?.includes(skill.command)) {
          draft.instructionsPayload.promptText = `${agentHeader}\n${draft.instructionsPayload.promptText || ''}`;
        }
      });
    },
    [session, selectedMethod, updateSession]
  );

  const treeData = useMemo<FindableTreeItem[]>(() => {
    return categories.map((cat) => ({
      id: cat.id,
      name: `${cat.title} ${cat.description}`,
      isFolder: true,
      children: cat.skills.map((skill) => ({
        id: skill.command,
        name: `${skill.name} ${skill.command} ${skill.description}`,
        isFolder: false,
        parentId: cat.id,
      })),
    }));
  }, [categories]);

  const expandedKeys = useMemo(() => {
    const map: Record<string, boolean> = {};
    categories.forEach((cat) => {
      map[cat.id] = !collapsedMap[cat.id];
    });
    return map;
  }, [categories, collapsedMap]);

  const handleExpandedKeysChange = useCallback((newExpanded: Record<string, boolean>) => {
    setCollapsedMap((prev) => {
      const next = { ...prev };
      Object.entries(newExpanded).forEach(([catId, isExpanded]) => {
        next[catId] = !isExpanded;
      });
      return next;
    });
  }, []);

  const finder = useFinderTree({
    treeData,
    expandedKeys,
    onExpandedKeysChange: handleExpandedKeysChange,
    getNodeDomId: (id: string) => `instruction-skill-node-${id}`,
  });

  const flatSkills = useMemo(() => {
    const list: Array<{ skill: Skill; categoryTitle: string; categoryEmoji: string }> = [];
    categories.forEach((cat) => {
      cat.skills.forEach((skill) => {
        list.push({
          skill,
          categoryTitle: cat.title,
          categoryEmoji: cat.emoji,
        });
      });
    });
    return list;
  }, [categories]);

  return {
    categories,
    selectedMethod,
    handleMethodChange,
    methodConfig,
    viewMode,
    setViewMode,
    toggleViewMode,
    collapsedMap,
    toggleCategory,
    handleExpandAll,
    handleCollapseAll,
    selectedCommand,
    handleSelectSkill,
    flatSkills,
    finder,
  };
}
