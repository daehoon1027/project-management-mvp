import type { ActivityLog, Comment, Department, Notification, User } from "@/types";

const now = "2026-04-02T09:00:00.000Z";

export const mockDepartments: Department[] = [
  {
    id: "dept-pmo",
    name: "PMO",
    code: "PMO",
    description: "전사 프로젝트 관리",
    createdAt: now,
    updatedAt: now,
  },
  {
    id: "dept-product",
    name: "제품개발본부",
    code: "PD",
    description: "제품 및 플랫폼 개발",
    createdAt: now,
    updatedAt: now,
  },
  {
    id: "dept-sales",
    name: "영업마케팅본부",
    code: "SM",
    description: "영업, 마케팅, 전시 운영",
    createdAt: now,
    updatedAt: now,
  },
  {
    id: "dept-support",
    name: "경영지원본부",
    code: "GS",
    description: "지원, 운영, ERP",
    createdAt: now,
    updatedAt: now,
  },
];

export const mockUsers: User[] = [
  {
    id: "user-admin",
    name: "김도윤",
    email: "admin@company.local",
    role: "admin",
    departmentId: "dept-pmo",
    title: "시스템 관리자",
    isActive: true,
    createdAt: now,
    updatedAt: now,
  },
  {
    id: "user-manager-product",
    name: "김민지",
    email: "minji@company.local",
    role: "manager",
    departmentId: "dept-product",
    title: "제품개발 팀장",
    isActive: true,
    createdAt: now,
    updatedAt: now,
  },
  {
    id: "user-manager-sales",
    name: "최유진",
    email: "yujin@company.local",
    role: "manager",
    departmentId: "dept-sales",
    title: "영업마케팅 팀장",
    isActive: true,
    createdAt: now,
    updatedAt: now,
  },
  {
    id: "user-member-1",
    name: "박주연",
    email: "juyeon@company.local",
    role: "member",
    departmentId: "dept-product",
    title: "콘텐츠 기획",
    isActive: true,
    createdAt: now,
    updatedAt: now,
  },
  {
    id: "user-member-2",
    name: "강유리",
    email: "yuri@company.local",
    role: "member",
    departmentId: "dept-support",
    title: "운영 담당",
    isActive: true,
    createdAt: now,
    updatedAt: now,
  },
];

export const mockComments: Comment[] = [
  {
    id: "comment-1",
    taskId: "task-simulator-ux",
    authorId: "user-manager-product",
    body: "와이어프레임 초안이 나오면 내부 검토 회의를 바로 잡겠습니다.",
    createdAt: now,
    updatedAt: now,
  },
  {
    id: "comment-2",
    taskId: "task-exhibition-booth",
    authorId: "user-manager-sales",
    body: "현지 시공사 견적 비교표를 다음 회의 전에 공유해주세요.",
    createdAt: now,
    updatedAt: now,
  },
];

export const mockActivityLogs: ActivityLog[] = [
  {
    id: "activity-1",
    entityType: "project",
    entityId: "project-2026-plan",
    action: "project.created",
    actorId: "user-admin",
    message: "2026 사업계획 프로젝트가 생성되었습니다.",
    createdAt: now,
  },
  {
    id: "activity-2",
    entityType: "task",
    entityId: "task-simulator-ux",
    action: "task.updated",
    actorId: "user-manager-product",
    message: "시뮬레이터 UX 리뉴얼 범위를 수정했습니다.",
    createdAt: now,
  },
];

export const mockNotifications: Notification[] = [
  {
    id: "notification-1",
    type: "approval_requested",
    userId: "user-manager-product",
    title: "승인 대기 Task",
    body: "신규 교육 시나리오 3종 시작 Task가 승인 대기 상태입니다.",
    isRead: false,
    relatedEntityType: "task",
    relatedEntityId: "task-simulator-content",
    createdAt: now,
  },
  {
    id: "notification-2",
    type: "due_soon",
    userId: "user-manager-sales",
    title: "마감 임박",
    body: "전시 부스 시안 확정 Task 마감이 2일 남았습니다.",
    isRead: false,
    relatedEntityType: "task",
    relatedEntityId: "task-exhibition-booth",
    createdAt: now,
  },
];
