import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Lock, Copy, Save, X } from 'lucide-react';

export interface SaveLockedProfileDialogProps {
  isOpen: boolean;
  profileName?: string;
  onDuplicate: () => void;
  onForceSave: () => void;
  onCancel: () => void;
}

export function SaveLockedProfileDialog({
  isOpen,
  profileName,
  onDuplicate,
  onForceSave,
  onCancel,
}: SaveLockedProfileDialogProps) {
  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onCancel()}>
      <DialogContent className="max-w-md font-mono text-xs">
        <DialogHeader>
          <DialogTitle className="text-amber-500 font-bold text-sm flex items-center gap-2">
            <Lock size={16} /> Profile Locked
          </DialogTitle>
        </DialogHeader>

        <div className="py-2 text-muted-foreground leading-relaxed">
          The profile <strong className="text-foreground">{profileName || 'Selected Profile'}</strong> is currently locked (frozen).
          <br /><br />
          How would you like to proceed with saving your configuration changes?
        </div>

        <DialogFooter className="flex flex-wrap gap-2 justify-end">
          <Button size="sm" variant="outline" onClick={onDuplicate} className="h-7 text-xs font-mono gap-1.5">
            <Copy size={12} /> Duplicate Config
          </Button>
          <Button size="sm" variant="destructive" onClick={onForceSave} className="h-7 text-xs font-mono gap-1.5">
            <Save size={12} /> Force Save
          </Button>
          <Button size="sm" variant="ghost" onClick={onCancel} className="h-7 text-xs font-mono gap-1.5">
            <X size={12} /> Cancel
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
