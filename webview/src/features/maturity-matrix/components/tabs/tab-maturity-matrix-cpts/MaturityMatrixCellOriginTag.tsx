type CellOriginTagProps = {
  sheet: string;
  col: string;
  row: number | string;
  showCellOrigins: boolean;
  onOriginClick?: (sheet: string, col: string, row: number | string) => void;
  className?: string;
};

export function CellOriginTag({
  sheet,
  col,
  row,
  showCellOrigins,
  onOriginClick,
  className = '',
}: CellOriginTagProps) {
  if (!showCellOrigins) return null;

  return (
    <button
      type="button"
      onClick={(e) => {
        e.stopPropagation();
        if (onOriginClick) {
          onOriginClick(sheet, col, row);
        } else {
          console.log(`Opening sheet '${sheet}'!${col}${row}`);
        }
      }}
      className={`inline-flex items-center gap-0.5 text-[8px] font-mono font-bold text-indigo-600 hover:text-white bg-indigo-50 hover:bg-indigo-600 border border-indigo-200 hover:border-indigo-600 rounded px-1 py-0.5 transition-all cursor-pointer shadow-xs ${className}`}
      title={`Click to open Google Sheet and select cell '${sheet}'!${col}${row}`}
    >
      <span>
        [{col}:{row}]
      </span>
      <svg className="w-2 h-2 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
        <polyline points="15 3 21 3 21 9" />
        <line x1="10" y1="14" x2="21" y2="3" />
      </svg>
    </button>
  );
}

export default CellOriginTag;
