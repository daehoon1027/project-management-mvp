import { Card } from "@/components/ui/card";
import type { Department, Notification, User } from "@/types";

type SystemFoundationPanelProps = {
  users: User[];
  departments: Department[];
  notifications: Notification[];
};

export function SystemFoundationPanel({ users, departments, notifications }: SystemFoundationPanelProps) {
  const unreadCount = notifications.filter((notification) => !notification.isRead).length;

  return (
    <Card className="space-y-5">
      <div className="flex flex-col gap-2 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h2 className="text-lg font-semibold text-slate-900 dark:text-white">회사형 확장 기반</h2>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            사용자, 부서, 승인, 알림, 관리자 설정으로 이어질 수 있는 도메인 기초를 먼저 깔아둔 영역입니다.
          </p>
        </div>
        <span className="rounded-full border border-slate-200 px-3 py-1 text-xs font-semibold text-slate-600 dark:border-slate-700 dark:text-slate-300">
          내부 업무 시스템 준비
        </span>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <div className="rounded-3xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-900">
          <p className="text-sm text-slate-500 dark:text-slate-400">사용자</p>
          <p className="mt-2 text-3xl font-semibold text-slate-900 dark:text-white">{users.length}</p>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">역할 기반 권한 확장 가능</p>
        </div>
        <div className="rounded-3xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-900">
          <p className="text-sm text-slate-500 dark:text-slate-400">부서</p>
          <p className="mt-2 text-3xl font-semibold text-slate-900 dark:text-white">{departments.length}</p>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">부서별 프로젝트 필터링 준비</p>
        </div>
        <div className="rounded-3xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-900">
          <p className="text-sm text-slate-500 dark:text-slate-400">미확인 알림</p>
          <p className="mt-2 text-3xl font-semibold text-slate-900 dark:text-white">{unreadCount}</p>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">승인 요청, 마감 임박, 댓글 이벤트</p>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <div className="rounded-3xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-950">
          <h3 className="font-semibold text-slate-900 dark:text-white">관리자 확장 슬롯</h3>
          <ul className="mt-3 space-y-2 text-sm text-slate-600 dark:text-slate-300">
            <li>상태 워크플로우 관리</li>
            <li>우선순위/부서/역할 정책 관리</li>
            <li>사용자 및 조직 마스터 데이터 관리</li>
          </ul>
        </div>
        <div className="rounded-3xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-950">
          <h3 className="font-semibold text-slate-900 dark:text-white">DB 전환 준비</h3>
          <ul className="mt-3 space-y-2 text-sm text-slate-600 dark:text-slate-300">
            <li>Prisma 스키마 초안 포함</li>
            <li>User / Department / Project / Task / Comment / ActivityLog 모델 정의</li>
            <li>권한 체크 유틸과 알림 구조 분리</li>
          </ul>
        </div>
      </div>
    </Card>
  );
}
