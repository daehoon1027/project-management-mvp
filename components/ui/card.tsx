import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

type CardProps = {
  children: ReactNode;
  className?: string;
};

export function Card({ children, className }: CardProps) {
  return (
    <section
      className={cn(
        "rounded-2xl border border-slate-200/80 bg-white/95 p-5 shadow-[0_8px_30px_rgba(15,23,42,0.06)] backdrop-blur-sm dark:border-slate-800/90 dark:bg-slate-900/95 dark:shadow-[0_12px_40px_rgba(2,6,23,0.45)]",
        className,
      )}
    >
      {children}
    </section>
  );
}
