import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';

type CommentaryEditorProps = {
  appCode: string;
  commentary: string;
  isEditing: boolean;
  draftVal: string;
  onStartEdit: (code: string, commentary: string) => void;
  onSave: (code: string) => void;
  onCancel: (code: string) => void;
  onDraftChange: (code: string, val: string) => void;
};

export function CommentaryEditor({
  appCode,
  commentary,
  isEditing,
  draftVal,
  onStartEdit,
  onSave,
  onCancel,
  onDraftChange,
}: CommentaryEditorProps) {
  return (
    <div className="p-4 bg-slate-50/50 border-t border-slate-200 flex flex-col md:flex-row justify-between gap-3 text-xs">
      <div className="flex-1">
        <div className="flex items-center justify-between mb-1.5">
          <span className="font-bold text-slate-700 flex items-center gap-1.5">
            <svg className="w-3.5 h-3.5 text-slate-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
              <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
            </svg>
            <span>Application Goals &amp; Progress Commentary:</span>
          </span>
          {isEditing ? (
            <div className="flex items-center gap-2">
              <Button onClick={() => onSave(appCode)} size="sm" type="button" variant="ghost"
                className="h-6 px-2 text-xs text-emerald-600 font-bold hover:bg-emerald-50 hover:text-emerald-700"
              >
                Save Note
              </Button>
              <Button onClick={() => onCancel(appCode)} size="sm" type="button" variant="ghost"
                className="h-6 px-2 text-xs text-slate-500 hover:bg-slate-100"
              >
                Cancel
              </Button>
            </div>
          ) : (
            <Button onClick={() => onStartEdit(appCode, commentary)} size="sm" type="button" variant="ghost"
              className="h-6 px-2 text-xs text-indigo-600 font-semibold hover:bg-indigo-50"
            >
              Edit Note
            </Button>
          )}
        </div>
        {isEditing ? (
          <Textarea onChange={(e) => onDraftChange(appCode, e.target.value)}
            value={draftVal}
            rows={3}
            className="border-indigo-300 focus-visible:ring-indigo-500 text-xs font-mono"
          />
        ) : (
          <div className="p-2.5 bg-white border border-slate-200 rounded-lg text-slate-600 whitespace-pre-line font-mono text-[11px] leading-relaxed">
            {commentary || 'No commentary recorded for this application.'}
          </div>
        )}
      </div>
    </div>
  );
}

export default CommentaryEditor;
