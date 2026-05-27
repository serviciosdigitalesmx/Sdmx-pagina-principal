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
  onAction?: () => void | Promise<void>;
  secondaryActionLabel?: string;
  secondaryOnAction?: () => void | Promise<void>;
  tertiaryActionLabel?: string;
  tertiaryOnAction?: () => void | Promise<void>;
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
  onAction,
  secondaryActionLabel,
  secondaryOnAction,
  tertiaryActionLabel,
  tertiaryOnAction,
  stats,
  columns,
  rows,
  emptyTitle,
  emptyCopy,
  children,
}: ModuleShellProps) {
  return (
    <div className="space-y-6 text-zinc-100">
      <header className="flex flex-col gap-4 rounded-[2rem] border border-amber-700/15 bg-[linear-gradient(180deg,rgba(16,14,12,0.96),rgba(14,13,12,0.92))] p-6 shadow-[0_16px_70px_rgba(0,0,0,0.24)] backdrop-blur sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-amber-700/20 bg-amber-500/10 text-lg font-black text-amber-50 shadow-[0_12px_30px_rgba(0,0,0,0.18)]">
            <i className={icon} />
          </div>
          <div>
            <h1 className="text-2xl font-semibold text-zinc-50">{title}</h1>
            <p className="mt-1 text-sm text-zinc-400">{subtitle}</p>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          {secondaryActionLabel ? (
            <button
              type="button"
              onClick={() => void secondaryOnAction?.()}
              className="inline-flex items-center justify-center rounded-full border border-zinc-700 bg-zinc-950 px-4 py-2.5 text-sm font-semibold text-zinc-100 transition-colors hover:bg-white/5"
            >
              {secondaryActionLabel}
            </button>
          ) : null}
          {tertiaryActionLabel ? (
            <button
              type="button"
              onClick={() => void tertiaryOnAction?.()}
              className="inline-flex items-center justify-center rounded-full border border-zinc-700 bg-zinc-950 px-4 py-2.5 text-sm font-semibold text-zinc-100 transition-colors hover:bg-white/5"
            >
              {tertiaryActionLabel}
            </button>
          ) : null}
          <button
            type="button"
            onClick={() => void onAction?.()}
            className="inline-flex items-center justify-center rounded-full bg-amber-50 px-4 py-2.5 text-sm font-semibold text-zinc-950 transition-colors hover:bg-amber-100"
          >
            {actionLabel}
          </button>
        </div>
      </header>

      <section className="grid gap-4 md:grid-cols-3">
        {stats.map((stat) => (
          <div key={stat.label} className="rounded-[1.5rem] border border-stone-700/70 bg-white/4 p-4 shadow-[0_12px_40px_rgba(0,0,0,0.18)]">
            <div className="text-[11px] uppercase tracking-[0.22em] text-amber-100/60">{stat.label}</div>
            <div className="mt-3 text-2xl font-semibold text-zinc-50">{stat.value}</div>
            <div className="mt-2 text-sm text-zinc-400">{stat.helper}</div>
          </div>
        ))}
      </section>

      <section className="rounded-[2rem] border border-amber-700/15 bg-[linear-gradient(180deg,rgba(16,14,12,0.96),rgba(22,18,14,0.98))] p-6 shadow-[0_16px_70px_rgba(0,0,0,0.24)]">
        {rows.length > 0 ? (
          <div className="overflow-hidden rounded-2xl border border-zinc-800">
            <table className="min-w-full divide-y divide-zinc-800 text-left text-sm">
              <thead className="bg-zinc-900/70 text-zinc-400">
                <tr>
                  {columns.map((column) => (
                    <th key={column.key} className="px-4 py-3 font-medium">
                      {column.label}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800">
                {rows.map((row, index) => (
                  <tr key={`${title}-${index}`} className="bg-zinc-950">
                    {columns.map((column) => (
                      <td key={column.key} className="px-4 py-3 text-zinc-300">
                        {row[column.key]}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="flex min-h-[320px] flex-col items-center justify-center rounded-2xl border border-dashed border-zinc-800 bg-zinc-900/50 px-6 text-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-zinc-950 text-xl text-amber-100/70">
              <i className={icon} />
            </div>
            <h2 className="mt-4 text-lg font-semibold text-zinc-50">{emptyTitle}</h2>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-zinc-400">{emptyCopy}</p>
          </div>
        )}
        {children ? <div className="mt-6">{children}</div> : null}
      </section>
    </div>
  );
}
