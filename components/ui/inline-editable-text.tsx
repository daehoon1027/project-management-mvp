"use client";

import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

type InlineEditableTextProps = {
  value: string;
  placeholder?: string;
  onSave: (value: string) => void;
  className?: string;
  inputClassName?: string;
  disabled?: boolean;
};

export function InlineEditableText({
  value,
  placeholder,
  onSave,
  className,
  inputClassName,
  disabled = false,
}: InlineEditableTextProps) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(value);

  useEffect(() => {
    setDraft(value);
  }, [value]);

  if (editing) {
    return (
      <input
        autoFocus
        value={draft}
        onChange={(event) => setDraft(event.target.value)}
        onBlur={() => {
          setEditing(false);
          if (draft.trim() && draft !== value) {
            onSave(draft);
          } else {
            setDraft(value);
          }
        }}
        onKeyDown={(event) => {
          if (event.key === "Enter") {
            event.currentTarget.blur();
          }

          if (event.key === "Escape") {
            setDraft(value);
            setEditing(false);
          }
        }}
        className={cn(
          "rounded-xl border border-brand-300 bg-white px-2 py-1 outline-none focus:border-brand-500 dark:bg-slate-900",
          inputClassName,
        )}
      />
    );
  }

  return (
    <button
      type="button"
      disabled={disabled}
      onClick={(event) => {
        if (disabled) {
          return;
        }

        event.stopPropagation();
        setEditing(true);
      }}
      className={cn(
        "text-left transition hover:text-brand-600 disabled:cursor-not-allowed disabled:opacity-60 dark:hover:text-brand-300",
        className,
      )}
      title={disabled ? "현재 모드에서는 직접 수정할 수 없습니다." : "클릭해서 바로 수정"}
    >
      {value || placeholder || "-"}
    </button>
  );
}
