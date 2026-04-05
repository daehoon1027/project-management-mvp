import { cn } from "@/lib/utils";

type ProgressBarProps = {
  value: number;
  className?: string;
  label?: string;
};

export function ProgressBar({ value, className, label }: ProgressBarProps) {
  return (
    <div className={cn("space-y-2", className)}>
      {label ? (
        <div className="flex items-center justify-between text-xs font-medium text-slate-500 dark:text-slate-400">
          <span>{label}</span>
          <span>{value}%</span>
        </div>
      ) : null}
      <div className="relative h-3.5 overflow-hidden rounded-full bg-slate-200/90 ring-1 ring-inset ring-slate-200 dark:bg-slate-800 dark:ring-slate-700">
        <div
          className="relative flex h-full items-center justify-end rounded-full bg-gradient-to-r from-brand-500 via-sky-500 to-emerald-400 pr-2 text-[10px] font-semibold text-white shadow-[0_0_0_1px_rgba(255,255,255,0.08),0_8px_20px_rgba(47,124,255,0.28)] transition-all"
          style={{ width: `${Math.max(value, 6)}%` }}
        >
          <span className="absolute inset-y-0 right-0 w-10 bg-gradient-to-r from-transparent to-white/20" />
          {value > 12 ? `${value}%` : ""}
        </div>
      </div>
    </div>
  );
}
