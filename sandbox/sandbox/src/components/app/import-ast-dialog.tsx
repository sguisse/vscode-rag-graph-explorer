import React, { useState, useRef, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Upload, FileCode, CheckCircle2, AlertCircle, Play, FolderOpen } from "lucide-react";
import { CodebaseData } from "@/services/codebase";

const SAMPLE_AST_DATA: CodebaseData = {
  files: [
    {
      id: "AuthService.ts",
      name: "AuthService.ts",
      type: "module",
      path: "frontend/services/AuthService.ts",
      language: "TypeScript",
      size: 110,
      complexity: 3,
      attributes: [{ name: "jwtToken: string", visibility: "private" }],
      methods: [
        { id: "login", name: "login(credentials)", description: "Authenticates user against backend identity provider." },
        { id: "logout", name: "logout()", description: "Clears local session token and invalidates active session." }
      ]
    },
    {
      id: "AuthController.java",
      name: "AuthController.java",
      type: "class",
      path: "backend/controllers/AuthController.java",
      language: "Java",
      size: 185,
      complexity: 4,
      attributes: [{ name: "userRepository: UserRepository", visibility: "private" }],
      methods: [
        { id: "authenticateUser", name: "authenticateUser(loginDto)", description: "Validates user credentials against database records." }
      ]
    },
    {
      id: "UserRepository.java",
      name: "UserRepository.java",
      type: "interface",
      path: "backend/repositories/UserRepository.java",
      language: "Java",
      size: 45,
      complexity: 1,
      attributes: [],
      methods: [
        { id: "findByEmail", name: "findByEmail(email)", description: "Retrieves active user record matching target email." }
      ]
    },
    {
      id: "security.yml",
      name: "security.yml",
      type: "config",
      path: "config/security.yml",
      language: "YAML",
      size: 30,
      complexity: 1,
      configProperties: [
        { key: "jwt.secret", value: "${JWT_SECRET:super_secret_key}" },
        { key: "jwt.expiration", value: "86400000" }
      ]
    }
  ],
  dependencies: [
    { id: "dep-auth-service-controller", sourceNode: "AuthService.ts", sourceHandle: "login", targetNode: "AuthController.java", targetHandle: "authenticateUser", relation: "association", label: "POST /api/auth/login" },
    { id: "dep-auth-controller-repo", sourceNode: "AuthController.java", sourceHandle: "authenticateUser", targetNode: "UserRepository.java", targetHandle: "findByEmail", relation: "dependency", label: "Queries User Record" },
    { id: "dep-auth-controller-config", sourceNode: "AuthController.java", sourceHandle: "header", targetNode: "security.yml", targetHandle: "jwt.secret", relation: "dependency", label: "Injects Secret Key" }
  ]
};

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

  // Global event listener to prevent browser default drag & drop behaviors
  // (which opens files in a new tab) outside of our specific dropzone.
  useEffect(() => {
    const preventGlobalDnD = (e: DragEvent) => {
      e.preventDefault();
      // Ensure dropEffect is explicitly marked as "none" for global zones
      if (e.dataTransfer) {
        e.dataTransfer.dropEffect = "none";
      }
    };

    // Attach safely to document without capturing to let React process child events first
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
    // Explicitly define this is a valid drop target (fixes macOS/Chrome new-tab bug)
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
    if (e.target) e.target.value = ''; // Reset input to allow identical file select
  };

  const handleBrowseClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    fileInputRef.current?.click();
  };

  const handleLoadSample = () => {
    const formatted = JSON.stringify(SAMPLE_AST_DATA, null, 2);
    setJsonText(formatted);
    setFileName("sample-ast-data.json");
    setErrorMsg(null);
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
          {/* Hidden File Input */}
          <input
            id="input-file-ast-picker"
            type="file"
            accept=".json,application/json"
            ref={fileInputRef}
            className="hidden"
            onChange={handleFileInputChange}
          />

          {/* Interactive Drag & Drop Box */}
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
                  <CheckCircle2 size={14} /> ed: {fileName}
                </span>
              ) : (
                <span className="text-xs font-mono font-medium text-foreground"> local extraction file payload</span>
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

          {/* Direct JSON Paste & Sample Payload */}
          <div className="flex justify-between items-center">
            <span className="text-xs font-mono font-semibold text-muted-foreground uppercase flex items-center gap-1">
              <FileCode size={13} /> Direct JSON Input
            </span>
            <Button
              id="btn-load-sample-ast"
              type="button"
              variant="ghost"
              size="xs"
              className="text-[11px] text-primary flex items-center gap-1"
              onClick={handleLoadSample}
            >
              <Play size={11} /> Load Sample AST Data
            </Button>
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

          {/* Validation Notice */}
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
