import React from 'react';

type Stat = {
  label: string;
  value: string;
  helper: string;
};

type Column = {
  label: string;
  key: string;
};

type Row = Record<string, string>;

type ModuleShellProps = {
  title: string;
  subtitle: string;
  icon: string;
  actionLabel: string;
  stats: Stat[];
  columns: Column[];
  rows: Row[];
  emptyTitle: string;
  emptyCopy: string;
  children?: React.ReactNode;
};

export function ModuleShell({
  title,
  subtitle,
  icon,
  actionLabel,
  stats,
  columns,
  rows,
  emptyTitle,
  emptyCopy,
  children,
}: ModuleShellProps) {
  return (
    <div className="space-y-6 text-slate-100">
      <header className="flex flex-col gap-4 rounded-3xl border border-white/10 bg-white/5 p-6 shadow-2xl shadow-black/20 backdrop-blur sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-cyan-500 text-lg font-black text-slate-950">
            <i className={icon} />
          </div>
          <div>
            <h1 className="text-2xl font-semibold text-white">{title}</h1>
            <p className="mt-1 text-sm text-slate-400">{subtitle}</p>
          </div>
        </div>
        <button className="inline-flex items-center justify-center rounded-xl bg-cyan-500 px-4 py-2.5 text-sm font-semibold text-slate-950 transition-colors hover:bg-cyan-400">
          {actionLabel}
        </button>
      </header>

      <section className="grid gap-4 md:grid-cols-3">
        {stats.map((stat) => (
          <div key={stat.label} className="rounded-2xl border border-white/10 bg-slate-900/80 p-4">
            <div className="text-xs uppercase tracking-[0.2em] text-slate-500">{stat.label}</div>
            <div className="mt-3 text-2xl font-semibold text-white">{stat.value}</div>
            <div className="mt-2 text-sm text-slate-400">{stat.helper}</div>
          </div>
        ))}
      </section>

      <section className="rounded-3xl border border-white/10 bg-slate-900/80 p-6">
        {rows.length > 0 ? (
          <div className="overflow-hidden rounded-2xl border border-white/10">
            <table className="min-w-full divide-y divide-white/10 text-left text-sm">
              <thead className="bg-white/5 text-slate-400">
                <tr>
                  {columns.map((column) => (
                    <th key={column.key} className="px-4 py-3 font-medium">
                      {column.label}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-white/10">
                {rows.map((row, index) => (
                  <tr key={`${title}-${index}`} className="bg-slate-950/20">
                    {columns.map((column) => (
                      <td key={column.key} className="px-4 py-3 text-slate-200">
                        {row[column.key]}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="flex min-h-[320px] flex-col items-center justify-center rounded-2xl border border-dashed border-white/10 bg-slate-950/30 px-6 text-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white/5 text-xl text-cyan-400">
              <i className={icon} />
            </div>
            <h2 className="mt-4 text-lg font-semibold text-white">{emptyTitle}</h2>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-400">{emptyCopy}</p>
          </div>
        )}
        {children ? <div className="mt-6">{children}</div> : null}
      </section>
    </div>
  );
}
