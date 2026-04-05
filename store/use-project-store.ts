"use client";

import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import { MAX_PROJECT_DEPTH } from "@/lib/constants";
import { mockActivityLogs, mockComments, mockDepartments, mockNotifications, mockUsers } from "@/lib/mock-company-data";
import { applyProjectProgress } from "@/lib/progress";
import { getDescendantProjectIds } from "@/lib/project-tree";
import { getInitialData } from "@/lib/sample-data";
import { generateId } from "@/lib/utils";
import type {
  ActivityLog,
  ApprovalInfo,
  ChecklistItem,
  Comment,
  Department,
  Notification,
  Project,
  ProjectColor,
  ProjectManagementSnapshot,
  ProjectInput,
  ProjectStatus,
  Task,
  TaskInput,
  TaskPatch,
  TaskStatus,
  User,
} from "@/types";

type ActionResult = {
  ok: boolean;
  message?: string;
  projectId?: string;
  taskId?: string;
};

type ProjectState = {
  users: User[];
  departments: Department[];
  comments: Comment[];
  activityLogs: ActivityLog[];
  notifications: Notification[];
  currentUserId: string | null;
  projects: Project[];
  tasks: Task[];
  selectedProjectId: string | null;
  expandedProjectIds: string[];
  syncWorkspaceData: (snapshot: ProjectManagementSnapshot) => void;
  selectProject: (projectId: string) => void;
  toggleProjectExpanded: (projectId: string) => void;
  setCurrentUser: (userId: string) => void;
  markNotificationRead: (notificationId: string) => void;
  createProject: (input: ProjectInput) => ActionResult;
  updateProject: (projectId: string, input: Pick<ProjectInput, "name" | "description" | "color">) => ActionResult;
  deleteProject: (projectId: string) => void;
  duplicateProject: (projectId: string) => ActionResult;
  toggleProjectFavorite: (projectId: string) => void;
  archiveProject: (projectId: string) => void;
  restoreProject: (projectId: string) => void;
  createTask: (projectId: string, input: TaskInput) => ActionResult;
  updateTask: (taskId: string, input: TaskInput) => ActionResult;
  patchTask: (taskId: string, patch: TaskPatch) => ActionResult;
  deleteTask: (taskId: string) => void;
  duplicateTask: (taskId: string) => ActionResult;
  toggleTaskCompleted: (taskId: string) => void;
  bulkUpdateTasks: (taskIds: string[], patch: Pick<TaskPatch, "status" | "priority" | "assignee" | "assigneeId" | "isCompleted">) => void;
  addChecklistItem: (taskId: string, text: string) => void;
  updateChecklistItem: (taskId: string, itemId: string, patch: Partial<ChecklistItem>) => void;
  deleteChecklistItem: (taskId: string, itemId: string) => void;
  createSubtask: (parentTaskId: string, title?: string) => ActionResult;
  addComment: (taskId: string, body: string) => void;
};

const defaultProjectColor: ProjectColor = "blue";
const defaultProjectStatus: ProjectStatus = "active";

function getNow() {
  return new Date().toISOString();
}

function defaultApproval(): ApprovalInfo {
  return {
    status: "not_required",
    approverId: null,
    approvedAt: null,
  };
}

function getAncestorProjectIds(projects: Project[], projectId: string | null): string[] {
  if (!projectId) return [];
  const current = projects.find((project) => project.id === projectId);
  if (!current) return [];
  return [current.id, ...getAncestorProjectIds(projects, current.parentId)];
}

function getTaskDescendantIds(tasks: Task[], taskId: string): string[] {
  const childIds = tasks.filter((task) => task.parentTaskId === taskId).map((task) => task.id);
  return childIds.flatMap((childId) => [childId, ...getTaskDescendantIds(tasks, childId)]);
}

function normalizeTaskStatus(isCompleted: boolean, status: TaskStatus): TaskStatus {
  if (isCompleted) return "done";
  if (status === "done") return "planned";
  return status;
}

