import React from 'react';
import { ExtractedTableRecord } from '../types/transformer.types';

interface TransformationsTableProps {
  records: ExtractedTableRecord[];
  onSelectVariable?: (variableName: string) => void;
}

export const TransformationsTable: React.FC<TransformationsTableProps> = ({ records, onSelectVariable }) => {
  return (
    <div className="w-full border border-border rounded-md overflow-hidden bg-background font-mono text-xs">
      <div className="max-h-[180px] overflow-y-auto overflow-x-hidden">
        <table className="w-full text-left border-collapse table-fixed font-mono text-xs">
          <thead className="sticky top-0 z-10 bg-muted/95 backdrop-blur border-b border-border text-[11px] uppercase text-muted-foreground font-bold select-none">
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
                <td colSpan={4} className="h-12 text-center text-muted-foreground italic p-2">
                  No extraction variables matched.
                </td>
              </tr>
            ) : (
              records.map((row) => (
                <tr key={row.id} className="hover:bg-muted/30">
                  <td className="p-1.5 align-top font-bold text-foreground break-all whitespace-normal">{row.stepName}</td>
                  <td className="p-1.5 align-top break-all whitespace-normal">
                    {row.variable ? (
                      <code
                        onClick={() => onSelectVariable?.(row.variable)}
                        data-tooltip={`Click to insert {{${row.variable}}} into template`}
                        className="text-primary bg-primary/10 px-1 py-0.5 rounded cursor-pointer hover:bg-primary/20 hover:underline transition-colors select-none inline-block break-all"
                      >
                        {row.variable}
                      </code>
                    ) : (
                      <span className="text-muted-foreground">-</span>
                    )}
                  </td>
                  <td className="p-1.5 align-top">
                    <span className="text-emerald-500 font-mono break-all whitespace-normal block" title={row.value}>
                      {row.value}
                    </span>
                  </td>
                  <td className="p-1.5 align-top">
                    <span className="text-muted-foreground font-mono break-all whitespace-normal block" title={row.rawMatch}>
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
