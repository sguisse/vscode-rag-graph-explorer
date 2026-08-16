import { useState, useMemo, useCallback } from 'react';
import { CodebaseData, CodebaseFile } from '@/shared/services/graph-rag-explorer';

export interface AnonymizationRule {
  id: string;
  name: string;
  pattern: string;
  replacement: string;
  inversePattern: string;
  enabled: boolean;
}

const DEFAULT_ANONYMIZATION_RULES: AnonymizationRule[] = [
  {
    id: 'rule-secrets',
    name: 'Secret & Password Tokens',
    pattern: '(?i)(password|secret|key|token)\\s*[:=]\\s*[\'"][^\'"]+[\'"]',
    replacement: '$1: "ANONYMIZED_SECRET"',
    inversePattern: 'ANONYMIZED_SECRET',
    enabled: true,
  },
  {
    id: 'rule-db-uri',
    name: 'Database JDBC/Connection URIs',
    pattern: 'jdbc:[a-z0-9]+://[^:\\s]+:[0-9]+/[a-zA-Z0-9_]+',
    replacement: 'jdbc:provider://anonymized-host:5432/anon_db',
    inversePattern: 'jdbc:provider://anonymized-host:5432/anon_db',
    enabled: true,
  },
  {
    id: 'rule-ip',
    name: 'IPv4 Addresses',
    pattern: '\\b(?:\\d{1,3}\\.){3}\\d{1,3}\\b',
    replacement: '127.0.0.1',
    inversePattern: '127.0.0.1',
    enabled: true,
  },
  {
    id: 'rule-db-user',
    name: 'Database Usernames',
    pattern: 'db_admin_prod',
    replacement: 'db_user_anon',
    inversePattern: 'db_user_anon',
    enabled: true,
  },
];

export function useContextTransformer(initialCodebase: CodebaseData) {
  const [rules, setRules] = useState<AnonymizationRule[]>(DEFAULT_ANONYMIZATION_RULES);
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

  const toggleRule = useCallback((id: string) => {
    setRules((prev) =>
      prev.map((r) => (r.id === id ? { ...r, enabled: !r.enabled } : r))
    );
  }, []);

  const handleAddRule = useCallback(() => {
    if (!newRulePattern || !newRuleReplacement) return;
    const rule: AnonymizationRule = {
      id: `rule-${Date.now()}`,
      name: newRuleName || 'Custom Regex Rule',
      pattern: newRulePattern,
      replacement: newRuleReplacement,
      inversePattern: newRuleInverse || newRuleReplacement,
      enabled: true,
    };
    setRules((prev) => [...prev, rule]);
    setNewRuleName('');
    setNewRulePattern('');
    setNewRuleReplacement('');
    setNewRuleInverse('');
  }, [newRuleName, newRulePattern, newRuleReplacement, newRuleInverse]);

  const handleDeleteRule = useCallback((id: string) => {
    setRules((prev) => prev.filter((r) => r.id !== id));
  }, []);

  const handleAnonymize = useCallback(() => {
    let transformed = rawUnifiedContext;
    const newSubMap: Record<string, string> = {};

    rules.filter((r) => r.enabled).forEach((rule) => {
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

    rules.filter((r) => r.enabled && r.inversePattern).forEach((rule) => {
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
    handleAddRule,
    handleDeleteRule,
    handleAnonymize,
    handleDeanonymize,
  };
}