function normalizeProject(
  project: Partial<Project> &
    Pick<Project, "id" | "name" | "description" | "parentId" | "depth" | "createdAt" | "updatedAt">,
): Project {
  return {
    ...project,
    progress: project.progress ?? 0,
    color: project.color ?? defaultProjectColor,
    status: project.status ?? defaultProjectStatus,
    isFavorite: project.isFavorite ?? false,
    isArchived: project.isArchived ?? false,
    archivedAt: project.archivedAt ?? null,
    departmentId: project.departmentId ?? null,
    ownerId: project.ownerId ?? null,
    createdById: project.createdById ?? null,
    updatedById: project.updatedById ?? null,
    approval: project.approval ?? defaultApproval(),
  };
}

function normalizeChecklist(checklist: ChecklistItem[] | undefined, now = getNow()) {
  return (checklist ?? []).map((item) => ({
    id: item.id ?? generateId("checklist"),
    text: item.text ?? "",
    isCompleted: Boolean(item.isCompleted),
    createdAt: item.createdAt ?? now,
  }));
}

function normalizeTask(input: TaskInput | TaskPatch, currentTask?: Task): TaskPatch {
  const merged = { ...currentTask, ...input };
  const nextCompleted = Boolean(merged.isCompleted || merged.status === "done");

  return {
    ...input,
    parentTaskId: merged.parentTaskId ?? null,
    assigneeId: merged.assigneeId ?? null,
    checklist: normalizeChecklist(merged.checklist, currentTask?.updatedAt ?? getNow()),
    approval: merged.approval ?? defaultApproval(),
    createdById: merged.createdById ?? currentTask?.createdById ?? null,
    updatedById: merged.updatedById ?? currentTask?.updatedById ?? null,
    isCompleted: nextCompleted,
    status: normalizeTaskStatus(nextCompleted, merged.status ?? "planned"),
  };
}

function hydrateTask(task: Task): Task {
  return {
    ...task,
    parentTaskId: task.parentTaskId ?? null,
    assigneeId: task.assigneeId ?? null,
    memo: task.memo ?? "",
    checklist: normalizeChecklist(task.checklist, task.createdAt),
    approval: task.approval ?? defaultApproval(),
    createdById: task.createdById ?? null,
    updatedById: task.updatedById ?? null,
  };
}

function recalculateProjects(projects: Project[], tasks: Task[], touchedProjectIds: string[] = []) {
  const touched = new Set(touchedProjectIds);
  const now = getNow();

  return applyProjectProgress(projects, tasks).map((project) =>
    touched.has(project.id) ? { ...project, updatedAt: now } : project,
  );
}

function createActivityLog(
  entityType: ActivityLog["entityType"],
  entityId: string,
  action: string,
  message: string,
  actorId: string | null,
): ActivityLog {
  return {
    id: generateId("activity"),
    entityType,
    entityId,
    action,
    actorId,
    message,
    createdAt: getNow(),
  };
}

function createNotification(
  type: Notification["type"],
  title: string,
  body: string,
  userId: string | null,
  relatedEntityType: Notification["relatedEntityType"],
  relatedEntityId: string | null,
): Notification {
  return {
    id: generateId("notification"),
    type,
    title,
    body,
    userId,
    isRead: false,
    relatedEntityType,
    relatedEntityId,
    createdAt: getNow(),
  };
}

function createFallbackSnapshot(): ProjectManagementSnapshot {
  const fallback = getInitialData();

  return {
    users: mockUsers,
    departments: mockDepartments,
    comments: mockComments,
    activityLogs: mockActivityLogs,
    notifications: mockNotifications,
    currentUserId: "user-admin",
    projects: fallback.projects,
    tasks: fallback.tasks,
    selectedProjectId: fallback.selectedProjectId,
    expandedProjectIds: fallback.expandedProjectIds,
  };
}

