"use client";

import { Card } from "@/components/ui/card";
import { getAssigneeSummary } from "@/utils/task-utils";
import type { Task } from "@/types";

type AssigneeListPanelProps = {
  tasks: Task[];
  selectedAssignee: string;
  onSelectAssignee: (assignee: string) => void;
};

export function AssigneeListPanel({ tasks, selectedAssignee, onSelectAssignee }: AssigneeListPanelProps) {
  const summaries = getAssigneeSummary(tasks);

  return (
    <Card className="overflow-hidden p-0">
      <div className="border-b border-slate-200/90 bg-gradient-to-r from-slate-50 to-white px-5 py-4 dark:border-slate-800 dark:from-slate-900 dark:to-slate-900">
        <div className="space-y-1">
          <h2 className="text-lg font-semibold text-slate-900 dark:text-white">담당자 조회</h2>
          <p className="text-sm text-slate-500 dark:text-slate-400">담당자별 업무량과 지연 현황을 바로 전환할 수 있습니다.</p>
        </div>
      </div>

      <div className="scroll-panel max-h-[calc(100vh-220px)] space-y-3 overflow-y-auto px-4 py-4">
        <button
          type="button"
          onClick={() => onSelectAssignee("")}
          className={`flex w-full items-center justify-between rounded-[24px] border px-4 py-3 text-left transition ${
            selectedAssignee === ""
              ? "border-brand-300 bg-brand-50 text-brand-700 dark:border-brand-700 dark:bg-brand-950/20 dark:text-brand-300"
              : "border-slate-200 bg-white text-slate-700 hover:border-slate-300 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-200"
          }`}
        >
          <div>
            <p className="font-semibold">전체 담당자</p>
            <p className="text-sm opacity-80">모든 담당자의 Task를 함께 봅니다.</p>
          </div>
          <span className="rounded-full bg-white/70 px-2.5 py-1 text-xs font-semibold dark:bg-slate-900">ALL</span>
        </button>

        {summaries.map((summary) => {
          const isActive = selectedAssignee === summary.assignee;

          return (
            <button
              key={summary.assignee}
              type="button"
              onClick={() => onSelectAssignee(summary.assignee)}
              className={`w-full rounded-[24px] border px-4 py-4 text-left transition ${
                isActive
                  ? "border-brand-300 bg-gradient-to-r from-brand-50 to-white shadow-[0_12px_30px_rgba(47,124,255,0.12)] dark:border-brand-700 dark:from-brand-950/20 dark:to-slate-950"
                  : "border-slate-200 bg-white hover:border-slate-300 hover:shadow-sm dark:border-slate-800 dark:bg-slate-950"
              }`}
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="font-semibold text-slate-900 dark:text-white">{summary.assignee}</p>
                  <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">전체 {summary.total}건, 완료 {summary.done}건</p>
                </div>
                <span className="rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-semibold text-slate-700 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200">
                  {summary.total}
                </span>
              </div>

              <div className="mt-4 grid grid-cols-2 gap-3 text-xs">
                <div className="rounded-2xl bg-slate-50 px-3 py-2 text-slate-600 dark:bg-slate-900 dark:text-slate-300">
                  지연 {summary.overdue}건
                </div>
                <div className="rounded-2xl bg-slate-50 px-3 py-2 text-slate-600 dark:bg-slate-900 dark:text-slate-300">
                  임박 {summary.dueSoon}건
                </div>
              </div>
            </button>
          );
        })}
      </div>
    </Card>
  );
}
