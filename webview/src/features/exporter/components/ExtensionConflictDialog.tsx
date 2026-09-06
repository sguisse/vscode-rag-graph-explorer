import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { AlertTriangle, ArrowRightLeft, Plus, X } from 'lucide-react';

export interface ExtensionConflictState {
  extension: string;
  targetMode: 'inc' | 'exc';
}

interface ExtensionConflictDialogProps {
  isOpen: boolean;
  conflictState: ExtensionConflictState | null;
  onResolveMove: () => void;
  onForceAppend: () => void;
  onCancel: () => void;
}

export const ExtensionConflictDialog: React.FC<ExtensionConflictDialogProps> = ({
  isOpen,
  conflictState,
  onResolveMove,
  onForceAppend,
  onCancel,
}) => {
  if (!conflictState) return null;

  const { extension, targetMode } = conflictState;
  const isTargetInc = targetMode === 'inc';
  const targetLabel = isTargetInc ? 'Inclusion (inc_ext)' : 'Exclusion (exc_ext)';
  const opposingLabel = isTargetInc ? 'Exclusion (exc_ext)' : 'Inclusion (inc_ext)';

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onCancel()}>
      <DialogContent className="sm:max-w-[480px] font-mono text-xs select-none">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-amber-500 font-bold text-sm">
            <AlertTriangle size={16} className="shrink-0" />
            <span>Extension Rule Conflict Detected</span>
          </DialogTitle>
          <DialogDescription className="text-muted-foreground text-xs pt-1 leading-relaxed">
            Extension <strong class="text-primary">.{extension}</strong> is already present in the{' '}
            <strong class="text-foreground">{opposingLabel}</strong> list. Adding it to the{' '}
            <strong class="text-foreground">{targetLabel}</strong> list will cause an incoherent filter conflict.
          </DialogDescription>
        </DialogHeader>

        <div className="p-3 bg-muted/40 border border-border rounded-md space-y-1.5 my-2">
          <div className="font-semibold text-foreground text-[11px]">Conflict Details:</div>
          <div className="text-muted-foreground text-[11px]">
            • Current Location: <span class="text-amber-600 dark:text-amber-400 font-bold">{opposingLabel}</span><br />
            • Target Action: <span class="text-emerald-500 font-bold">Add to {targetLabel}</span>
          </div>
        </div>

        <DialogFooter className="flex flex-col sm:flex-row gap-2 sm:justify-end pt-2">
          <Button
            size="sm"
            variant="ghost"
            onClick={onCancel}
            className="h-8 text-xs font-semibold gap-1 cursor-pointer"
          >
            <X size={13} />
            <span>Cancel</span>
          </Button>

          <Button
            size="sm"
            variant="outline"
            onClick={onForceAppend}
            className="h-8 text-xs font-semibold gap-1 cursor-pointer"
          >
            <Plus size={13} />
            <span>Keep Both</span>
          </Button>

          <Button
            size="sm"
            onClick={onResolveMove}
            className="h-8 text-xs font-semibold gap-1 bg-primary text-primary-foreground hover:bg-primary/90 cursor-pointer"
          >
            <ArrowRightLeft size={13} />
            <span>Move to {isTargetInc ? 'Include' : 'Exclude'}</span>
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default ExtensionConflictDialog;