function normalizeWorkspaceSnapshot(snapshot: ProjectManagementSnapshot): ProjectManagementSnapshot {
  const projects = snapshot.projects.map((project) =>
    normalizeProject({ ...project, createdAt: project.createdAt, updatedAt: project.updatedAt }),
  );
  const tasks = snapshot.tasks.map((task) => hydrateTask(task));

  return {
    users: snapshot.users,
    departments: snapshot.departments,
    comments: snapshot.comments,
    activityLogs: snapshot.activityLogs,
    notifications: snapshot.notifications,
    currentUserId: snapshot.currentUserId,
    projects: recalculateProjects(projects, tasks),
    tasks,
    selectedProjectId: snapshot.selectedProjectId,
    expandedProjectIds: snapshot.expandedProjectIds,
  };
}

function hydratePersistedState(state: Partial<ProjectState> | undefined, fallback: ProjectManagementSnapshot) {
  return normalizeWorkspaceSnapshot({
    users: state?.users ?? fallback.users,
    departments: state?.departments ?? fallback.departments,
    comments: state?.comments ?? fallback.comments,
    activityLogs: state?.activityLogs ?? fallback.activityLogs,
    notifications: state?.notifications ?? fallback.notifications,
    currentUserId: state?.currentUserId ?? fallback.currentUserId,
    projects: state?.projects ?? fallback.projects,
    tasks: state?.tasks ?? fallback.tasks,
    selectedProjectId: state?.selectedProjectId ?? fallback.selectedProjectId,
    expandedProjectIds: state?.expandedProjectIds ?? fallback.expandedProjectIds,
  });
}

const fallbackSnapshot = createFallbackSnapshot();
const initialData = hydratePersistedState(undefined, fallbackSnapshot);

function duplicateProjectTree(projects: Project[], tasks: Task[], rootProjectId: string, currentUserId: string | null) {
  const rootProject = projects.find((project) => project.id === rootProjectId);
  if (!rootProject) {
    return null;
  }

  const projectIds = [rootProjectId, ...getDescendantProjectIds(projects, rootProjectId)];
  const projectMap = new Map<string, string>();
  const taskMap = new Map<string, string>();
  const now = getNow();

  for (const projectId of projectIds) {
    projectMap.set(projectId, generateId("project"));
  }

  const duplicatedProjects = projects
    .filter((project) => projectIds.includes(project.id))
    .map((project) =>
      normalizeProject({
        ...project,
        id: projectMap.get(project.id)!,
        name: project.id === rootProjectId ? `${project.name} 복제본` : project.name,
        parentId: project.parentId && projectMap.has(project.parentId) ? projectMap.get(project.parentId)! : project.parentId,
        progress: 0,
        isArchived: false,
        archivedAt: null,
        createdById: currentUserId,
        updatedById: currentUserId,
        createdAt: now,
        updatedAt: now,
      }),
    );

  const sourceTasks = tasks.filter((task) => projectIds.includes(task.projectId));
  for (const task of sourceTasks) {
    taskMap.set(task.id, generateId("task"));
  }

  const duplicatedTasks = sourceTasks.map((task) =>
    hydrateTask({
      ...task,
      id: taskMap.get(task.id)!,
      projectId: projectMap.get(task.projectId)!,
      parentTaskId: task.parentTaskId && taskMap.has(task.parentTaskId) ? taskMap.get(task.parentTaskId)! : null,
      title: task.parentTaskId ? task.title : `${task.title} 복제본`,
      checklist: task.checklist.map((item) => ({
        ...item,
        id: generateId("checklist"),
        createdAt: now,
      })),
      createdById: currentUserId,
      updatedById: currentUserId,
      createdAt: now,
      updatedAt: now,
    }),
  );

  return {
    duplicatedProjects,
    duplicatedTasks,
    rootProjectId: projectMap.get(rootProjectId)!,
    touchedProjectIds: [projectMap.get(rootProjectId)!, ...getAncestorProjectIds(projects, rootProject.parentId)],
  };
}

function cascadeTaskCompletion(tasks: Task[], taskId: string, isCompleted: boolean, actorId: string | null) {
  const ids = new Set([taskId, ...getTaskDescendantIds(tasks, taskId)]);
  const now = getNow();

  return tasks.map((task) =>
    ids.has(task.id)
      ? {
          ...task,
          isCompleted,
          status: normalizeTaskStatus(isCompleted, task.status),
          checklist: task.checklist.map((item) => ({ ...item, isCompleted })),
          updatedById: actorId,
          updatedAt: now,
        }
      : task,
  );
}

