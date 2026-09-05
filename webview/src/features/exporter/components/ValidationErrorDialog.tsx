import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { AlertTriangle } from 'lucide-react';

export interface ValidationErrorDialogProps {
  isOpen: boolean;
  errors: string[];
  onClose: () => void;
}

export function ValidationErrorDialog({ isOpen, errors, onClose }: ValidationErrorDialogProps) {
  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-md font-mono text-xs">
        <DialogHeader>
          <DialogTitle className="text-destructive font-bold text-sm flex items-center gap-2">
            <AlertTriangle size={16} /> Configuration Validation Errors
          </DialogTitle>
        </DialogHeader>

        <div className="py-2 space-y-2">
          <p className="text-muted-foreground">
            Please resolve the following configuration error(s) before running the export:
          </p>
          <ul className="list-disc list-inside space-y-1 bg-destructive/10 text-destructive border border-destructive/20 p-2.5 rounded text-[11px]">
            {errors.map((err, idx) => (
              <li key={idx} className="leading-snug">
                {err}
              </li>
            ))}
          </ul>
        </div>

        <DialogFooter>
          <Button size="sm" variant="destructive" onClick={onClose} className="h-7 text-xs font-mono">
            Close & Fix Errors
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
