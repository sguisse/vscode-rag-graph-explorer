import React from 'react';
import { FileCode, Layers, Lock, Check, X } from 'lucide-react';
import { Button } from '@/components/ui/button';

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
    <div className="flex items-center justify-between w-full h-full px-3 py-1 bg-card border-b border-border font-mono text-xs select-none">
      {/* Informations à gauche */}
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-1.5 font-bold text-muted-foreground uppercase text-[10px]">
          <Layers size={13} className="text-primary" />
          <span>Transformation Scope:</span>
        </div>

        <div className="flex items-center gap-1.5">
          {isReferenceFileScope && (
            <span title="Fixed Scope">
              <Lock size={12} className="text-amber-500" />
            </span>
          )}
          <select
            value={scope}
            disabled={isReferenceFileScope}
            onChange={(e) => onScopeChange(e.target.value as TransformationScopeType)}
            className={`bg-background text-foreground border border-border text-xs font-mono font-bold rounded h-6 px-2 transition-colors ${
              isReferenceFileScope
                ? 'opacity-80 cursor-not-allowed bg-muted/40 border-amber-500/40 text-amber-500'
                : 'cursor-pointer hover:bg-muted/50'
            }`}
          >
            {isReferenceFileScope ? (
              <option value="Reference file">Reference file</option>
            ) : (
              <>
                <option value="Default">Default</option>
                <option value="Selected file context">Selected file context</option>
              </>
            )}
          </select>
        </div>

        {/* Badge d'informations du fichier de référence */}
        {isReferenceFileScope && referenceFileInfo && (
          <div className="flex items-center gap-2 bg-muted/30 px-2 py-0.5 border border-border/60 rounded text-[11px] text-foreground">
            <span className="font-bold flex items-center gap-1 text-primary">
              <FileCode size={13} />
              {referenceFileInfo.fileName || 'Reference File'}
            </span>
            {referenceFileInfo.language && (
              <span className="bg-primary/10 text-primary border border-primary/20 px-1 py-0.2 rounded text-[9px] font-bold uppercase">
                {referenceFileInfo.language}
              </span>
            )}
            {referenceFileInfo.filePath && (
              <span className="text-muted-foreground truncate max-w-[180px]" title={referenceFileInfo.filePath}>
                <code>{referenceFileInfo.filePath}</code>
              </span>
            )}
          </div>
        )}
      </div>

      {/* Boutons d'action à droite dans l'ordre: Close puis Validate */}
      <div className="flex items-center gap-1.5">
        {(onClose || isReferenceFileScope) && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="h-6 px-2 text-[11px] gap-1 cursor-pointer font-bold hover:bg-muted text-muted-foreground hover:text-foreground"
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
