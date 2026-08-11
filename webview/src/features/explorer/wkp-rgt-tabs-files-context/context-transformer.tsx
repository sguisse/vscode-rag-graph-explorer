import React, { useState, useMemo, useCallback } from 'react';
import {
  ShieldCheck,
  Plus,
  Trash2,
  Copy,
  Sparkles,
  Lock,
  Unlock,
  Sliders
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
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
    enabled: true
  },
  {
    id: 'rule-db-uri',
    name: 'Database JDBC/Connection URIs',
    pattern: 'jdbc:[a-z0-9]+://[^:\\s]+:[0-9]+/[a-zA-Z0-9_]+',
    replacement: 'jdbc:provider://anonymized-host:5432/anon_db',
    inversePattern: 'jdbc:provider://anonymized-host:5432/anon_db',
    enabled: true
  },
  {
    id: 'rule-ip',
    name: 'IPv4 Addresses',
    pattern: '\\b(?:\\d{1,3}\\.){3}\\d{1,3}\\b',
    replacement: '127.0.0.1',
    inversePattern: '127.0.0.1',
    enabled: true
  },
  {
    id: 'rule-db-user',
    name: 'Database Usernames',
    pattern: 'db_admin_prod',
    replacement: 'db_user_anon',
    inversePattern: 'db_user_anon',
    enabled: true
  }
];

interface ContextTransformerPanelProps {
  initialCodebase: CodebaseData;
  handleCopy: (text: string, message: string) => void;
}

