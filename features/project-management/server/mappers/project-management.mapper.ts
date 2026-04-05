import { applyProjectProgress } from "@/lib/progress";
import type { ActivityLog, ApprovalInfo, ProjectColor, ProjectManagementSnapshot } from "@/types";
import type { ProjectRecord } from "@/server/repositories/project.repository";
import type { TaskRecord } from "@/server/repositories/task.repository";

type DepartmentRecord = Awaited<ReturnType<typeof import("@/server/repositories/user.repository").listDepartments>>[number];
type UserRecord = Awaited<ReturnType<typeof import("@/server/repositories/user.repository").listUsers>>[number];
type CommentRecord = Awaited<ReturnType<typeof import("@/server/repositories/comment.repository").listComments>>[number];
type NotificationRecord = Awaited<ReturnType<typeof import("@/server/repositories/notification.repository").listNotifications>>[number];
type ActivityLogRecord = Awaited<ReturnType<typeof import("@/server/repositories/activity-log.repository").listActivityLogs>>[number];

type WorkspaceRecords = {
  departments: DepartmentRecord[];
  users: UserRecord[];
  projects: ProjectRecord[];
  tasks: TaskRecord[];
  comments: CommentRecord[];
  notifications: NotificationRecord[];
  activityLogs: ActivityLogRecord[];
  currentUserId?: string | null;
};

function toIsoString(value: Date | null | undefined) {
  return value ? value.toISOString() : null;
}

function toDateInput(value: Date | null | undefined) {
  return value ? value.toISOString().slice(0, 10) : "";
}

function mapApprovalSummary(
  approvals: Array<{
    status: ApprovalInfo["status"];
    approverId: string | null;
    approvedAt: Date | null;
  }>,
): ApprovalInfo {
  const pendingApproval = approvals.find((approval) => approval.status === "pending");
  const approvedApproval = approvals.find((approval) => approval.status === "approved");
  const currentApproval = pendingApproval ?? approvedApproval ?? approvals[0];

  if (!currentApproval) {
    return {
      status: "not_required",
      approverId: null,
      approvedAt: null,
    };
  }

  return {
    status: currentApproval.status,
    approverId: currentApproval.approverId,
    approvedAt: toIsoString(currentApproval.approvedAt),
  };
}

export function buildProjectManagementSnapshot(records: WorkspaceRecords): ProjectManagementSnapshot {
  const users = records.users.map((user) => ({
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    departmentId: user.departmentId,
    title: user.title ?? "",
    isActive: user.isActive,
    createdAt: user.createdAt.toISOString(),
    updatedAt: user.updatedAt.toISOString(),
  }));

  const departments = records.departments.map((department) => ({
    id: department.id,
    name: department.name,
    code: department.code,
    description: department.description ?? "",
    createdAt: department.createdAt.toISOString(),
    updatedAt: department.updatedAt.toISOString(),
  }));

  const projects = records.projects.map((project) => ({
    id: project.id,
    name: project.name,
    description: project.description ?? "",
    parentId: project.parentId,
    depth: project.depth,
    progress: project.progress,
    color: project.color as ProjectColor,
    status: project.status,
    isFavorite: project.isFavorite,
    isArchived: project.isArchived,
    archivedAt: toIsoString(project.archivedAt),
    departmentId: project.departmentId,
    ownerId: project.ownerId,
    createdById: project.createdById,
    updatedById: project.updatedById,
    approval: mapApprovalSummary(project.approvals),
    createdAt: project.createdAt.toISOString(),
    updatedAt: project.updatedAt.toISOString(),
  }));

  const tasks = records.tasks.map((task) => ({
    id: task.id,
    projectId: task.projectId,
    parentTaskId: task.parentTaskId,
    title: task.title,
    description: task.description ?? "",
    assignee: task.assignee?.name ?? "",
    assigneeId: task.assigneeId,
    priority: task.priority,
    status: task.status,
    isCompleted: task.isCompleted,
    startDate: toDateInput(task.startDate),
    dueDate: toDateInput(task.dueDate),
    memo: task.memo ?? "",
    checklist: task.checklistItems.map((item) => ({
      id: item.id,
      text: item.text,
      isCompleted: item.isCompleted,
      createdAt: item.createdAt.toISOString(),
    })),
    approval: mapApprovalSummary(task.approvals),
    createdById: task.createdById,
    updatedById: task.updatedById,
    createdAt: task.createdAt.toISOString(),
    updatedAt: task.updatedAt.toISOString(),
  }));

  const comments = records.comments.map((comment) => ({
    id: comment.id,
    taskId: comment.taskId,
    authorId: comment.authorId,
    body: comment.body,
    createdAt: comment.createdAt.toISOString(),
    updatedAt: comment.updatedAt.toISOString(),
  }));

  const notifications = records.notifications.map((notification) => ({
    id: notification.id,
    type: notification.type,
    userId: notification.userId,
    title: notification.title,
    body: notification.body,
    isRead: notification.isRead,
    relatedEntityType: (notification.relatedEntityType ?? null) as ActivityLog["entityType"] | null,
    relatedEntityId: notification.relatedEntityId ?? null,
    createdAt: notification.createdAt.toISOString(),
  }));

  const activityLogs = records.activityLogs.map((log) => ({
    id: log.id,
    entityType: log.entityType as ActivityLog["entityType"],
    entityId: log.entityId,
    action: log.action,
    actorId: log.actorId,
    projectId: log.projectId,
    taskId: log.taskId,
    message: log.message,
    meta:
      typeof log.metadata === "object" && log.metadata !== null && !Array.isArray(log.metadata)
        ? (log.metadata as Record<string, string | number | boolean | null>)
        : undefined,
    createdAt: log.createdAt.toISOString(),
  }));

  const projectsWithRollup = applyProjectProgress(projects, tasks);
  const selectedProjectId =
    projectsWithRollup.find((project) => !project.isArchived && project.parentId === null)?.id ??
    projectsWithRollup.find((project) => !project.isArchived)?.id ??
    projectsWithRollup[0]?.id ??
    null;

  return {
    users,
    departments,
    comments,
    activityLogs,
    notifications,
    currentUserId: records.currentUserId ?? users[0]?.id ?? null,
    projects: projectsWithRollup,
    tasks,
    selectedProjectId,
    expandedProjectIds: projectsWithRollup
      .filter((project) => !project.isArchived && (project.parentId === null || project.depth === 2))
      .map((project) => project.id),
  };
}

