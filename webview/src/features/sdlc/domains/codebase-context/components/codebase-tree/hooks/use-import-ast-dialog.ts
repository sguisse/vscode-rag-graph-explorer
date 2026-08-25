import { useState, useRef, useEffect } from 'react';
import { CodebaseData } from '@/shared/services/graph-rag-explorer';

export function useImportAstDialog(
  onOpenChange: (open: boolean) => void,
  onImport: (data: CodebaseData) => void
) {
  const [isDragging, setIsDragging] = useState(false);
  const [jsonText, setJsonText] = useState('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const preventGlobalDnD = (e: DragEvent) => {
      e.preventDefault();
      if (e.dataTransfer) {
        e.dataTransfer.dropEffect = 'none';
      }
    };

    window.addEventListener('dragenter', preventGlobalDnD, false);
    window.addEventListener('dragover', preventGlobalDnD, false);
    window.addEventListener('drop', preventGlobalDnD, false);

    return () => {
      window.removeEventListener('dragenter', preventGlobalDnD, false);
      window.removeEventListener('dragover', preventGlobalDnD, false);
      window.removeEventListener('drop', preventGlobalDnD, false);
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
      setErrorMsg('Failed to read the selected file payload.');
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
      e.dataTransfer.dropEffect = 'copy';
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
      setJsonText('');
      setFileName(null);
      setErrorMsg(null);
    }
  };

  return {
    isDragging,
    jsonText,
    setJsonText,
    errorMsg,
    fileName,
    fileInputRef,
    parseAndValidate,
    handleDragEnter,
    handleDragOver,
    handleDragLeave,
    handleDrop,
    handleFileInputChange,
    handleBrowseClick,
    handleConfirmImport,
  };
}