export function ContextTransformerPanel({
  initialCodebase,
  handleCopy
}: ContextTransformerPanelProps) {
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
      enabled: true
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

  return (
    <div className="space-y-4 animate-in duration-200 fade-in font-mono text-xs">
      {/* Header */}
      <div className="bg-primary/5 p-3.5 border border-primary/20 rounded-lg">
        <div className="flex items-center gap-2">
          <ShieldCheck className="w-5 h-5 text-primary shrink-0" />
          <div>
            <h4 className="font-bold text-foreground text-sm uppercase">Context Anonymizer & Transformer</h4>
            <p className="text-[10px] text-muted-foreground">
              Configure regex replacement rules to anonymize single-file context before sending to LLMs, and maintain inverse rules for output de-anonymization.
            </p>
          </div>
        </div>
      </div>

      {/* Tanstack Table Config Rules */}
      <div className="space-y-2.5 bg-card p-3 border border-border rounded-lg">
        <div className="flex justify-between items-center">
          <span className="flex items-center gap-1.5 font-bold text-foreground text-xs uppercase">
            <Sliders size={13} className="text-primary" /> Anonymization Regex Rules
          </span>
          <span className="bg-primary/10 px-2 py-0.5 rounded text-[10px] text-primary font-bold">
            {rules.filter((r) => r.enabled).length}/{rules.length} Active
          </span>
        </div>

        <div className="border border-border/70 rounded-md overflow-x-auto">
          <table className="w-full text-left font-mono text-[11px]">
            <thead className="bg-muted/60 text-[10px] text-muted-foreground uppercase border-b border-border/70">
              <tr>
                <th className="p-2 w-10 text-center">Active</th>
                <th className="p-2">Rule Name</th>
                <th className="p-2">Match Pattern (Regex)</th>
                <th className="p-2">Replacement</th>
                <th className="p-2">Inverse Pattern</th>
                <th className="p-2 w-10 text-center">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/40">
              {rules.map((rule) => (
                <tr key={rule.id} className="hover:bg-muted/30 transition-colors">
                  <td className="p-2 text-center">
                    <input
                      type="checkbox"
                      checked={rule.enabled}
                      onChange={() => toggleRule(rule.id)}
                      className="rounded text-primary cursor-pointer shrink-0"
                    />
                  </td>
                  <td className="p-2 font-semibold text-foreground truncate max-w-[120px]">{rule.name}</td>
                  <td className="p-2 text-amber-500 font-mono truncate max-w-[150px]">{rule.pattern}</td>
                  <td className="p-2 text-emerald-500 font-mono truncate max-w-[140px]">{rule.replacement}</td>
                  <td className="p-2 text-indigo-400 font-mono truncate max-w-[140px]">{rule.inversePattern}</td>
                  <td className="p-2 text-center">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleDeleteRule(rule.id)}
                      className="w-6 h-6 text-destructive hover:text-destructive/80"
                    >
                      <Trash2 size={12} />
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Add New Rule */}
        <div className="p-2.5 bg-muted/20 border border-border/50 rounded-md space-y-2">
          <span className="block font-bold text-[10px] text-muted-foreground uppercase">Add Custom Regex Rule</span>
          <div className="grid grid-cols-2 gap-2">
            <Input
              placeholder="Rule Name (e.g. Domain Anonymizer)"
              value={newRuleName}
              onChange={(e) => setNewRuleName(e.target.value)}
              className="bg-background h-7 text-xs"
            />
            <Input
              placeholder="Regex Pattern (e.g. \\bcorp\\.com)"
              value={newRulePattern}
              onChange={(e) => setNewRulePattern(e.target.value)}
              className="bg-background h-7 text-xs font-mono"
            />
            <Input
              placeholder="Replacement (e.g. anon.org)"
              value={newRuleReplacement}
              onChange={(e) => setNewRuleReplacement(e.target.value)}
              className="bg-background h-7 text-xs font-mono"
            />
            <Input
              placeholder="Inverse Pattern (for de-anonymization)"
              value={newRuleInverse}
              onChange={(e) => setNewRuleInverse(e.target.value)}
              className="bg-background h-7 text-xs font-mono"
            />
          </div>
          <div className="flex justify-end pt-1">
            <Button
              size="sm"
              onClick={handleAddRule}
              disabled={!newRulePattern || !newRuleReplacement}
              className="flex items-center gap-1 h-7 text-xs"
            >
              <Plus size={12} /> Add Rule
            </Button>
          </div>
        </div>
      </div>

      {/* Step 1: Anonymize */}
      <div className="space-y-3 bg-card p-3 border border-border rounded-lg">
        <div className="flex justify-between items-center">
          <span className="flex items-center gap-1.5 font-bold text-foreground text-xs uppercase">
            <Lock size={13} className="text-orange-500" /> 1. Anonymize Unified Context
          </span>
          <Button
            size="sm"
            onClick={handleAnonymize}
            className="flex items-center gap-1.5 bg-orange-600 hover:bg-orange-700 text-white h-7 text-xs"
          >
            <Sparkles size={12} /> Transform & Anonymize
          </Button>
        </div>

        {anonymizedResult && (
          <div className="space-y-2 pt-1 animate-in duration-150 fade-in">
            <div className="flex justify-between items-center">
              <span className="text-[10px] text-emerald-500 font-bold uppercase">
                ✅ Anonymized Context ({Object.keys(substitutionMap).length} Substitutions Mapped)
              </span>
              <Button
                size="sm"
                variant="outline"
                onClick={() => handleCopy(anonymizedResult, "Anonymized context copied to clipboard!")}
                className="h-6 text-[10px] gap-1"
              >
                <Copy size={10} /> Copy Anonymized Context
              </Button>
            </div>
            <Textarea
              readOnly
              value={anonymizedResult}
              className="bg-slate-950 font-mono text-[10px] text-slate-200 h-36 resize-none border-slate-800"
            />
          </div>
        )}
      </div>

      {/* Step 2: De-anonymize */}
      <div className="space-y-3 bg-card p-3 border border-border rounded-lg">
        <div className="flex justify-between items-center">
          <span className="flex items-center gap-1.5 font-bold text-foreground text-xs uppercase">
            <Unlock size={13} className="text-indigo-400" /> 2. De-anonymize LLM Response
          </span>
          <Button
            size="sm"
            onClick={handleDeanonymize}
            disabled={!llmResponseInput}
            className="flex items-center gap-1.5 bg-indigo-600 hover:bg-indigo-700 text-white h-7 text-xs"
          >
            Restore Original Terms
          </Button>
        </div>

        <Textarea
          placeholder="Paste raw LLM response here to reverse substitution rules..."
          value={llmResponseInput}
          onChange={(e) => setLlmResponseInput(e.target.value)}
          className="bg-muted/30 font-mono text-[10px] h-20 resize-none"
        />

        {deanonymizedResult && (
          <div className="space-y-2 pt-1 animate-in duration-150 fade-in">
            <div className="flex justify-between items-center">
              <span className="text-[10px] text-indigo-400 font-bold uppercase">
                🔓 De-anonymized Output
              </span>
              <Button
                size="sm"
                variant="outline"
                onClick={() => handleCopy(deanonymizedResult, "De-anonymized output copied to clipboard!")}
                className="h-6 text-[10px] gap-1"
              >
                <Copy size={10} /> Copy Restored Output
              </Button>
            </div>
            <Textarea
              readOnly
              value={deanonymizedResult}
              className="bg-slate-950 font-mono text-[10px] text-slate-200 h-32 resize-none border-slate-800"
            />
          </div>
        )}
      </div>
    </div>
  );
}
