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
        "rounded-[30px] border border-slate-200/80 bg-white/95 p-6 shadow-[0_18px_50px_rgba(15,23,42,0.08)] backdrop-blur-sm dark:border-slate-800/90 dark:bg-slate-900/95 dark:shadow-[0_20px_60px_rgba(2,6,23,0.45)]",
        className,
      )}
    >
      {children}
    </section>
  );
}
