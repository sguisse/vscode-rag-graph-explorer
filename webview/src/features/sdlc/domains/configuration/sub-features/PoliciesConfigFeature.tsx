import React, { useState } from 'react';
import { ShieldCheck, Pencil, Trash2, X, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useGlobalConfigStore, AnonymizationRule } from '../../../core/store/useGlobalConfigStore';

export function PoliciesConfigFeature() {
  const { anonymizationRules, updateAnonymizationRules } = useGlobalConfigStore();
  const [editingRuleId, setEditingRuleId] = useState<string | null>(null);
  const [newRule, setNewRule] = useState<Partial<AnonymizationRule>>({});

  const toggleRule = (id: string) => {
    updateAnonymizationRules(anonymizationRules.map(r => r.id === id ? { ...r, enabled: !r.enabled } : r));
  };

  const handleSave = () => {
    if (!newRule.pattern || !newRule.replacement) return;
    if (editingRuleId) {
      updateAnonymizationRules(anonymizationRules.map(r => r.id === editingRuleId ? { ...r, ...newRule } as AnonymizationRule : r));
      setEditingRuleId(null);
    } else {
      updateAnonymizationRules([...anonymizationRules, { id: `rule-${Date.now()}`, enabled: true, ...newRule } as AnonymizationRule]);
    }
    setNewRule({});
  };

  const handleDelete = (id: string) => {
    updateAnonymizationRules(anonymizationRules.filter(r => r.id !== id));
  };

  return (
    <div className="space-y-4 p-4 font-mono text-xs animate-in fade-in h-full overflow-y-auto">
      <div className="space-y-1 bg-amber-500/10 p-3 border border-amber-500/20 rounded-lg">
        <div className="flex items-center gap-2">
          <ShieldCheck size={16} className="text-amber-500" />
          <h4 className="font-bold text-foreground text-xs uppercase">Security Policies & Anonymization</h4>
        </div>
        <p className="text-[10px] text-muted-foreground">Configure global regex replacement rules to anonymize single-file context before sending to LLMs.</p>
      </div>

      <div className="bg-card p-3 border border-border rounded-lg space-y-3">
        <div className="border border-border/70 rounded-md overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-muted/60 border-b border-border/70 text-[10px] uppercase">
              <tr>
                <th className="p-2 w-10 text-center">Active</th>
                <th className="p-2">Name</th>
                <th className="p-2">Pattern</th>
                <th className="p-2">Replacement</th>
                <th className="p-2 w-16 text-center">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/40">
              {anonymizationRules.map(rule => (
                <tr key={rule.id} className="hover:bg-muted/30">
                  <td className="p-2 text-center"><input type="checkbox" checked={rule.enabled} onChange={() => toggleRule(rule.id)} className="cursor-pointer" /></td>
                  <td className="p-2">{rule.name}</td>
                  <td className="p-2 text-amber-500">{rule.pattern}</td>
                  <td className="p-2 text-emerald-500">{rule.replacement}</td>
                  <td className="p-2 text-center">
                    <Button variant="ghost" size="icon" className="w-6 h-6" onClick={() => { setEditingRuleId(rule.id); setNewRule(rule); }}><Pencil size={12}/></Button>
                    <Button variant="ghost" size="icon" className="w-6 h-6 text-destructive" onClick={() => handleDelete(rule.id)}><Trash2 size={12}/></Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="bg-muted/20 p-3 border border-border/50 rounded-md space-y-2">
          <span className="font-bold uppercase text-[10px] text-muted-foreground">{editingRuleId ? 'Edit Rule' : 'Add Rule'}</span>
          <div className="grid grid-cols-2 gap-2">
            <Input placeholder="Name" value={newRule.name || ''} onChange={e => setNewRule({ ...newRule, name: e.target.value })} className="h-7" />
            <Input placeholder="Pattern" value={newRule.pattern || ''} onChange={e => setNewRule({ ...newRule, pattern: e.target.value })} className="h-7" />
            <Input placeholder="Replacement" value={newRule.replacement || ''} onChange={e => setNewRule({ ...newRule, replacement: e.target.value })} className="h-7" />
            <Input placeholder="Inverse Pattern" value={newRule.inversePattern || ''} onChange={e => setNewRule({ ...newRule, inversePattern: e.target.value })} className="h-7" />
          </div>
          <div className="flex justify-end gap-2">
            {editingRuleId && <Button size="sm" variant="outline" onClick={() => { setEditingRuleId(null); setNewRule({}); }} className="h-7"><X size={12} className="mr-1"/> Cancel</Button>}
            <Button size="sm" onClick={handleSave} className="h-7"><Check size={12} className="mr-1"/> Save</Button>
          </div>
        </div>
      </div>
    </div>
  );
}
