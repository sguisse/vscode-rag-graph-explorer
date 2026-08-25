import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Key, Check } from 'lucide-react';
import { useWorkflowStore } from '../../hooks/use-workflow-store';

interface ApiKeyDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ApiKeyDialog({ open, onOpenChange }: ApiKeyDialogProps) {
  const { apiKey, setApiKey, addLog } = useWorkflowStore();
  const [val, setVal] = useState(apiKey);

  const handleSave = () => {
    setApiKey(val);
    addLog(val ? '🔑 Custom OpenAI / Anthropic API Key configured.' : '🔑 Cleared API Key (Mock Mode active).');
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md font-mono">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-sm">
            <Key size={16} className="text-primary" /> LLM API Key Configuration
          </DialogTitle>
          <DialogDescription className="text-xs">
            Enter your OpenAI or Anthropic API key to run live agent queries, or leave blank to use mock offline mode.
          </DialogDescription>
        </DialogHeader>

        <div className="py-2 space-y-2">
          <input
            type="password"
            placeholder="sk-..."
            value={val}
            onChange={(e) => setVal(e.target.value)}
            className="w-full px-3 py-1.5 bg-background border border-border rounded text-xs font-mono focus:outline-none focus:ring-1 focus:ring-primary"
          />
        </div>

        <DialogFooter className="gap-2">
          <Button variant="outline" size="sm" onClick={() => onOpenChange(false)} className="text-xs">
            Cancel
          </Button>
          <Button size="sm" onClick={handleSave} className="gap-1.5 text-xs">
            <Check size={14} /> Save Key
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
