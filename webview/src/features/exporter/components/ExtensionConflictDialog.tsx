import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { logInfo } from '../utils/log-info';

export interface ExtensionConflictDialogProps {
  isOpen: boolean;
  extensions: string[];
  conflictSource: string;
  targetFieldName: string;
  onMove: () => void;
  onAddAnyway: () => void;
  onCancel: () => void;
}

export function ExtensionConflictDialog({
  isOpen,
  extensions,
  conflictSource,
  targetFieldName,
  onMove,
  onAddAnyway,
  onCancel,
}: ExtensionConflictDialogProps) {
  const formattedExts = extensions.map((e) => (e === 'no_ext' ? 'No Extension' : `.${e}`)).join(', ');

  const handleMove = () => {
    logInfo('[ExtensionConflictDialog] onMove handler triggered', { extensions, conflictSource, targetFieldName });
    onMove();
  };

  const handleAddAnyway = () => {
    logInfo('[ExtensionConflictDialog] onAddAnyway handler triggered', { extensions, conflictSource, targetFieldName });
    onAddAnyway();
  };

  const handleCancel = () => {
    logInfo('[ExtensionConflictDialog] onCancel handler triggered');
    onCancel();
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && handleCancel()}>
      <DialogContent className="max-w-md font-mono text-xs">
        <DialogHeader>
          <DialogTitle className="text-amber-500 font-bold text-sm">
            ⚠️ Extension List Conflict
          </DialogTitle>
        </DialogHeader>

        <div className="py-2 text-muted-foreground leading-relaxed">
          The extension(s) <span className="font-bold text-foreground">{formattedExts}</span> already exist in &quot;
          <span className="font-bold text-foreground">{conflictSource}</span>&quot;.
          <br /><br />
          Do you want to <strong className="text-foreground">Move</strong> them to &quot;{targetFieldName}&quot;,{' '}
          <strong className="text-foreground">Add Anyway</strong> to both lists, or <strong className="text-foreground">Cancel</strong>?
        </div>

        <DialogFooter className="gap-2">
          <Button size="sm" onClick={handleMove} className="h-7 text-xs">
            Move
          </Button>
          <Button variant="outline" size="sm" onClick={handleAddAnyway} className="h-7 text-xs">
            Add Anyway
          </Button>
          <Button variant="ghost" size="sm" onClick={handleCancel} className="h-7 text-xs">
            Cancel
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
