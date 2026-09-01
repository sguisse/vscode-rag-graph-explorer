import React from 'react';
import { FileCode, Layers, Lock, Check, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

export type TransformationScopeType = 'Default' | 'Selected file context' | 'Reference file';

export interface ReferenceFileInfo {
  filePath?: string;
  fileName?: string;
  language?: string;
  size?: number;
}

export interface TransformationScopePanelProps {
  scope: TransformationScopeType;
  onScopeChange: (newScope: TransformationScopeType) => void;
  referenceFileInfo?: ReferenceFileInfo;
  isDirty?: boolean;
  onValidate?: () => void;
  onClose?: () => void;
}

export const TransformationScopePanel: React.FC<TransformationScopePanelProps> = ({
  scope,
  onScopeChange,
  referenceFileInfo,
  isDirty = false,
  onValidate,
  onClose,
}) => {
  const isReferenceFileScope = scope === 'Reference file';

  return (
    <div className="flex justify-between items-center bg-card px-3 py-1 border-border border-b w-full h-full font-mono text-xs select-none">
      {/* Left panel information */}
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-1.5 font-bold text-[10px] text-muted-foreground uppercase">
          <Layers size={13} className="text-primary" />
          <span>Transformation Scope:</span>
        </div>

        <div className="flex items-center gap-1.5">
          {isReferenceFileScope && (
            <span title="Fixed Scope">
              <Lock size={12} className="text-amber-500" />
            </span>
          )}
          <Select
            value={scope}
            disabled={isReferenceFileScope}
            onValueChange={(val) => onScopeChange(val as TransformationScopeType)}
          >
            <SelectTrigger
              className={`bg-background border-border shadow-none !h-6 min-h-0 py-0 px-2 w-60 rounded-sm text-xs font-mono flex items-center gap-1 transition-colors ${
                isReferenceFileScope
                  ? 'opacity-80 cursor-not-allowed bg-muted/40 border-amber-500/40 text-amber-500'
                  : 'cursor-pointer hover:bg-muted/50'
              }`}
            >
              <SelectValue placeholder="Select Scope..." />
            </SelectTrigger>
            <SelectContent className="font-mono text-xs">
              {isReferenceFileScope ? (
                <SelectItem value="Reference file">Reference file</SelectItem>
              ) : (
                <>
                  <SelectItem value="Default">Default</SelectItem>
                  <SelectItem value="Selected file context">Selected file context</SelectItem>
                </>
              )}
            </SelectContent>
          </Select>
        </div>

        {/* Reference file information badge */}
        {isReferenceFileScope && referenceFileInfo && (
          <div className="flex items-center gap-2 bg-muted/30 px-2 py-0.5 border border-border/60 rounded text-[11px] text-foreground">
            <span className="flex items-center gap-1 font-bold text-primary">
              <FileCode size={13} />
              {referenceFileInfo.fileName || 'Reference File'}
            </span>
            {referenceFileInfo.language && (
              <span className="bg-primary/10 px-1 py-0.2 border border-primary/20 rounded font-bold text-[9px] text-primary uppercase">
                {referenceFileInfo.language}
              </span>
            )}
            {referenceFileInfo.filePath && (
              <span className="max-w-[180px] text-muted-foreground truncate" title={referenceFileInfo.filePath}>
                <code>{referenceFileInfo.filePath}</code>
              </span>
            )}
          </div>
        )}
      </div>

      {/* Right side action buttons */}
      <div className="flex items-center gap-1.5">
        {(onClose || isReferenceFileScope) && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="gap-1 hover:bg-muted px-2 h-6 font-bold text-[11px] text-muted-foreground hover:text-foreground cursor-pointer"
            title="Close Transformer and Return"
          >
            <X size={13} />
            <span>Close</span>
          </Button>
        )}

        <Button
          variant={isDirty ? 'default' : 'outline'}
          size="sm"
          disabled={!isDirty}
          onClick={onValidate}
          className={`h-6 px-2 text-[11px] gap-1 font-bold transition-all ${
            isDirty
              ? 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-xs cursor-pointer'
              : 'opacity-50 cursor-not-allowed text-muted-foreground border-border'
          }`}
          title={isDirty ? 'Save Transformation Workflow Modifications' : 'No Unsaved Changes'}
        >
          <Check size={13} />
          <span>Validate</span>
        </Button>
      </div>
    </div>
  );
};

export default TransformationScopePanel;
