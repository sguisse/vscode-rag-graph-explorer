import { ExtractedTableRecord } from '@/shared/services/transform-content/model/transform-content-model';
import React from 'react';


interface TransformationsTableProps {
  records: ExtractedTableRecord[];
  onSelectVariable?: (variableName: string) => void;
}

export const TransformationsTable: React.FC<TransformationsTableProps> = ({ records, onSelectVariable }) => {
  return (
    <div className="bg-background border border-border rounded-md w-full overflow-hidden font-mono text-xs">
      <div className="max-h-[180px] overflow-x-hidden overflow-y-auto">
        <table className="w-full font-mono text-xs text-left border-collapse table-fixed">
          <thead className="top-0 z-10 sticky bg-muted/95 backdrop-blur border-border border-b font-bold text-[11px] text-muted-foreground uppercase select-none">
            <tr>
              <th className="p-1.5 w-[25%]">Step / Rule</th>
              <th className="p-1.5 w-[20%]">Variable</th>
              <th className="p-1.5 w-[30%]">Extracted Value</th>
              <th className="p-1.5 w-[25%]">Raw Match</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border/60">
            {records.length === 0 ? (
              <tr>
                <td colSpan={4} className="p-2 h-12 text-muted-foreground text-center italic">
                  No extraction variables matched.
                </td>
              </tr>
            ) : (
              records.map((row) => (
                <tr key={row.id} className="hover:bg-muted/30">
                  <td className="p-1.5 font-bold text-foreground break-all align-top whitespace-normal">{row.stepName}</td>
                  <td className="p-1.5 break-all align-top whitespace-normal">
                    {row.variable ? (
                      <code
                        onClick={() => onSelectVariable?.(row.variable)}
                        data-tooltip={`Click to insert {{${row.variable}}} into template`}
                        className="inline-block bg-primary/10 hover:bg-primary/20 px-1 py-0.5 rounded text-primary hover:underline break-all transition-colors cursor-pointer select-none"
                      >
                        {row.variable}
                      </code>
                    ) : (
                      <span className="text-muted-foreground">-</span>
                    )}
                  </td>
                  <td className="p-1.5 align-top">
                    <span className="block font-mono text-emerald-500 break-all whitespace-normal" title={row.value}>
                      {row.value}
                    </span>
                  </td>
                  <td className="p-1.5 align-top">
                    <span className="block font-mono text-muted-foreground break-all whitespace-normal" title={row.rawMatch}>
                      {row.rawMatch}
                    </span>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
