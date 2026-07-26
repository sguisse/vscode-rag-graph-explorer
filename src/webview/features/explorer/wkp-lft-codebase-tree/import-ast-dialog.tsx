import React, { useState, useRef, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Upload, FileCode, CheckCircle2, AlertCircle, FolderOpen } from "lucide-react";
import { CodebaseData } from "@/services/codebase";

interface ImportAstDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onImport: (data: CodebaseData) => void;
}

export function ImportAstDialog({ open, onOpenChange, onImport }: ImportAstDialogProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [jsonText, setJsonText] = useState("");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const preventGlobalDnD = (e: DragEvent) => {
      e.preventDefault();
      if (e.dataTransfer) {
        e.dataTransfer.dropEffect = "none";
      }
    };

    window.addEventListener("dragenter", preventGlobalDnD, false);
    window.addEventListener("dragover", preventGlobalDnD, false);
    window.addEventListener("drop", preventGlobalDnD, false);

    return () => {
      window.removeEventListener("dragenter", preventGlobalDnD, false);
      window.removeEventListener("dragover", preventGlobalDnD, false);
      window.removeEventListener("drop", preventGlobalDnD, false);
    };
  }, []);

  const parseAndValidate = (text: string): CodebaseData | null => {
    try {
      const parsed = JSON.parse(text);
      if (!parsed || !Array.isArray(parsed.files) || !Array.isArray(parsed.dependencies)) {
        setErrorMsg("Invalid AST JSON schema: payload must contain 'files' and 'dependencies' arrays.");
        return null;
      }
      setErrorMsg(null);
      return parsed;
    } catch (err: any) {
      setErrorMsg(`JSON Parse Error: ${err.message || err}`);
      return null;
    }
  };

  const processFile = (file: File) => {
    if (!file) return;
    setFileName(file.name);
    setErrorMsg(null);

    const reader = new FileReader();
    reader.onload = (e) => {
      const content = e.target?.result as string;
      setJsonText(content);
      parseAndValidate(content);
    };
    reader.onerror = () => {
      setErrorMsg("Failed to read the selected file payload.");
    };
    reader.readAsText(file);
  };

  const handleDragEnter = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.dataTransfer) {
      e.dataTransfer.dropEffect = "copy";
    }
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      processFile(e.dataTransfer.files[0]);
      e.dataTransfer.clearData();
    }
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      processFile(e.target.files[0]);
    }
    if (e.target) e.target.value = '';
  };

  const handleBrowseClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    fileInputRef.current?.click();
  };

  const handleConfirmImport = () => {
    const data = parseAndValidate(jsonText);
    if (data) {
      onImport(data);
      onOpenChange(false);
      setJsonText("");
      setFileName(null);
      setErrorMsg(null);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent id="dialog-import-ast" className="sm:max-w-xl">
        <DialogHeader>
          <DialogTitle id="title-import-ast" className="flex items-center gap-2 text-sm font-bold font-mono">
            <Upload size={16} className="text-primary" /> Import AST Data Schema
          </DialogTitle>
          <DialogDescription id="desc-import-ast" className="text-xs">
            Drop an AST .json extraction file, click to browse local files, or paste JSON below.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <input
            id="input-file-ast-picker"
            type="file"
            accept=".json,application/json"
            ref={fileInputRef}
            className="hidden"
            onChange={handleFileInputChange}
          />

          <div
            id="dropzone-ast-json"
            onDragEnter={handleDragEnter}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={handleBrowseClick}
            className={`flex flex-col items-center justify-center p-6 border-2 border-dashed rounded-lg transition-all select-none text-center cursor-pointer ${
              isDragging
                ? "border-primary bg-primary/10 ring-2 ring-primary/30"
                : "border-border bg-muted/20 hover:border-primary/50"
            }`}
          >
            <Upload size={28} className={isDragging ? "text-primary animate-bounce mb-1" : "text-muted-foreground mb-1"} />
            <div className="pointer-events-none">
              {fileName ? (
                <span className="flex items-center gap-1.5 font-bold text-emerald-500 text-xs font-mono">
                  <CheckCircle2 size={14} /> Selected: {fileName}
                </span>
              ) : (
                <span className="text-xs font-mono font-medium text-foreground">Select local extraction file payload</span>
              )}
              <p className="text-[10px] text-muted-foreground mt-1 font-mono">Drag & Drop .json AST file here</p>
            </div>

            <Button
              id="btn-browse-file"
              type="button"
              variant="default"
              size="sm"
              className="mt-4 text-xs flex items-center gap-1.5 shadow-md"
            >
              <FolderOpen size={14} /> Browse Local Files
            </Button>
          </div>

          <div className="flex justify-between items-center">
            <span className="text-xs font-mono font-semibold text-muted-foreground uppercase flex items-center gap-1">
              <FileCode size={13} /> Direct JSON Input
            </span>
          </div>

          <Textarea
            id="textarea-ast-json-paste"
            placeholder='{\n  "files": [...],\n  "dependencies": [...]\n}'
            className="h-28 font-mono text-xs bg-muted/40 resize-none"
            value={jsonText}
            onChange={(e) => {
              setJsonText(e.target.value);
              if (e.target.value) parseAndValidate(e.target.value);
              else setErrorMsg(null);
            }}
          />

          {errorMsg && (
            <div id="notice-import-ast-error" className="flex items-center gap-2 p-2.5 bg-destructive/15 border border-destructive/30 rounded text-destructive text-xs font-mono">
              <AlertCircle size={15} className="shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}
        </div>

        <DialogFooter className="gap-2">
          <Button
            id="btn-cancel-import-ast"
            variant="outline"
            size="sm"
            onClick={() => onOpenChange(false)}
          >
            Cancel
          </Button>
          <Button
            id="btn-confirm-import-ast"
            size="sm"
            disabled={!jsonText || !!errorMsg}
            onClick={handleConfirmImport}
          >
            Import Codebase
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
