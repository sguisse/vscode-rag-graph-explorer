import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Copy, RefreshCw } from 'lucide-react';
import { blastRadiusErrorFilesIdentificatorApiService } from '@/services/api/blast-radius-error-files-identificator-api.service.gen';
import { BlastRadiusScope } from '@/shared/services/errors/types/type-blast-radius-scope.gen';
import { useExporterStore } from '../store/useExporterStore';
import { logInfo } from '../utils/log-info';

export interface ErrorFilesModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddPaths: (paths: string[]) => void;
}

export function ErrorFilesModal({ isOpen, onClose, onAddPaths }: ErrorFilesModalProps) {
  const workspaceRoot = useExporterStore((s) => s.workspaceRoot);
  const [scope, setScope] = useState<BlastRadiusScope>('JAVA_STACKTRACE');
  const [includeOutWorkspace, setIncludeOutWorkspace] = useState<boolean>(false);
  const [content, setContent] = useState<string>('');
  const [analyzing, setAnalyzing] = useState<boolean>(false);
  const [results, setResults] = useState<string[]>([]);

  const handleAnalyze = async () => {
    logInfo('[ErrorFilesModal] handleAnalyze handler triggered', { scope, includeOutWorkspace, contentLength: content.length });
    if (!content.trim()) return;
    setAnalyzing(true);
    try {
      const found = await blastRadiusErrorFilesIdentificatorApiService.searchFiles(
        scope,
        content,
        workspaceRoot,
        undefined,
        includeOutWorkspace
      );
      setResults(found || []);
    } catch (err) {
      console.error('[ErrorFilesModal] Error analyzing stack trace:', err);
    } finally {
      setAnalyzing(false);
    }
  };

  const handleCopyResults = () => {
    logInfo('[ErrorFilesModal] handleCopyResults handler triggered', { resultsCount: results.length });
    if (results.length > 0) {
      navigator.clipboard.writeText(results.join('\n'));
    }
  };

  const handleConfirmAdd = () => {
    logInfo('[ErrorFilesModal] handleConfirmAdd handler triggered', { resultsCount: results.length });
    if (results.length > 0) {
      onAddPaths(results);
    }
    onClose();
  };

  const handleClose = () => {
    logInfo('[ErrorFilesModal] onClose handler triggered');
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && handleClose()}>
      <DialogContent className="max-w-2xl font-mono text-xs">
        <DialogHeader>
          <DialogTitle className="text-sm font-bold text-primary">
            ⚠️ Error Stack Trace Analysis & Source Identification
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-3 py-2">
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex-1 space-y-1 min-w-[200px]">
              <label className="text-[10px] font-bold text-muted-foreground uppercase">Stack Engine Type</label>
              <Select value={scope} onValueChange={(val) => {
                logInfo('[ErrorFilesModal] scope changed', val);
                setScope(val as BlastRadiusScope);
              }}>
                <SelectTrigger className="h-7 text-xs font-mono bg-background">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="JAVA_STACKTRACE">Java Stacktrace</SelectItem>
                  <SelectItem value="BROWSER_CONSOLE">Browser Console</SelectItem>
                  <SelectItem value="PYTHON">Python Traceback</SelectItem>
                  <SelectItem value="TYPESCRIPT_BUILD_ERROR">TypeScript Build Error</SelectItem>
                  <SelectItem value="JAVA_BUILD_ERROR">Java Build Error</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center gap-2 pt-4">
              <Checkbox
                id="cb-out-workspace"
                checked={includeOutWorkspace}
                onCheckedChange={(val) => {
                  logInfo('[ErrorFilesModal] includeOutWorkspace changed', Boolean(val));
                  setIncludeOutWorkspace(Boolean(val));
                }}
              />
              <label htmlFor="cb-out-workspace" className="text-[11px] font-medium cursor-pointer">
                Include out-of-workspace files
              </label>
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-[10px] font-bold text-muted-foreground uppercase">Raw Stack Trace Logs</label>
            <Textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Paste raw stack trace logs here..."
              rows={5}
              className="bg-background font-mono text-xs"
            />
          </div>

          <div className="flex justify-start">
            <Button size="sm" onClick={handleAnalyze} disabled={analyzing || !content.trim()} className="gap-1.5 h-7">
              <RefreshCw size={12} className={analyzing ? 'animate-spin' : ''} />
              <span>{analyzing ? 'Analyzing Stack...' : 'Analyze Stack Trace'}</span>
            </Button>
          </div>

          <div className="space-y-1">
            <div className="flex justify-between items-center">
              <label className="text-[10px] font-bold text-muted-foreground uppercase">
                Identified Matching Workspace Paths ({results.length})
              </label>
              <Button size="icon-xs" variant="ghost" onClick={handleCopyResults} disabled={results.length === 0}>
                <Copy size={12} />
              </Button>
            </div>
            <Textarea
              value={results.join('\n')}
              readOnly
              rows={4}
              placeholder="Identified path locations will appear here..."
              className="bg-muted/30 font-mono text-xs"
            />
          </div>
        </div>

        <DialogFooter className="gap-2">
          <Button variant="outline" size="sm" onClick={handleClose} className="h-7 text-xs">
            Cancel
          </Button>
          <Button size="sm" onClick={handleConfirmAdd} disabled={results.length === 0} className="h-7 text-xs">
            Add Paths
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
