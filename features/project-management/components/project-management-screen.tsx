"use client";

import { useEffect, useMemo, useTransition, type SetStateAction } from "react";
import { useRouter } from "next/navigation";
import { Dashboard } from "@/components/dashboard";
import { ProjectDetail } from "@/components/project-detail";
import { ProjectForm } from "@/components/project-form";
import { ProjectTree } from "@/components/project-tree";
import { SystemFoundationPanel } from "@/components/system-foundation-panel";
import { TaskDetailDrawer } from "@/components/task-detail-drawer";
import { TaskForm } from "@/components/task-form";
import { ThemeToggle } from "@/components/theme-toggle";
import { TodayFocus } from "@/components/today-focus";
import { Modal } from "@/components/ui/modal";
import { createProjectAction, deleteProjectAction, updateProjectAction } from "@/features/project-management/server/actions/project-actions";
import { addCommentAction, createTaskAction, deleteTaskAction, updateTaskAction } from "@/features/project-management/server/actions/task-actions";
import type { ProjectManagementPageData } from "@/features/project-management/server/dto/project-management.dto";
import { useProjectManagementUiStore } from "@/features/project-management/store/use-project-management-ui-store";
import { downloadTasksCsv } from "@/lib/export";
import { useMounted } from "@/hooks/use-mounted";
import { useTheme } from "@/hooks/use-theme";
import { useProjectStore } from "@/store/use-project-store";
import type { ProjectInput, TaskFilters, TaskInput, TaskPatch } from "@/types";

type ProjectManagementScreenProps = {
  pageData: ProjectManagementPageData;
};

type MutationResult = {
  ok: boolean;
  message?: string;
};

