import { useState, useMemo, useCallback } from 'react';
import { CodebaseData, CodebaseFile } from '@/shared/services/graph-rag-explorer';
import {
  useExplorerStore,
  AnonymizationRule,
  DEFAULT_ANONYMIZATION_RULES,
} from '../../store/useExplorerStore';

export type { AnonymizationRule };

export function useTransformerPanel(initialCodebase: CodebaseData) {
  const rules = useExplorerStore((s) => s.transformerRules || DEFAULT_ANONYMIZATION_RULES);
  const setRules = useExplorerStore((s) => s.setTransformerRules);

  const [editingRuleId, setEditingRuleId] = useState<string | null>(null);
  const [newRuleName, setNewRuleName] = useState('');
  const [newRulePattern, setNewRulePattern] = useState('');
  const [newRuleReplacement, setNewRuleReplacement] = useState('');
  const [newRuleInverse, setNewRuleInverse] = useState('');

  const [llmResponseInput, setLlmResponseInput] = useState('');
  const [anonymizedResult, setAnonymizedResult] = useState<string>('');
  const [deanonymizedResult, setDeanonymizedResult] = useState<string>('');
  const [substitutionMap, setSubstitutionMap] = useState<Record<string, string>>({});

  const rawUnifiedContext = useMemo(() => {
    if (!initialCodebase?.files) return '';
    return initialCodebase.files
      .map((file: CodebaseFile) => {
        let block = `/// --- BEGIN FILE: ${file.path} (${file.language}) ---\n`;
        if (file.configProperties && file.configProperties.length > 0) {
          file.configProperties.forEach((p) => {
            block += `${p.key}=${p.value}\n`;
          });
        }
        if (file.attributes && file.attributes.length > 0) {
          file.attributes.forEach((a) => {
            block += `property ${a.visibility} ${a.name};\n`;
          });
        }
        if (file.methods && file.methods.length > 0) {
          file.methods.forEach((m) => {
            block += `function ${m.name} { // ${m.description} }\n`;
          });
        }
        block += `/// --- END FILE: ${file.path} ---\n`;
        return block;
      })
      .join('\n');
  }, [initialCodebase]);

  const toggleRule = useCallback(
    (id: string) => {
      setRules((prev) =>
        prev.map((r) => (r.id === id ? { ...r, enabled: !r.enabled } : r))
      );
    },
    [setRules]
  );

  const handleStartEditRule = useCallback((rule: AnonymizationRule) => {
    setEditingRuleId(rule.id);
    setNewRuleName(rule.name);
    setNewRulePattern(rule.pattern);
    setNewRuleReplacement(rule.replacement);
    setNewRuleInverse(rule.inversePattern);
  }, []);

  const handleCancelEdit = useCallback(() => {
    setEditingRuleId(null);
    setNewRuleName('');
    setNewRulePattern('');
    setNewRuleReplacement('');
    setNewRuleInverse('');
  }, []);

  const handleSaveRule = useCallback(() => {
    if (!newRulePattern || !newRuleReplacement) return;

    if (editingRuleId) {
      setRules((prev) =>
        prev.map((r) =>
          r.id === editingRuleId
            ? {
                ...r,
                name: newRuleName || 'Custom Regex Rule',
                pattern: newRulePattern,
                replacement: newRuleReplacement,
                inversePattern: newRuleInverse || newRuleReplacement,
              }
            : r
        )
      );
      setEditingRuleId(null);
    } else {
      const rule: AnonymizationRule = {
        id: `rule-${Date.now()}`,
        name: newRuleName || 'Custom Regex Rule',
        pattern: newRulePattern,
        replacement: newRuleReplacement,
        inversePattern: newRuleInverse || newRuleReplacement,
        enabled: true,
      };
      setRules((prev) => [...prev, rule]);
    }

    setNewRuleName('');
    setNewRulePattern('');
    setNewRuleReplacement('');
    setNewRuleInverse('');
  }, [editingRuleId, newRuleName, newRulePattern, newRuleReplacement, newRuleInverse, setRules]);

  const handleDeleteRule = useCallback(
    (id: string) => {
      if (editingRuleId === id) {
        handleCancelEdit();
      }
      setRules((prev) => prev.filter((r) => r.id !== id));
    },
    [editingRuleId, handleCancelEdit, setRules]
  );

  const handleAnonymize = useCallback(() => {
    let transformed = rawUnifiedContext;
    const newSubMap: Record<string, string> = {};

    rules
      .filter((r) => r.enabled)
      .forEach((rule) => {
        try {
          const regex = new RegExp(rule.pattern, 'g');
          const matches = rawUnifiedContext.match(regex);
          if (matches) {
            matches.forEach((original) => {
              const replaced = original.replace(regex, rule.replacement);
              newSubMap[replaced] = original;
            });
          }
          transformed = transformed.replace(regex, rule.replacement);
        } catch (err) {
          console.error(`Regex error in rule ${rule.name}:`, err);
        }
      });

    setAnonymizedResult(transformed);
    setSubstitutionMap(newSubMap);
  }, [rawUnifiedContext, rules]);

  const handleDeanonymize = useCallback(() => {
    if (!llmResponseInput) return;
    let restored = llmResponseInput;

    Object.entries(substitutionMap).forEach(([anonymized, original]) => {
      restored = restored.split(anonymized).join(original);
    });

    rules
      .filter((r) => r.enabled && r.inversePattern)
      .forEach((rule) => {
        try {
          const regex = new RegExp(rule.inversePattern, 'g');
          restored = restored.replace(regex, (match) => {
            return substitutionMap[match] || match;
          });
        } catch (err) {
          console.error(`Inverse regex error in rule ${rule.name}:`, err);
        }
      });

    setDeanonymizedResult(restored);
  }, [llmResponseInput, substitutionMap, rules]);

  return {
    rules,
    editingRuleId,
    newRuleName,
    setNewRuleName,
    newRulePattern,
    setNewRulePattern,
    newRuleReplacement,
    setNewRuleReplacement,
    newRuleInverse,
    setNewRuleInverse,
    llmResponseInput,
    setLlmResponseInput,
    anonymizedResult,
    deanonymizedResult,
    substitutionMap,
    toggleRule,
    handleStartEditRule,
    handleCancelEdit,
    handleSaveRule,
    handleDeleteRule,
    handleAnonymize,
    handleDeanonymize,
  };
}
