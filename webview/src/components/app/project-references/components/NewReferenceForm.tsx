import React, { useState, useEffect } from 'react';
import { Plus, RefreshCw, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { CollapsibleCard } from '@/components/app/collapsible-card';
import { ReferenceItem } from '../model/prj-model-ui';

interface NewReferenceFormProps {
  categories: string[];
  importing: boolean;
  onAddReference: (newRef: Omit<ReferenceItem, 'id'>) => Promise<ReferenceItem>;
  onImportUrl: (url: string) => Promise<{ content: string; sizeKb: number } | null>;
}

export function NewReferenceForm({
  categories,
  importing,
  onAddReference,
  onImportUrl,
}: NewReferenceFormProps) {
  const [newCategory, setNewCategory] = useState<string>('');
  const [customCategoryInput, setCustomCategoryInput] = useState<string>('');
  const [isAddingNewCategory, setIsAddingNewCategory] = useState<boolean>(false);
  const [newName, setNewName] = useState<string>('');
  const [newDescription, setNewDescription] = useState<string>('');
  const [newEmoji, setNewEmoji] = useState<string>('📄');
  const [newPreSelected, setNewPreSelected] = useState<boolean>(true);
  const [newUrl, setNewUrl] = useState<string>('');
  const [importedContent, setImportedContent] = useState<string>('');
  const [importedSizeKb, setImportedSizeKb] = useState<number>(0);

  useEffect(() => {
    if (categories.length > 0 && !newCategory && !isAddingNewCategory) {
      setNewCategory(categories[0]);
    }
  }, [categories, newCategory, isAddingNewCategory]);

  const handleImportUrl = async () => {
    if (!newUrl) return;
    const result = await onImportUrl(newUrl);
    if (result) {
      setImportedContent(result.content);
      setImportedSizeKb(result.sizeKb);

      if (!newName) {
        const parts = newUrl.split('/');
        const filename = parts[parts.length - 1] || 'Imported Document';
        setNewName(filename.replace(/[-_]/g, ' '));
      }
      if (!newDescription) {
        setNewDescription(`Imported from ${newUrl}`);
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const finalCategory = isAddingNewCategory ? customCategoryInput.trim() : newCategory;
    if (!finalCategory || !newName.trim()) return;

    await onAddReference({
      category: finalCategory,
      name: newName.trim(),
      description: newDescription.trim() || 'No description provided',
      emoji: newEmoji || '📄',
      preSelected: newPreSelected,
      url: newUrl.trim(),
      sizeKb: importedSizeKb || 1.2,
      content: importedContent || `Reference document for ${newName}`,
    });

    setNewName('');
    setNewDescription('');
    setNewUrl('');
    setImportedContent('');
    setImportedSizeKb(0);
    setIsAddingNewCategory(false);
    setCustomCategoryInput('');
  };

  return (
    <CollapsibleCard
      title={
        <div className="flex items-center gap-1.5">
          <Plus size={13} className="text-indigo-400" />
          <span className="font-bold text-xs">New Reference</span>
        </div>
      }
      badge="Add & Import (Admin)"
      defaultExpanded={false}
      contentToCopy=""
      className="bg-card border-border"
    >
      <form onSubmit={handleSubmit} className="p-2 space-y-2 font-mono text-xs">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
          <div className="space-y-1">
            <label className="block text-[10px] font-bold text-muted-foreground uppercase">Category</label>
            {isAddingNewCategory ? (
              <div className="flex items-center gap-1">
                <Input
                  type="text"
                  placeholder="New category..."
                  value={customCategoryInput}
                  onChange={(e) => setCustomCategoryInput(e.target.value)}
                  className="h-7 text-xs font-mono"
                  autoFocus
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={() => setIsAddingNewCategory(false)}
                  className="h-7 w-7 text-muted-foreground"
                >
                  <X size={12} />
                </Button>
              </div>
            ) : (
              <Select
                value={newCategory}
                onValueChange={(val: string | null) => {
                  if (!val) return;
                  if (val === '__new__') {
                    setIsAddingNewCategory(true);
                  } else {
                    setNewCategory(val);
                  }
                }}
              >
                <SelectTrigger className="h-7 text-xs font-mono bg-background">
                  <SelectValue placeholder="Select Category..." />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((cat) => (
                    <SelectItem key={cat} value={cat}>
                      {cat}
                    </SelectItem>
                  ))}
                  <SelectItem value="__new__" className="font-bold text-indigo-400">
                    ➕ Create New Category...
                  </SelectItem>
                </SelectContent>
              </Select>
            )}
          </div>

          <div className="space-y-1 col-span-2">
            <label className="block text-[10px] font-bold text-muted-foreground uppercase">Name & Emoji</label>
            <div className="flex items-center gap-1.5">
              <Input
                type="text"
                placeholder="Emoji"
                value={newEmoji}
                onChange={(e) => setNewEmoji(e.target.value)}
                className="w-12 h-7 text-xs font-mono text-center"
              />
              <Input
                type="text"
                placeholder="Reference Name (e.g. System Architecture Spec)"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                className="flex-1 h-7 text-xs font-mono"
                required
              />
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
          <div className="space-y-1 col-span-2">
            <label className="block text-[10px] font-bold text-muted-foreground uppercase">Description</label>
            <Input
              type="text"
              placeholder="Brief summary of reference purpose..."
              value={newDescription}
              onChange={(e) => setNewDescription(e.target.value)}
              className="h-7 text-xs font-mono"
            />
          </div>

          <div className="space-y-1 flex flex-col justify-end">
            <label className="flex items-center gap-2 cursor-pointer text-xs select-none h-7 px-1">
              <input
                type="checkbox"
                checked={newPreSelected}
                onChange={(e) => setNewPreSelected(e.target.checked)}
                className="rounded border-border text-indigo-500 focus:ring-indigo-500 h-3.5 w-3.5 accent-indigo-500 cursor-pointer"
              />
              <span className="font-bold text-[10px] uppercase text-foreground">Always Pre-selected</span>
            </label>
          </div>
        </div>

        <div className="space-y-1">
          <label className="block text-[10px] font-bold text-muted-foreground uppercase">
            URL or Local Dependencies File
          </label>
          <div className="flex items-center gap-2">
            <Input
              type="text"
              placeholder="https://... or file:///path/to/reference.yaml"
              value={newUrl}
              onChange={(e) => setNewUrl(e.target.value)}
              className="flex-1 h-7 text-xs font-mono"
            />
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleImportUrl}
              disabled={!newUrl || importing}
              className="h-7 text-xs font-mono gap-1 shrink-0"
            >
              <RefreshCw size={12} className={importing ? 'animate-spin' : ''} />
              <span>Import</span>
            </Button>
            <Button
              type="submit"
              size="sm"
              disabled={!newName || (!newCategory && !customCategoryInput)}
              className="h-7 text-xs font-mono gap-1 bg-indigo-600 hover:bg-indigo-700 text-white shrink-0"
            >
              <Plus size={12} />
              <span>Add Reference</span>
            </Button>
          </div>
        </div>
      </form>
    </CollapsibleCard>
  );
}
