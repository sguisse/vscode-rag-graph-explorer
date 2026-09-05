import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { logInfo } from '@/services/view/log-view.service.wrapper';

export interface GuardrailDialogProps {
  isOpen: boolean;
  message?: string;
  onConfirm: () => void;
  onCancel: () => void;
}

export function GuardrailDialog({ isOpen, message, onConfirm, onCancel }: GuardrailDialogProps) {
  const handleConfirm = () => {
    logInfo('[GuardrailDialog] onConfirm handler triggered');
    onConfirm();
  };

  const handleCancel = () => {
    logInfo('[GuardrailDialog] onCancel handler triggered');
    onCancel();
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && handleCancel()}>
      <DialogContent className="max-w-md font-mono text-xs">
        <DialogHeader>
          <DialogTitle className="text-amber-500 font-bold text-sm">
            ⚠️ Performance & Scope Warning
          </DialogTitle>
        </DialogHeader>

        <div className="py-2 text-muted-foreground leading-relaxed">
          {message || 'Broad search or out-of-workspace paths detected. Scanning may take significant time. Proceed anyway?'}
        </div>

        <DialogFooter className="gap-2">
          <Button size="sm" onClick={handleConfirm} className="h-7 text-xs">
            Proceed Anyway
          </Button>
          <Button variant="outline" size="sm" onClick={handleCancel} className="h-7 text-xs">
            Cancel
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
