"use client";

import { useMemo, useState } from "react";
import { PriorityBadge, StatusBadge } from "@/components/ui/badge";
import { formatDate, formatRelativeDateLabel } from "@/lib/utils";
import { useProjectStore } from "@/store/use-project-store";
import type { Task } from "@/types";

type TaskDetailDrawerProps = {
  task: Task | null;
  projectName?: string;
  isDatabaseMode?: boolean;
  onClose: () => void;
  onEdit: (taskId: string) => void;
  onDuplicate: (taskId: string) => void;
  onDelete: (taskId: string) => void;
  onAddComment: (taskId: string, body: string) => void;
};

export function TaskDetailDrawer({
  task,
  projectName,
  isDatabaseMode = false,
  onClose,
  onEdit,
  onDuplicate,
  onDelete,
  onAddComment,
}: TaskDetailDrawerProps) {
  const [commentBody, setCommentBody] = useState("");
  const comments = useProjectStore((state) => state.comments);
  const users = useProjectStore((state) => state.users);
  const activityLogs = useProjectStore((state) => state.activityLogs);

  const taskComments = useMemo(
    () =>
      task
        ? comments
            .filter((comment) => comment.taskId === task.id)
            .sort((left, right) => right.createdAt.localeCompare(left.createdAt))
        : [],
    [comments, task],
  );

  const taskLogs = useMemo(
    () =>
      task
        ? activityLogs
            .filter((log) => log.entityId === task.id || log.taskId === task.id)
            .sort((left, right) => right.createdAt.localeCompare(left.createdAt))
            .slice(0, 8)
        : [],
    [activityLogs, task],
  );

  if (!task) {
    return null;
  }

  return (
    <div className="fixed inset-y-0 right-0 z-40 w-full max-w-xl overflow-y-auto border-l border-slate-200 bg-white p-6 shadow-2xl dark:border-slate-800 dark:bg-slate-950">
      <div className="mb-6 flex items-start justify-between gap-4">
        <div className="space-y-3">
          <p className="text-sm text-slate-500 dark:text-slate-400">{projectName ?? "프로젝트 없음"}</p>
          <h2 className="text-2xl font-semibold text-slate-900 dark:text-white">{task.title}</h2>
          <div className="flex flex-wrap gap-2">
            <StatusBadge status={task.status} />
            <PriorityBadge priority={task.priority} />
            <span className="rounded-full border border-slate-200 px-3 py-1 text-xs font-semibold text-slate-600 dark:border-slate-700 dark:text-slate-300">
              승인 {task.approval.status}
            </span>
          </div>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="rounded-2xl border border-slate-200 px-3 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-900"
        >
          닫기
        </button>
      </div>

      <div className="space-y-5 text-sm">
        <section className="rounded-3xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-900">
          <h3 className="font-semibold text-slate-900 dark:text-white">기본 정보</h3>
          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            <div>
              <p className="text-slate-500 dark:text-slate-400">담당자</p>
              <p className="mt-1 text-slate-900 dark:text-white">{task.assignee || "미지정"}</p>
            </div>
            <div>
              <p className="text-slate-500 dark:text-slate-400">완료 여부</p>
              <p className="mt-1 text-slate-900 dark:text-white">{task.isCompleted ? "완료" : "미완료"}</p>
            </div>
            <div>
              <p className="text-slate-500 dark:text-slate-400">시작일</p>
              <p className="mt-1 text-slate-900 dark:text-white">{formatDate(task.startDate)}</p>
            </div>
            <div>
              <p className="text-slate-500 dark:text-slate-400">마감일</p>
              <p className="mt-1 text-slate-900 dark:text-white">
                {formatDate(task.dueDate)} / {formatRelativeDateLabel(task.dueDate)}
              </p>
            </div>
          </div>
        </section>

        <section className="rounded-3xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-900">
          <h3 className="font-semibold text-slate-900 dark:text-white">설명</h3>
          <p className="mt-3 whitespace-pre-wrap leading-6 text-slate-600 dark:text-slate-300">
            {task.description || "설명이 없습니다."}
          </p>
        </section>

        <section className="rounded-3xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-900">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-slate-900 dark:text-white">댓글</h3>
            <span className="text-xs text-slate-500 dark:text-slate-400">{taskComments.length}개</span>
          </div>
          <div className="mt-3 space-y-3">
            <textarea
              rows={3}
              value={commentBody}
              onChange={(event) => setCommentBody(event.target.value)}
              placeholder="작업 메모나 댓글을 남겨 보세요."
              className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 outline-none transition focus:border-brand-400 dark:border-slate-700 dark:bg-slate-950 dark:text-white"
            />
            <div className="flex items-center justify-between gap-3">
              {isDatabaseMode ? (
                <span className="text-xs text-slate-500 dark:text-slate-400">댓글은 DB에 저장됩니다.</span>
              ) : (
                <span className="text-xs text-slate-500 dark:text-slate-400">댓글은 현재 로컬 상태에 저장됩니다.</span>
              )}
              <button
                type="button"
                onClick={() => {
                  onAddComment(task.id, commentBody);
                  setCommentBody("");
                }}
                className="rounded-2xl bg-brand-500 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-brand-400"
              >
                댓글 등록
              </button>
            </div>
            <div className="space-y-3">
              {taskComments.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-slate-300 px-4 py-5 text-slate-500 dark:border-slate-700 dark:text-slate-400">
                  아직 댓글이 없습니다.
                </div>
              ) : (
                taskComments.map((comment) => {
                  const author = users.find((user) => user.id === comment.authorId);
                  return (
                    <article key={comment.id} className="rounded-2xl border border-slate-200 bg-white px-4 py-3 dark:border-slate-700 dark:bg-slate-950">
                      <div className="flex items-center justify-between gap-3">
                        <span className="font-semibold text-slate-900 dark:text-white">{author?.name ?? "작성자 없음"}</span>
                        <span className="text-xs text-slate-500 dark:text-slate-400">{formatDate(comment.createdAt)}</span>
                      </div>
                      <p className="mt-2 whitespace-pre-wrap text-slate-600 dark:text-slate-300">{comment.body}</p>
                    </article>
                  );
                })
              )}
            </div>
          </div>
        </section>

        <section className="rounded-3xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-900">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-slate-900 dark:text-white">활동 로그</h3>
            <span className="text-xs text-slate-500 dark:text-slate-400">{taskLogs.length}건</span>
          </div>
          <div className="mt-3 space-y-3">
            {taskLogs.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-slate-300 px-4 py-5 text-slate-500 dark:border-slate-700 dark:text-slate-400">
                아직 기록된 로그가 없습니다.
              </div>
            ) : (
              taskLogs.map((log) => {
                const actor = users.find((user) => user.id === log.actorId);
                return (
                  <article key={log.id} className="rounded-2xl border border-slate-200 bg-white px-4 py-3 dark:border-slate-700 dark:bg-slate-950">
                    <div className="flex items-center justify-between gap-3">
                      <span className="font-semibold text-slate-900 dark:text-white">{actor?.name ?? "시스템"}</span>
                      <span className="text-xs text-slate-500 dark:text-slate-400">{formatDate(log.createdAt)}</span>
                    </div>
                    <p className="mt-2 text-slate-600 dark:text-slate-300">{log.message}</p>
                  </article>
                );
              })
            )}
          </div>
        </section>

        <div className="flex flex-wrap gap-3">
          <button
            type="button"
            onClick={() => onEdit(task.id)}
            className="rounded-2xl bg-brand-500 px-4 py-3 text-sm font-semibold text-white transition hover:bg-brand-400"
          >
            수정
          </button>
          <button
            type="button"
            onClick={() => onDuplicate(task.id)}
            disabled={isDatabaseMode}
            className="rounded-2xl border border-slate-200 px-4 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-900"
          >
            복제
          </button>
          <button
            type="button"
            onClick={() => onDelete(task.id)}
            className="rounded-2xl border border-rose-200 px-4 py-3 text-sm font-semibold text-rose-600 transition hover:bg-rose-50 dark:border-rose-900 dark:hover:bg-rose-950/20"
          >
            삭제
          </button>
        </div>
      </div>
    </div>
  );
}
