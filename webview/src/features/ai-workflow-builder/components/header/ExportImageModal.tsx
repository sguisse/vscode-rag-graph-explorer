import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Image as ImageIcon, Copy, Download, Check } from 'lucide-react';
import { RenderedCanvasImageResult } from '../../utils/canvas-export.utils';
import { vsCodeApiService } from '@/services/api/vs-code-api.service.gen';

interface ExportImageModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  imageData: RenderedCanvasImageResult | null;
}

export function ExportImageModal({ open, onOpenChange, imageData }: ExportImageModalProps) {
  const [copied, setCopied] = useState(false);

  if (!imageData) return null;

  const handleCopyClipboard = async () => {
    try {
      if (navigator.clipboard && window.ClipboardItem) {
        await navigator.clipboard.write([
          new ClipboardItem({ 'image/png': imageData.blob }),
        ]);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      }
    } catch (err) {
      console.warn('Clipboard write failed:', err);
    }
  };

  const handleDownload = () => {
    const filename = 'ai-workflow-diagram.png';

    // Post to VS Code Host bridge
    if (typeof (vsCodeApiService as any).postMessage === 'function') {
      (vsCodeApiService as any).postMessage({
        type: 'exportImage',
        payload: {
          filename,
          dataUrl: imageData.dataUrl,
        },
      });
    }

    // Anchor download fallback
    const link = document.createElement('a');
    link.href = imageData.dataUrl;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-xl font-mono">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-sm">
            <ImageIcon size={16} className="text-emerald-500" /> Export Workflow Diagram
          </DialogTitle>
          <DialogDescription className="text-xs">
            Rendered PNG Diagram ({imageData.width} × {imageData.height} px)
          </DialogDescription>
        </DialogHeader>

        {/* Live Diagram Image Preview */}
        <div className="flex justify-center items-center bg-background/80 p-2 border border-border rounded-lg max-h-80 overflow-auto">
          <img
            src={imageData.dataUrl}
            alt="AI Workflow Diagram Render"
            className="shadow-md max-w-full h-auto object-contain rounded"
          />
        </div>

        <DialogFooter className="flex sm:justify-between items-center gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleCopyClipboard}
            className="h-8 text-xs gap-1.5 cursor-pointer"
          >
            {copied ? <Check size={14} className="text-emerald-500" /> : <Copy size={14} />}
            {copied ? 'Copied!' : 'Copy to Clipboard'}
          </Button>

          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => onOpenChange(false)}
              className="h-8 text-xs"
            >
              Close
            </Button>
            <Button
              type="button"
              size="sm"
              onClick={handleDownload}
              className="bg-emerald-600 hover:bg-emerald-700 h-8 font-bold text-white text-xs gap-1.5 cursor-pointer"
            >
              <Download size={14} /> Download PNG
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
