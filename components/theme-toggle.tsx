type ThemeToggleProps = {
  isDarkMode: boolean;
  onToggle: () => void;
};

export function ThemeToggle({ isDarkMode, onToggle }: ThemeToggleProps) {
  return (
    <button
      type="button"
      onClick={onToggle}
      className="inline-flex items-center justify-center rounded-2xl border border-slate-300 bg-white/90 px-4 py-3 text-sm font-semibold text-slate-950 transition hover:bg-white dark:border-white/15 dark:bg-white dark:text-slate-950 dark:hover:bg-slate-100"
    >
      {isDarkMode ? "라이트 모드" : "다크 모드"}
    </button>
  );
}
