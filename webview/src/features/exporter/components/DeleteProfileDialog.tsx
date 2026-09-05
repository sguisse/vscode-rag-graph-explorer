import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Trash2 } from 'lucide-react';

export interface DeleteProfileDialogProps {
  isOpen: boolean;
  profileName?: string;
  onConfirm: () => void;
  onCancel: () => void;
}

export function DeleteProfileDialog({ isOpen, profileName, onConfirm, onCancel }: DeleteProfileDialogProps) {
  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onCancel()}>
      <DialogContent className="max-w-md font-mono text-xs">
        <DialogHeader>
          <DialogTitle className="text-destructive font-bold text-sm flex items-center gap-2">
            <Trash2 size={16} /> Confirm Profile Deletion
          </DialogTitle>
        </DialogHeader>

        <div className="py-2 text-muted-foreground leading-relaxed">
          Are you sure you want to delete the configuration profile <strong className="text-foreground">{profileName || 'selected'}</strong>?
          <br /><br />
          This action cannot be undone. The default configuration will be re-selected automatically.
        </div>

        <DialogFooter className="gap-2">
          <Button size="sm" variant="destructive" onClick={onConfirm} className="h-7 text-xs font-mono">
            Delete Profile
          </Button>
          <Button variant="outline" size="sm" onClick={onCancel} className="h-7 text-xs font-mono">
            Cancel
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