export function ProjectManagementScreen({ pageData }: ProjectManagementScreenProps) {
  const mounted = useMounted();
  const router = useRouter();
  const [isMutating, startTransition] = useTransition();
  const isDatabaseMode = pageData.source === "database";
  const { isDarkMode, toggleTheme } = useTheme();
  const syncWorkspaceData = useProjectStore((state) => state.syncWorkspaceData);

  const projectFormState = useProjectManagementUiStore((state) => state.projectFormState);
  const taskFormState = useProjectManagementUiStore((state) => state.taskFormState);
  const taskFilters = useProjectManagementUiStore((state) => state.taskFilters);
  const detailTaskId = useProjectManagementUiStore((state) => state.detailTaskId);
  const openRootProjectForm = useProjectManagementUiStore((state) => state.openRootProjectForm);
  const openChildProjectForm = useProjectManagementUiStore((state) => state.openChildProjectForm);
  const openEditProjectForm = useProjectManagementUiStore((state) => state.openEditProjectForm);
  const closeProjectForm = useProjectManagementUiStore((state) => state.closeProjectForm);
  const openCreateTaskForm = useProjectManagementUiStore((state) => state.openCreateTaskForm);
  const openEditTaskForm = useProjectManagementUiStore((state) => state.openEditTaskForm);
  const closeTaskForm = useProjectManagementUiStore((state) => state.closeTaskForm);
  const setTaskFilters = useProjectManagementUiStore((state) => state.setTaskFilters);
  const openTaskDetail = useProjectManagementUiStore((state) => state.openTaskDetail);
  const closeTaskDetail = useProjectManagementUiStore((state) => state.closeTaskDetail);

  const projects = useProjectStore((state) => state.projects);
  const tasks = useProjectStore((state) => state.tasks);
  const selectedProjectId = useProjectStore((state) => state.selectedProjectId);
  const users = useProjectStore((state) => state.users);
  const departments = useProjectStore((state) => state.departments);
  const notifications = useProjectStore((state) => state.notifications);
  const createProject = useProjectStore((state) => state.createProject);
  const updateProject = useProjectStore((state) => state.updateProject);
  const deleteProject = useProjectStore((state) => state.deleteProject);
  const duplicateProject = useProjectStore((state) => state.duplicateProject);
  const createTask = useProjectStore((state) => state.createTask);
  const updateTask = useProjectStore((state) => state.updateTask);
  const patchTask = useProjectStore((state) => state.patchTask);
  const deleteTask = useProjectStore((state) => state.deleteTask);
  const duplicateTask = useProjectStore((state) => state.duplicateTask);
  const addComment = useProjectStore((state) => state.addComment);

  useEffect(() => {
    if (pageData.source === "database") {
      syncWorkspaceData(pageData.snapshot);
    }
  }, [pageData.snapshot, pageData.source, syncWorkspaceData]);

  const selectedProject = projects.find((project) => project.id === selectedProjectId) ?? projects[0] ?? null;

  const editingProject =
    projectFormState?.mode === "edit"
      ? projects.find((project) => project.id === projectFormState.projectId) ?? null
      : null;

  const editingTask =
    taskFormState?.mode === "edit"
      ? tasks.find((task) => task.id === taskFormState.taskId) ?? null
      : null;

  const detailTask = useMemo(
    () => tasks.find((task) => task.id === detailTaskId) ?? null,
    [detailTaskId, tasks],
  );

  const handleTaskFiltersChange = (nextFilters: SetStateAction<TaskFilters>) => {
    setTaskFilters(typeof nextFilters === "function" ? nextFilters(taskFilters) : nextFilters);
  };

  const runServerMutation = (mutation: () => Promise<MutationResult>, onSuccess?: () => void) => {
    startTransition(async () => {
      const result = await mutation();

      if (!result.ok) {
        window.alert(result.message ?? "저장 중 오류가 발생했습니다.");
        return;
      }

      onSuccess?.();
      router.refresh();
    });
  };

  const handleProjectFormSubmit = (values: Pick<ProjectInput, "name" | "description">) => {
    if (!projectFormState) {
      return;
    }

    if (isDatabaseMode) {
      if (projectFormState.mode === "edit") {
        runServerMutation(
          () =>
            updateProjectAction(projectFormState.projectId, {
              name: values.name,
              description: values.description,
            }),
          closeProjectForm,
        );
      } else {
        runServerMutation(
          () =>
            createProjectAction({
              name: values.name,
              description: values.description,
              parentId: projectFormState.mode === "create-child" ? projectFormState.parentId : null,
            }),
          closeProjectForm,
        );
      }

      return;
    }

    if (projectFormState.mode === "edit") {
      const result = updateProject(projectFormState.projectId, values);
      if (!result.ok && result.message) {
        window.alert(result.message);
        return;
      }
    } else {
      const result = createProject({
        ...values,
        parentId: projectFormState.mode === "create-child" ? projectFormState.parentId : null,
      });

      if (!result.ok && result.message) {
        window.alert(result.message);
        return;
      }
    }

    closeProjectForm();
  };

  const handleTaskFormSubmit = (values: TaskInput) => {
    if (!taskFormState) {
      return;
    }

    if (isDatabaseMode) {
      if (taskFormState.mode === "create") {
        runServerMutation(() => createTaskAction(taskFormState.projectId, values), closeTaskForm);
      } else {
        runServerMutation(() => updateTaskAction(taskFormState.taskId, values), closeTaskForm);
      }

      return;
    }

    if (taskFormState.mode === "create") {
      const result = createTask(taskFormState.projectId, values);
      if (!result.ok && result.message) {
        window.alert(result.message);
        return;
      }
    } else {
      const result = updateTask(taskFormState.taskId, values);
      if (!result.ok && result.message) {
        window.alert(result.message);
        return;
      }
    }

    closeTaskForm();
  };

  const handlePatchTask = (taskId: string, taskPatch: TaskPatch) => {
    if (isDatabaseMode) {
      runServerMutation(() => updateTaskAction(taskId, taskPatch));
      return;
    }

    const result = patchTask(taskId, taskPatch);
    if (!result.ok && result.message) {
      window.alert(result.message);
    }
  };

  const handleDeleteProject = (projectId: string) => {
    if (isDatabaseMode) {
      runServerMutation(() => deleteProjectAction(projectId), () => {
        closeProjectForm();
        closeTaskDetail();
      });
      return;
    }

    deleteProject(projectId);
  };

  const handleDeleteTask = (taskId: string) => {
    if (isDatabaseMode) {
      runServerMutation(() => deleteTaskAction(taskId), closeTaskDetail);
      return;
    }

    deleteTask(taskId);
  };

  const handleAddComment = (taskId: string, body: string) => {
    if (!body.trim()) {
      window.alert("댓글 내용을 입력해 주세요.");
      return;
    }

    if (isDatabaseMode) {
      runServerMutation(() => addCommentAction(taskId, body));
      return;
    }

    addComment(taskId, body);
  };

  const handleDuplicateProject = (projectId: string) => {
    if (isDatabaseMode) {
      window.alert("DB 모드에서는 프로젝트 복제를 아직 연결 중입니다.");
      return;
    }

    const result = duplicateProject(projectId);
    if (!result.ok && result.message) {
      window.alert(result.message);
    }
  };

  const handleDuplicateTask = (taskId: string) => {
    if (isDatabaseMode) {
      window.alert("DB 모드에서는 Task 복제를 아직 연결 중입니다.");
      return;
    }

    const result = duplicateTask(taskId);
    if (!result.ok && result.message) {
      window.alert(result.message);
    }
  };

  if (!mounted) {
    return (
      <main className="min-h-screen px-6 py-10">
        <div className="mx-auto flex max-w-7xl items-center justify-center rounded-[32px] border border-white/10 bg-slate-950/70 p-12 text-slate-50 backdrop-blur">
          데이터를 불러오는 중입니다...
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen px-4 py-6 text-slate-900 md:px-6 lg:px-8 dark:text-slate-100">
      <div className="mx-auto max-w-7xl space-y-6">
        <section className="overflow-hidden rounded-[34px] border border-slate-200 bg-[linear-gradient(135deg,#020617_0%,#0f172a_42%,#1d4ed8_100%)] px-6 py-8 text-white shadow-[0_25px_60px_rgba(15,23,42,0.22)] dark:border-slate-800">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
            <div className="space-y-3">
              <div className="flex flex-wrap items-center gap-3">
                <span className="inline-flex w-fit rounded-full border border-white/15 bg-white/10 px-3 py-1 text-xs font-medium tracking-[0.14em] text-slate-200">
                  PROJECT OPERATIONS
                </span>
                <span className="inline-flex rounded-full border border-white/15 bg-white/10 px-3 py-1 text-xs font-medium text-slate-100">
                  {isDatabaseMode ? "POSTGRESQL CONNECTED" : "SAMPLE DATA MODE"}
                </span>
                {isMutating ? (
                  <span className="inline-flex rounded-full border border-white/15 bg-white/10 px-3 py-1 text-xs font-medium text-slate-100">
                    SAVING...
                  </span>
                ) : null}
              </div>
              <div className="space-y-2">
                <h1 className="text-3xl font-semibold tracking-tight">프로젝트 관리 워크스페이스</h1>
                <p className="max-w-3xl text-sm leading-6 text-slate-300">
                  프로젝트 트리, KPI 대시보드, 실행 Task를 한 화면에서 관리합니다. 현재는
                  {isDatabaseMode ? " PostgreSQL 서버 데이터" : " 샘플 데이터"}를 기준으로 동작합니다.
                </p>
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
              <button
                type="button"
                onClick={openRootProjectForm}
                className="rounded-2xl bg-white px-4 py-3 text-sm font-semibold text-slate-950 transition hover:bg-slate-100"
              >
                루트 프로젝트 추가
              </button>
              <button
                type="button"
                onClick={() => (selectedProject ? openCreateTaskForm(selectedProject.id) : openRootProjectForm())}
                className="rounded-2xl border border-white/15 bg-white/10 px-4 py-3 text-sm font-semibold text-white transition hover:bg-white/15"
              >
                Task 빠른 추가
              </button>
              <button
                type="button"
                onClick={() => downloadTasksCsv(projects, tasks, null)}
                className="rounded-2xl border border-white/15 bg-white/10 px-4 py-3 text-sm font-semibold text-white transition hover:bg-white/15"
              >
                전체 CSV 다운로드
              </button>
              <ThemeToggle isDarkMode={isDarkMode} onToggle={toggleTheme} />
            </div>
          </div>
        </section>

        <div className="grid gap-6 xl:grid-cols-[360px_minmax(0,1fr)]">
          <aside className="space-y-6">
            <ProjectTree
              projects={projects}
              selectedProjectId={selectedProject?.id ?? null}
              isDatabaseMode={isDatabaseMode}
              onCreateRoot={openRootProjectForm}
              onCreateChild={openChildProjectForm}
              onEditProject={openEditProjectForm}
              onDeleteProject={handleDeleteProject}
              onDuplicateProject={handleDuplicateProject}
            />
          </aside>

          <section className="space-y-6">
            <Dashboard projects={projects} tasks={tasks} />
            <TodayFocus projects={projects} tasks={tasks} onOpenTask={openTaskDetail} />
            <SystemFoundationPanel users={users} departments={departments} notifications={notifications} />

            <ProjectDetail
              selectedProject={selectedProject}
              projects={projects}
              tasks={tasks}
              filters={taskFilters}
              isDatabaseMode={isDatabaseMode}
              onFiltersChange={handleTaskFiltersChange}
              onEditProject={openEditProjectForm}
              onCreateChild={openChildProjectForm}
              onCreateTask={openCreateTaskForm}
              onEditTask={openEditTaskForm}
              onDeleteTask={handleDeleteTask}
              onOpenTask={openTaskDetail}
              onPatchTask={handlePatchTask}
              onDuplicateTask={handleDuplicateTask}
              onDuplicateProject={handleDuplicateProject}
            />
          </section>
        </div>
      </div>

      {projectFormState ? (
        <Modal
          title={projectFormState.mode === "edit" ? "프로젝트 수정" : "프로젝트 생성"}
          description={
            projectFormState.mode === "create-child"
              ? "선택한 프로젝트 아래에 하위 프로젝트를 추가합니다."
              : "프로젝트 기본 정보를 입력해 주세요."
          }
          onClose={closeProjectForm}
        >
          <ProjectForm
            mode={projectFormState.mode === "edit" ? "edit" : "create"}
            parentProject={
              projectFormState?.mode === "create-child"
                ? projects.find((project) => project.id === projectFormState.parentId) ?? null
                : null
            }
            initialProject={editingProject}
            onSubmit={handleProjectFormSubmit}
            onCancel={closeProjectForm}
          />
        </Modal>
      ) : null}

      {taskFormState ? (
        <Modal
          title={taskFormState.mode === "edit" ? "Task 수정" : "Task 생성"}
          description="일정, 우선순위, 상태, 메모까지 함께 관리할 수 있습니다."
          onClose={closeTaskForm}
        >
          <TaskForm
            mode={taskFormState.mode === "edit" ? "edit" : "create"}
            project={
              taskFormState.mode === "create"
                ? projects.find((project) => project.id === taskFormState.projectId) ?? null
                : projects.find((project) => project.id === editingTask?.projectId) ?? null
            }
            initialTask={editingTask}
            isDatabaseMode={isDatabaseMode}
            onSubmit={handleTaskFormSubmit}
            onCancel={closeTaskForm}
          />
        </Modal>
      ) : null}

      <TaskDetailDrawer
        task={detailTask}
        projectName={detailTask ? projects.find((project) => project.id === detailTask.projectId)?.name : undefined}
        isDatabaseMode={isDatabaseMode}
        onClose={closeTaskDetail}
        onEdit={(taskId) => {
          closeTaskDetail();
          openEditTaskForm(taskId);
        }}
        onDuplicate={handleDuplicateTask}
        onDelete={(taskId) => {
          if (window.confirm("이 Task를 삭제할까요?")) {
            handleDeleteTask(taskId);
          }
        }}
        onAddComment={handleAddComment}
      />
    </main>
  );
}
