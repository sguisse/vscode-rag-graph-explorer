import React, { useState, useEffect } from 'react';
import { Command, Keyboard } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';

export function KeyboardShortcutsDialog() {
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === '/') {
        e.preventDefault();
        setIsOpen((prev) => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const shortcuts = [
    { key: 'Delete / Backspace', label: 'Remove selected node or edge' },
    { key: 'Escape', label: 'Cancel active port wire connection' },
    { key: 'Cmd / Ctrl + /', label: 'Toggle Keyboard Shortcuts dialog' },
    { key: 'Drag from Left Palette', label: 'Add new node to canvas position' },
    { key: 'Port Click (Source → Target)', label: 'Connect node output to input' },
  ];

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="right-48 bottom-4 absolute flex items-center gap-1.5 bg-card/80 shadow-md hover:bg-card px-2.5 py-1 border border-border rounded-md font-mono text-[11px] text-muted-foreground hover:text-foreground z-30 cursor-pointer"
      >
        <Keyboard size={13} /> Shortcuts
      </button>

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="sm:max-w-md font-mono">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-sm">
              <Command size={16} className="text-primary" /> Keyboard Shortcuts
            </DialogTitle>
            <DialogDescription className="text-xs">
              Quick actions and canvas controls reference.
            </DialogDescription>
          </DialogHeader>

          <div className="py-2 space-y-2">
            {shortcuts.map((s, idx) => (
              <div key={idx} className="flex justify-between items-center p-2 bg-muted/30 border border-border/50 rounded text-xs">
                <span className="text-foreground">{s.label}</span>
                <kbd className="bg-background px-2 py-0.5 border border-border rounded font-mono font-bold text-[10px] text-primary">
                  {s.key}
                </kbd>
              </div>
            ))}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
