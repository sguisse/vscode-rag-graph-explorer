import React from 'react';
import { ExtractedTableRecord } from '../types/transformer.types';

interface TransformationsTableProps {
  records: ExtractedTableRecord[];
}

export const TransformationsTable: React.FC<TransformationsTableProps> = ({ records }) => {
  return (
    <div className="w-full border border-border rounded-md overflow-hidden bg-background font-mono text-xs">
      <div className="overflow-x-auto max-h-[280px] overflow-y-auto">
        <table className="w-full text-left border-collapse table-auto font-mono text-xs">
          <thead className="sticky top-0 z-10 bg-muted/95 backdrop-blur border-b border-border text-[11px] uppercase text-muted-foreground font-bold select-none">
            <tr>
              <th className="p-2">Step / Rule</th>
              <th className="p-2">Variable</th>
              <th className="p-2">Extracted Value</th>
              <th className="p-2">Raw Match</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border/60">
            {records.length === 0 ? (
              <tr>
                <td colSpan={4} className="h-16 text-center text-muted-foreground italic p-4">
                  No extraction variables matched.
                </td>
              </tr>
            ) : (
              records.map((row) => (
                <tr key={row.id} className="hover:bg-muted/30">
                  <td className="p-2 align-middle font-bold text-foreground">{row.stepName}</td>
                  <td className="p-2 align-middle">
                    <code className="text-primary bg-primary/10 px-1 py-0.5 rounded">{row.variable || '-'}</code>
                  </td>
                  <td className="p-2 align-middle">
                    <span className="text-emerald-500 font-mono truncate max-w-[200px] block" title={row.value}>
                      {row.value}
                    </span>
                  </td>
                  <td className="p-2 align-middle">
                    <span className="text-muted-foreground font-mono truncate max-w-[150px] block" title={row.rawMatch}>
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