export const useProjectStore = create<ProjectState>()(
  persist(
    (set, get) => ({
      ...initialData,
      syncWorkspaceData: (snapshot) => set(normalizeWorkspaceSnapshot(snapshot)),
      setCurrentUser: (userId) => set({ currentUserId: userId }),
      markNotificationRead: (notificationId) =>
        set((state) => ({
          notifications: state.notifications.map((notification) =>
            notification.id === notificationId ? { ...notification, isRead: true } : notification,
          ),
        })),
      selectProject: (projectId) => set({ selectedProjectId: projectId }),
      toggleProjectExpanded: (projectId) =>
        set((state) => ({
          expandedProjectIds: state.expandedProjectIds.includes(projectId)
            ? state.expandedProjectIds.filter((id) => id !== projectId)
            : [...state.expandedProjectIds, projectId],
        })),
      createProject: (input) => {
        const state = get();
        const parentProject = input.parentId ? state.projects.find((project) => project.id === input.parentId) : null;
        const name = input.name.trim();
        const description = input.description.trim();

        if (!name) {
          return { ok: false, message: "프로젝트 이름을 입력해주세요." };
        }

        if (parentProject && parentProject.depth >= MAX_PROJECT_DEPTH) {
          return { ok: false, message: "프로젝트는 최대 4단계까지만 생성할 수 있습니다." };
        }

        const now = getNow();
        const nextProject = normalizeProject({
          id: generateId("project"),
          name,
          description,
          parentId: input.parentId,
          depth: parentProject ? parentProject.depth + 1 : 1,
          progress: 0,
          color: input.color ?? parentProject?.color ?? defaultProjectColor,
          status: "active",
          departmentId: parentProject?.departmentId ?? null,
          ownerId: state.currentUserId,
          createdById: state.currentUserId,
          updatedById: state.currentUserId,
          approval: defaultApproval(),
          createdAt: now,
          updatedAt: now,
        });

        set({
          projects: recalculateProjects([...state.projects, nextProject], state.tasks, [
            nextProject.id,
            ...getAncestorProjectIds(state.projects, input.parentId),
          ]),
          selectedProjectId: nextProject.id,
          expandedProjectIds: Array.from(
            new Set([...state.expandedProjectIds, nextProject.id, ...(input.parentId ? [input.parentId] : [])]),
          ),
          activityLogs: [
            createActivityLog("project", nextProject.id, "project.created", `${nextProject.name} 프로젝트를 생성했습니다.`, state.currentUserId),
            ...state.activityLogs,
          ],
        });

        return { ok: true, projectId: nextProject.id };
      },
      updateProject: (projectId, input) => {
        const state = get();
        const targetProject = state.projects.find((project) => project.id === projectId);
        const name = input.name.trim();

        if (!targetProject) {
          return { ok: false, message: "프로젝트를 찾을 수 없습니다." };
        }

        if (!name) {
          return { ok: false, message: "프로젝트 이름을 입력해주세요." };
        }

        set({
          projects: recalculateProjects(
            state.projects.map((project) =>
              project.id === projectId
                ? {
                    ...project,
                    name,
                    description: input.description.trim(),
                    color: input.color ?? project.color,
                    updatedById: state.currentUserId,
                    updatedAt: getNow(),
                  }
                : project,
            ),
            state.tasks,
            [projectId],
          ),
          activityLogs: [
            createActivityLog("project", projectId, "project.updated", `${targetProject.name} 프로젝트 정보를 수정했습니다.`, state.currentUserId),
            ...state.activityLogs,
          ],
        });

        return { ok: true, projectId };
      },
      deleteProject: (projectId) =>
        set((state) => {
          const targetProject = state.projects.find((project) => project.id === projectId);
          const descendantIds = getDescendantProjectIds(state.projects, projectId);
          const projectIdsToDelete = new Set([projectId, ...descendantIds]);
          const remainingProjects = state.projects.filter((project) => !projectIdsToDelete.has(project.id));
          const remainingTasks = state.tasks.filter((task) => !projectIdsToDelete.has(task.projectId));
          const nextProjects = recalculateProjects(
            remainingProjects,
            remainingTasks,
            getAncestorProjectIds(remainingProjects, targetProject?.parentId ?? null),
          );

          return {
            projects: nextProjects,
            tasks: remainingTasks,
            comments: state.comments.filter((comment) => remainingTasks.some((task) => task.id === comment.taskId)),
            activityLogs: [
              createActivityLog("project", projectId, "project.deleted", `${targetProject?.name ?? "프로젝트"}를 삭제했습니다.`, state.currentUserId),
              ...state.activityLogs,
            ],
            selectedProjectId:
              state.selectedProjectId && !projectIdsToDelete.has(state.selectedProjectId)
                ? state.selectedProjectId
                : targetProject?.parentId ?? nextProjects.find((project) => !project.isArchived)?.id ?? nextProjects[0]?.id ?? null,
            expandedProjectIds: state.expandedProjectIds.filter((id) => !projectIdsToDelete.has(id)),
          };
        }),
      duplicateProject: (projectId) => {
        const state = get();
        const duplicated = duplicateProjectTree(state.projects, state.tasks, projectId, state.currentUserId);

        if (!duplicated) {
          return { ok: false, message: "복제할 프로젝트를 찾을 수 없습니다." };
        }

        const nextProjects = [...state.projects, ...duplicated.duplicatedProjects];
        const nextTasks = [...state.tasks, ...duplicated.duplicatedTasks];

        set({
          projects: recalculateProjects(nextProjects, nextTasks, duplicated.touchedProjectIds),
          tasks: nextTasks,
          selectedProjectId: duplicated.rootProjectId,
          expandedProjectIds: Array.from(new Set([...state.expandedProjectIds, duplicated.rootProjectId])),
          activityLogs: [
            createActivityLog("project", duplicated.rootProjectId, "project.duplicated", "프로젝트 트리를 복제했습니다.", state.currentUserId),
            ...state.activityLogs,
          ],
        });

        return { ok: true, projectId: duplicated.rootProjectId };
      },
      toggleProjectFavorite: (projectId) =>
        set((state) => ({
          projects: state.projects.map((project) =>
            project.id === projectId
              ? { ...project, isFavorite: !project.isFavorite, updatedById: state.currentUserId, updatedAt: getNow() }
              : project,
          ),
        })),
      archiveProject: (projectId) =>
        set((state) => {
          const ids = new Set([projectId, ...getDescendantProjectIds(state.projects, projectId)]);
          const now = getNow();

          return {
            projects: state.projects.map((project) =>
              ids.has(project.id)
                ? { ...project, isArchived: true, archivedAt: now, updatedById: state.currentUserId, updatedAt: now }
                : project,
            ),
            activityLogs: [
              createActivityLog("project", projectId, "project.archived", "프로젝트를 아카이브했습니다.", state.currentUserId),
              ...state.activityLogs,
            ],
            selectedProjectId:
              state.selectedProjectId && ids.has(state.selectedProjectId)
                ? state.projects.find((project) => !project.isArchived && !ids.has(project.id))?.id ?? null
                : state.selectedProjectId,
          };
        }),
      restoreProject: (projectId) =>
        set((state) => {
          const ids = new Set([projectId, ...getDescendantProjectIds(state.projects, projectId)]);
          const now = getNow();

          return {
            projects: state.projects.map((project) =>
              ids.has(project.id)
                ? { ...project, isArchived: false, archivedAt: null, updatedById: state.currentUserId, updatedAt: now }
                : project,
            ),
            activityLogs: [
              createActivityLog("project", projectId, "project.restored", "프로젝트를 복원했습니다.", state.currentUserId),
              ...state.activityLogs,
            ],
            selectedProjectId: state.selectedProjectId ?? projectId,
          };
        }),
      createTask: (projectId, input) => {
        const state = get();
        const title = input.title.trim();

        if (!title) {
          return { ok: false, message: "Task 제목을 입력해주세요." };
        }

        const normalizedInput = normalizeTask(input) as TaskInput;
        const now = getNow();
        const nextTask = hydrateTask({
          id: generateId("task"),
          projectId,
          parentTaskId: normalizedInput.parentTaskId ?? null,
          title,
          description: normalizedInput.description.trim(),
          assignee: normalizedInput.assignee.trim(),
          assigneeId: normalizedInput.assigneeId ?? null,
          priority: normalizedInput.priority,
          status: normalizedInput.status,
          isCompleted: normalizedInput.isCompleted,
          startDate: normalizedInput.startDate,
          dueDate: normalizedInput.dueDate,
          memo: normalizedInput.memo.trim(),
          checklist: normalizedInput.checklist ?? [],
          approval: normalizedInput.approval ?? defaultApproval(),
          createdById: state.currentUserId,
          updatedById: state.currentUserId,
          createdAt: now,
          updatedAt: now,
        });
        const nextTasks = [...state.tasks, nextTask];

        set({
          tasks: nextTasks,
          projects: recalculateProjects(state.projects, nextTasks, getAncestorProjectIds(state.projects, projectId)),
          activityLogs: [
            createActivityLog("task", nextTask.id, "task.created", `${nextTask.title} Task를 생성했습니다.`, state.currentUserId),
            ...state.activityLogs,
          ],
        });

        return { ok: true, taskId: nextTask.id };
      },
      updateTask: (taskId, input) => get().patchTask(taskId, input),
      patchTask: (taskId, patch) => {
        const state = get();
        const currentTask = state.tasks.find((task) => task.id === taskId);
        if (!currentTask) {
          return { ok: false, message: "수정할 Task를 찾을 수 없습니다." };
        }

        const normalizedPatch = normalizeTask(patch, currentTask);
        const nextTasks = state.tasks.map((task) =>
          task.id === taskId
            ? hydrateTask({
                ...task,
                ...normalizedPatch,
                title: (normalizedPatch.title ?? task.title).trim(),
                description: (normalizedPatch.description ?? task.description).trim(),
                assignee: (normalizedPatch.assignee ?? task.assignee).trim(),
                assigneeId: normalizedPatch.assigneeId ?? task.assigneeId,
                memo: (normalizedPatch.memo ?? task.memo).trim(),
                updatedById: state.currentUserId,
                updatedAt: getNow(),
              })
            : task,
        );

        set({
          tasks: nextTasks,
          projects: recalculateProjects(state.projects, nextTasks, getAncestorProjectIds(state.projects, currentTask.projectId)),
          activityLogs: [
            createActivityLog("task", taskId, "task.updated", `${currentTask.title} Task를 수정했습니다.`, state.currentUserId),
            ...state.activityLogs,
          ],
          notifications:
            patch.assigneeId !== undefined && patch.assigneeId && patch.assigneeId !== currentTask.assigneeId
              ? [
                  createNotification("assignee_changed", "담당자 변경", `${currentTask.title} 담당자가 변경되었습니다.`, patch.assigneeId, "task", taskId),
                  ...state.notifications,
                ]
              : state.notifications,
        });

        return { ok: true, taskId };
      },
      deleteTask: (taskId) =>
        set((state) => {
          const task = state.tasks.find((item) => item.id === taskId);
          const idsToDelete = new Set([taskId, ...getTaskDescendantIds(state.tasks, taskId)]);
          const nextTasks = state.tasks.filter((item) => !idsToDelete.has(item.id));

          return {
            tasks: nextTasks,
            comments: state.comments.filter((comment) => nextTasks.some((item) => item.id === comment.taskId)),
            projects: recalculateProjects(state.projects, nextTasks, getAncestorProjectIds(state.projects, task?.projectId ?? null)),
            activityLogs: [
              createActivityLog("task", taskId, "task.deleted", `${task?.title ?? "Task"}를 삭제했습니다.`, state.currentUserId),
              ...state.activityLogs,
            ],
          };
        }),
      duplicateTask: (taskId) => {
        const state = get();
        const task = state.tasks.find((item) => item.id === taskId);

        if (!task) {
          return { ok: false, message: "복제할 Task를 찾을 수 없습니다." };
        }

        const descendantIds = getTaskDescendantIds(state.tasks, taskId);
        const sourceTasks = state.tasks.filter((item) => item.id === taskId || descendantIds.includes(item.id));
        const taskMap = new Map<string, string>();
        const now = getNow();

        for (const sourceTask of sourceTasks) {
          taskMap.set(sourceTask.id, generateId("task"));
        }

        const duplicatedTasks = sourceTasks.map((sourceTask) =>
          hydrateTask({
            ...sourceTask,
            id: taskMap.get(sourceTask.id)!,
            parentTaskId:
              sourceTask.parentTaskId && taskMap.has(sourceTask.parentTaskId)
                ? taskMap.get(sourceTask.parentTaskId)!
                : sourceTask.parentTaskId,
            title: sourceTask.id === taskId ? `${sourceTask.title} 복제본` : sourceTask.title,
            checklist: sourceTask.checklist.map((item) => ({ ...item, id: generateId("checklist"), createdAt: now })),
            createdById: state.currentUserId,
            updatedById: state.currentUserId,
            createdAt: now,
            updatedAt: now,
          }),
        );

        const nextTasks = [...state.tasks, ...duplicatedTasks];
        set({
          tasks: nextTasks,
          projects: recalculateProjects(state.projects, nextTasks, getAncestorProjectIds(state.projects, task.projectId)),
          activityLogs: [
            createActivityLog("task", taskMap.get(taskId)!, "task.duplicated", `${task.title} Task를 복제했습니다.`, state.currentUserId),
            ...state.activityLogs,
          ],
        });

        return { ok: true, taskId: taskMap.get(taskId)! };
      },
      toggleTaskCompleted: (taskId) =>
        set((state) => {
          const task = state.tasks.find((item) => item.id === taskId);
          if (!task) {
            return state;
          }

          const nextTasks = cascadeTaskCompletion(state.tasks, taskId, !task.isCompleted, state.currentUserId);
          return {
            tasks: nextTasks,
            projects: recalculateProjects(state.projects, nextTasks, getAncestorProjectIds(state.projects, task.projectId)),
            activityLogs: [
              createActivityLog("task", taskId, "task.completed", `${task.title} 완료 여부를 변경했습니다.`, state.currentUserId),
              ...state.activityLogs,
            ],
          };
        }),
      bulkUpdateTasks: (taskIds, patch) =>
        set((state) => {
          const ids = new Set(taskIds);
          const touchedProjectIds = new Set<string>();
          const now = getNow();

          const nextTasks = state.tasks.map((task) => {
            if (!ids.has(task.id)) {
              return task;
            }

            touchedProjectIds.add(task.projectId);
            const nextCompleted = patch.isCompleted ?? (patch.status ? patch.status === "done" : task.isCompleted);
            const nextStatus = patch.status
              ? normalizeTaskStatus(nextCompleted, patch.status)
              : normalizeTaskStatus(nextCompleted, task.status);

            return {
              ...task,
              assignee: patch.assignee ?? task.assignee,
              assigneeId: patch.assigneeId ?? task.assigneeId,
              priority: patch.priority ?? task.priority,
              isCompleted: nextCompleted,
              status: nextStatus,
              updatedById: state.currentUserId,
              updatedAt: now,
            };
          });

          return {
            tasks: nextTasks,
            projects: recalculateProjects(
              state.projects,
              nextTasks,
              [...touchedProjectIds].flatMap((projectId) => getAncestorProjectIds(state.projects, projectId)),
            ),
            activityLogs: [
              createActivityLog("task", taskIds[0] ?? "bulk", "task.bulk_updated", `${taskIds.length}건의 Task를 일괄 수정했습니다.`, state.currentUserId),
              ...state.activityLogs,
            ],
          };
        }),
      addChecklistItem: (taskId, text) =>
        set((state) => ({
          tasks: state.tasks.map((task) =>
            task.id === taskId
              ? {
                  ...task,
                  checklist: [...task.checklist, { id: generateId("checklist"), text: text.trim(), isCompleted: false, createdAt: getNow() }],
                  updatedById: state.currentUserId,
                  updatedAt: getNow(),
                }
              : task,
          ),
        })),
      updateChecklistItem: (taskId, itemId, patch) =>
        set((state) => ({
          tasks: state.tasks.map((task) =>
            task.id === taskId
              ? {
                  ...task,
                  checklist: task.checklist.map((item) => (item.id === itemId ? { ...item, ...patch, text: patch.text ?? item.text } : item)),
                  updatedById: state.currentUserId,
                  updatedAt: getNow(),
                }
              : task,
          ),
        })),
      deleteChecklistItem: (taskId, itemId) =>
        set((state) => ({
          tasks: state.tasks.map((task) =>
            task.id === taskId
              ? {
                  ...task,
                  checklist: task.checklist.filter((item) => item.id !== itemId),
                  updatedById: state.currentUserId,
                  updatedAt: getNow(),
                }
              : task,
          ),
        })),
      createSubtask: (parentTaskId, title = "새 서브태스크") => {
        const state = get();
        const parentTask = state.tasks.find((task) => task.id === parentTaskId);

        if (!parentTask) {
          return { ok: false, message: "상위 Task를 찾을 수 없습니다." };
        }

        const now = getNow();
        const nextTask = hydrateTask({
          id: generateId("task"),
          projectId: parentTask.projectId,
          parentTaskId,
          title: title.trim(),
          description: "",
          assignee: parentTask.assignee,
          assigneeId: parentTask.assigneeId,
          priority: parentTask.priority,
          status: "planned",
          isCompleted: false,
          startDate: parentTask.startDate,
          dueDate: parentTask.dueDate,
          memo: "",
          checklist: [],
          approval: defaultApproval(),
          createdById: state.currentUserId,
          updatedById: state.currentUserId,
          createdAt: now,
          updatedAt: now,
        });

        const nextTasks = [...state.tasks, nextTask];
        set({
          tasks: nextTasks,
          projects: recalculateProjects(state.projects, nextTasks, getAncestorProjectIds(state.projects, parentTask.projectId)),
          activityLogs: [
            createActivityLog("task", nextTask.id, "task.subtask_created", `${parentTask.title}에 서브태스크를 추가했습니다.`, state.currentUserId),
            ...state.activityLogs,
          ],
        });

        return { ok: true, taskId: nextTask.id };
      },
      addComment: (taskId, body) =>
        set((state) => {
          const trimmed = body.trim();
          if (!trimmed || !state.currentUserId) {
            return state;
          }

          const task = state.tasks.find((item) => item.id === taskId);
          const nextComment: Comment = {
            id: generateId("comment"),
            taskId,
            authorId: state.currentUserId,
            body: trimmed,
            createdAt: getNow(),
            updatedAt: getNow(),
          };

          return {
            comments: [nextComment, ...state.comments],
            activityLogs: [
              createActivityLog("comment", nextComment.id, "comment.created", `${task?.title ?? "Task"}에 댓글을 남겼습니다.`, state.currentUserId),
              ...state.activityLogs,
            ],
            notifications: task?.assigneeId
              ? [
                  createNotification("comment_added", "새 댓글", `${task.title}에 새 댓글이 등록되었습니다.`, task.assigneeId, "task", taskId),
                  ...state.notifications,
                ]
              : state.notifications,
          };
        }),
    }),
    {
      name: "project-management-company-storage",
      version: 2,
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        users: state.users,
        departments: state.departments,
        comments: state.comments,
        activityLogs: state.activityLogs,
        notifications: state.notifications,
        currentUserId: state.currentUserId,
        projects: state.projects,
        tasks: state.tasks,
        selectedProjectId: state.selectedProjectId,
        expandedProjectIds: state.expandedProjectIds,
      }),
      migrate: (persistedState) => hydratePersistedState(persistedState as Partial<ProjectState>, fallbackSnapshot),
      merge: (persistedState, currentState) => ({
        ...currentState,
        ...hydratePersistedState(persistedState as Partial<ProjectState>, fallbackSnapshot),
      }),
    },
  ),
);
