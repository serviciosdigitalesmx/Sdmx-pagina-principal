import React from 'react';

export type TableColumn<T extends Record<string, unknown>> = {
  key: keyof T | string;
  label: string;
  render?: (row: T) => React.ReactNode;
};

export function Table<T extends Record<string, unknown>>({
  columns,
  rows,
  emptyMessage = 'Sin registros',
}: {
  columns: TableColumn<T>[];
  rows: T[];
  emptyMessage?: string;
}) {
  if (!rows.length) {
    return (
      <div className="rounded-2xl border border-white/10 bg-slate-950/30 p-6 text-sm text-slate-400">
        {emptyMessage}
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-2xl border border-white/10">
      <table className="min-w-full divide-y divide-white/10 text-left text-sm">
        <thead className="bg-white/5 text-slate-400">
          <tr>
            {columns.map((column) => (
              <th key={String(column.key)} className="px-4 py-3 font-medium">
                {column.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-white/10">
          {rows.map((row, rowIndex) => (
            <tr key={rowIndex} className="bg-slate-950/20">
              {columns.map((column) => (
                <td key={String(column.key)} className="px-4 py-3 text-slate-200">
                  {column.render
                    ? column.render(row)
                    : String(row[column.key as keyof T] ?? '')}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
