"use client";

import { useEffect, useMemo, useState, useTransition, type SetStateAction } from "react";
import { useRouter } from "next/navigation";
import { AssigneeListPanel } from "@/components/assignee-list-panel";
import { AssigneeWorkspace } from "@/components/assignee-workspace";
import { Dashboard } from "@/components/dashboard";
import { ProjectDetail } from "@/components/project-detail";
import { ProjectForm } from "@/components/project-form";
import { ProjectTree } from "@/components/project-tree";
import { SystemFoundationPanel } from "@/components/system-foundation-panel";
import { TaskDetailDrawer } from "@/components/task-detail-drawer";
import { TaskForm } from "@/components/task-form";
import { ThemeToggle } from "@/components/theme-toggle";
import { TodayFocus } from "@/components/today-focus";
import { Card } from "@/components/ui/card";
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

type WorkspaceMode = "browse" | "input";
type BrowseMode = "project" | "assignee";
type InputSection = "project" | "task";

export function ProjectManagementScreen({ pageData }: ProjectManagementScreenProps) {
  const mounted = useMounted();
  const router = useRouter();
  const [isMutating, startTransition] = useTransition();
  const [workspaceMode, setWorkspaceMode] = useState<WorkspaceMode>("browse");
  const [browseMode, setBrowseMode] = useState<BrowseMode>("project");
  const [inputSection, setInputSection] = useState<InputSection>("project");
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

  useEffect(() => {
    if (projectFormState || taskFormState) {
      setWorkspaceMode("input");
    }
  }, [projectFormState, taskFormState]);

  useEffect(() => {
    if (projectFormState) {
      setInputSection("project");
      return;
    }

    if (taskFormState) {
      setInputSection("task");
    }
  }, [projectFormState, taskFormState]);

  const selectedProject = projects.find((project) => project.id === selectedProjectId) ?? projects[0] ?? null;
  const selectedProjectTasks = useMemo(
    () => (selectedProject ? tasks.filter((task) => task.projectId === selectedProject.id) : []),
    [selectedProject, tasks],
  );
  const selectedProjectOpenTasks = selectedProjectTasks.filter((task) => !task.isCompleted).length;

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

  const handleOpenRootProjectForm = () => {
    setWorkspaceMode("input");
    setInputSection("project");
    openRootProjectForm();
  };

  const handleOpenChildProjectForm = (projectId: string) => {
    setWorkspaceMode("input");
    setInputSection("project");
    openChildProjectForm(projectId);
  };

  const handleOpenEditProjectForm = (projectId: string) => {
    setWorkspaceMode("input");
    setInputSection("project");
    openEditProjectForm(projectId);
  };

  const handleOpenCreateTaskForm = (projectId: string) => {
    setWorkspaceMode("input");
    setInputSection("task");
    openCreateTaskForm(projectId);
  };

  const handleOpenEditTaskForm = (taskId: string) => {
    setWorkspaceMode("input");
    setInputSection("task");
    openEditTaskForm(taskId);
  };

  const handleStartTaskEntry = () => {
    if (!selectedProject) {
      window.alert("아래 프로젝트 트리에서 프로젝트를 먼저 선택해 주세요.");
      return;
    }

    handleOpenCreateTaskForm(selectedProject.id);
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
        <section className="overflow-hidden rounded-[34px] border border-slate-200 bg-[linear-gradient(135deg,#0f172a_0%,#172554_52%,#1e3a8a_100%)] px-6 py-8 text-white shadow-[0_25px_60px_rgba(15,23,42,0.26)] dark:border-slate-800">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
            <div className="space-y-3">
              <div className="flex flex-wrap items-center gap-3">
                <span className="inline-flex w-fit rounded-full border border-white/20 bg-white/15 px-3 py-1 text-xs font-medium tracking-[0.14em] text-white">
                  PROJECT OPERATIONS
                </span>
                <span className="inline-flex rounded-full border border-white/20 bg-white/15 px-3 py-1 text-xs font-medium text-white">
                  {isDatabaseMode ? "POSTGRESQL CONNECTED" : "SAMPLE DATA MODE"}
                </span>
                {isMutating ? (
                  <span className="inline-flex rounded-full border border-white/20 bg-white/15 px-3 py-1 text-xs font-medium text-white">
                    SAVING...
                  </span>
                ) : null}
              </div>
              <div className="space-y-2">
                <h1 className="text-3xl font-semibold tracking-tight text-white drop-shadow-[0_3px_12px_rgba(15,23,42,0.22)]">
                  프로젝트 관리 워크스페이스
                </h1>
                <p className="max-w-3xl text-sm leading-6 text-slate-100">
                  프로젝트 트리, KPI 대시보드, 실행 Task를 한 화면에서 관리합니다. 현재는
                  {isDatabaseMode ? " PostgreSQL 서버 데이터" : " 샘플 데이터"}를 기준으로 동작합니다.
                </p>
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <button
                type="button"
                onClick={() => downloadTasksCsv(projects, tasks, null)}
                className="rounded-2xl border border-white/20 bg-white/10 px-4 py-3 text-sm font-semibold text-white transition hover:bg-white/15"
              >
                전체 CSV 다운로드
              </button>
              <ThemeToggle isDarkMode={isDarkMode} onToggle={toggleTheme} />
            </div>
          </div>
        </section>

        <div className="rounded-[30px] border border-slate-200/80 bg-white/95 p-4 shadow-[0_18px_50px_rgba(15,23,42,0.08)] backdrop-blur-sm dark:border-slate-800/90 dark:bg-slate-900/95 dark:shadow-[0_20px_60px_rgba(2,6,23,0.45)]">
          <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
            <div>
              <p className="text-sm font-semibold text-slate-900 dark:text-white">화면 분리</p>
              <p className="text-sm text-slate-500 dark:text-slate-400">
                조회와 입력을 나눠서 스크롤 부담을 줄이고, 조회는 프로젝트 기준과 담당자 기준을 모두 지원합니다.
              </p>
            </div>

            <div className="flex flex-col gap-3 lg:flex-row">
              <div className="flex flex-wrap gap-2 rounded-2xl bg-slate-100 p-1 dark:bg-slate-800">
                <button
                  type="button"
                  onClick={() => setWorkspaceMode("browse")}
                  className={`rounded-xl px-4 py-2 text-sm font-semibold transition ${
                    workspaceMode === "browse"
                      ? "bg-white text-slate-900 shadow-sm dark:bg-slate-950 dark:text-white"
                      : "text-slate-500 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white"
                  }`}
                >
                  조회
                </button>
                <button
                  type="button"
                  onClick={() => setWorkspaceMode("input")}
                  className={`rounded-xl px-4 py-2 text-sm font-semibold transition ${
                    workspaceMode === "input"
                      ? "bg-white text-slate-900 shadow-sm dark:bg-slate-950 dark:text-white"
                      : "text-slate-500 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white"
                  }`}
                >
                  입력
                </button>
              </div>

              {workspaceMode === "browse" ? (
                <div className="flex flex-wrap gap-2 rounded-2xl bg-slate-100 p-1 dark:bg-slate-800">
                  <button
                    type="button"
                    onClick={() => setBrowseMode("project")}
                    className={`rounded-xl px-4 py-2 text-sm font-semibold transition ${
                      browseMode === "project"
                        ? "bg-white text-slate-900 shadow-sm dark:bg-slate-950 dark:text-white"
                        : "text-slate-500 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white"
                    }`}
                  >
                    프로젝트 기준
                  </button>
                  <button
                    type="button"
                    onClick={() => setBrowseMode("assignee")}
                    className={`rounded-xl px-4 py-2 text-sm font-semibold transition ${
                      browseMode === "assignee"
                        ? "bg-white text-slate-900 shadow-sm dark:bg-slate-950 dark:text-white"
                        : "text-slate-500 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white"
                    }`}
                  >
                    담당자 기준
                  </button>
                </div>
              ) : (
                <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-500 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300">
                  입력 탭에서는 폼이 아래에서 바로 열립니다.
                </div>
              )}
            </div>
          </div>
        </div>

        {workspaceMode === "browse" ? (
          <div className="grid gap-6 xl:grid-cols-[360px_minmax(0,1fr)]">
            <aside className="space-y-6">
              {browseMode === "project" ? (
                <ProjectTree
                  projects={projects}
                  selectedProjectId={selectedProject?.id ?? null}
                  isDatabaseMode={isDatabaseMode}
                  onCreateRoot={handleOpenRootProjectForm}
                  onCreateChild={handleOpenChildProjectForm}
                  onEditProject={handleOpenEditProjectForm}
                  onDeleteProject={handleDeleteProject}
                  onDuplicateProject={handleDuplicateProject}
                />
              ) : (
                <AssigneeListPanel
                  tasks={tasks}
                  selectedAssignee={taskFilters.assignee}
                  onSelectAssignee={(assignee) =>
                    handleTaskFiltersChange((current) => ({
                      ...current,
                      assignee,
                    }))
                  }
                />
              )}
            </aside>

            <section className="space-y-6">
              {browseMode === "project" ? (
                <>
                  <Dashboard projects={projects} tasks={tasks} />
                  <TodayFocus projects={projects} tasks={tasks} onOpenTask={openTaskDetail} />
                  <ProjectDetail
                    selectedProject={selectedProject}
                    projects={projects}
                    tasks={tasks}
                    filters={taskFilters}
                    isDatabaseMode={isDatabaseMode}
                    onFiltersChange={handleTaskFiltersChange}
                    onEditProject={handleOpenEditProjectForm}
                    onCreateChild={handleOpenChildProjectForm}
                    onCreateTask={handleOpenCreateTaskForm}
                    onEditTask={handleOpenEditTaskForm}
                    onDeleteTask={handleDeleteTask}
                    onOpenTask={openTaskDetail}
                    onPatchTask={handlePatchTask}
                    onDuplicateTask={handleDuplicateTask}
                    onDuplicateProject={handleDuplicateProject}
                  />
                </>
              ) : (
                <AssigneeWorkspace
                  projects={projects}
                  tasks={tasks}
                  filters={taskFilters}
                  isDatabaseMode={isDatabaseMode}
                  onFiltersChange={handleTaskFiltersChange}
                  onEditTask={handleOpenEditTaskForm}
                  onDeleteTask={handleDeleteTask}
                  onOpenTask={openTaskDetail}
                  onPatchTask={handlePatchTask}
                  onDuplicateTask={handleDuplicateTask}
                />
              )}
            </section>
          </div>
        ) : (
          <section className="space-y-6">
            <Card className="space-y-6">
              <div className="flex flex-col gap-5 xl:flex-row xl:items-start xl:justify-between">
                <div className="space-y-2">
                  <span className="inline-flex w-fit rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold tracking-[0.14em] text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                    INPUT WORKSPACE
                  </span>
                  <div>
                    <h2 className="text-2xl font-semibold tracking-tight text-slate-900 dark:text-white">상단 입력 영역</h2>
                    <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-500 dark:text-slate-400">
                      프로젝트와 Task 입력을 한 곳에서만 전환하도록 정리했습니다. 아래 프로젝트 트리에서 대상을 선택한 뒤 여기서 바로 입력하세요.
                    </p>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <div className="flex flex-wrap gap-2 rounded-2xl bg-slate-100 p-1 dark:bg-slate-800">
                    <button
                      type="button"
                      onClick={() => {
                        setInputSection("project");
                        closeTaskForm();
                      }}
                      className={`rounded-xl px-3 py-2 text-sm font-semibold transition ${
                        inputSection === "project"
                          ? "bg-white text-slate-900 shadow-sm dark:bg-slate-950 dark:text-white"
                          : "text-slate-500 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white"
                      }`}
                    >
                      프로젝트 입력
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setInputSection("task");
                        closeProjectForm();
                      }}
                      className={`rounded-xl px-3 py-2 text-sm font-semibold transition ${
                        inputSection === "task"
                          ? "bg-white text-slate-900 shadow-sm dark:bg-slate-950 dark:text-white"
                          : "text-slate-500 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white"
                      }`}
                    >
                      Task 입력
                    </button>
                  </div>

                  {inputSection === "project" ? (
                    <>
                      <button
                        type="button"
                        onClick={handleOpenRootProjectForm}
                        className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"
                      >
                        루트 생성
                      </button>
                      <button
                        type="button"
                        onClick={() => selectedProject && handleOpenChildProjectForm(selectedProject.id)}
                        disabled={!selectedProject}
                        className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"
                      >
                        하위 추가
                      </button>
                      <button
                        type="button"
                        onClick={() => selectedProject && handleOpenEditProjectForm(selectedProject.id)}
                        disabled={!selectedProject}
                        className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"
                      >
                        프로젝트 수정
                      </button>
                    </>
                  ) : (
                    <button
                      type="button"
                      onClick={handleStartTaskEntry}
                      className="rounded-xl bg-slate-900 px-3 py-2 text-sm font-semibold text-white transition hover:bg-slate-800 dark:bg-white dark:text-slate-950 dark:hover:bg-slate-200"
                    >
                      새 Task
                    </button>
                  )}
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-3">
                <div className="rounded-[26px] border border-slate-200/90 bg-gradient-to-b from-white to-slate-50 p-5 dark:border-slate-800 dark:from-slate-900 dark:to-slate-950">
                  <p className="text-sm text-slate-500 dark:text-slate-400">현재 선택 프로젝트</p>
                  <p className="mt-2 text-xl font-semibold tracking-tight text-slate-900 dark:text-white">
                    {selectedProject?.name ?? "선택된 프로젝트 없음"}
                  </p>
                </div>
                <div className="rounded-[26px] border border-slate-200/90 bg-white p-5 dark:border-slate-800 dark:bg-slate-950">
                  <p className="text-sm text-slate-500 dark:text-slate-400">현재 프로젝트 Task</p>
                  <p className="mt-2 text-3xl font-semibold tracking-tight text-slate-900 dark:text-white">{selectedProjectTasks.length}</p>
                </div>
                <div className="rounded-[26px] border border-slate-200/90 bg-white p-5 dark:border-slate-800 dark:bg-slate-950">
                  <p className="text-sm text-slate-500 dark:text-slate-400">미완료 Task</p>
                  <p className="mt-2 text-3xl font-semibold tracking-tight text-slate-900 dark:text-white">{selectedProjectOpenTasks}</p>
                </div>
              </div>

              {inputSection === "project" ? (
                <div className="rounded-[26px] border border-slate-200/90 bg-white p-5 dark:border-slate-800 dark:bg-slate-950">
                  {projectFormState ? (
                    <div className="space-y-4">
                      <div>
                        <h3 className="text-lg font-semibold text-slate-900 dark:text-white">
                          {projectFormState.mode === "edit"
                            ? "프로젝트 수정"
                            : projectFormState.mode === "create-child"
                              ? "하위 프로젝트 생성"
                              : "루트 프로젝트 생성"}
                        </h3>
                        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                          {projectFormState.mode === "create-child"
                            ? "선택한 프로젝트 아래에 새 하위 프로젝트를 추가합니다."
                            : "프로젝트 기본 정보를 입력해 주세요."}
                        </p>
                      </div>
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
                    </div>
                  ) : (
                    <div className="rounded-[24px] border border-dashed border-slate-300 bg-slate-50 px-6 py-12 text-center text-sm text-slate-500 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-400">
                      상단의 작은 프로젝트 버튼을 눌러 여기서 하나의 프로젝트 입력 폼만 열어 주세요.
                    </div>
                  )}
                </div>
              ) : (
                <div className="rounded-[26px] border border-slate-200/90 bg-white p-5 dark:border-slate-800 dark:bg-slate-950">
                  <div className="mb-4 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-500 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300">
                    대상 프로젝트
                    <p className="mt-1 font-semibold text-slate-900 dark:text-white">
                      {selectedProject?.name ?? "먼저 아래 트리에서 선택"}
                    </p>
                  </div>
                  {taskFormState ? (
                    <div className="space-y-4">
                      <div>
                        <h3 className="text-lg font-semibold text-slate-900 dark:text-white">
                          {taskFormState.mode === "edit" ? "Task 수정" : "Task 생성"}
                        </h3>
                        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                          일정, 우선순위, 상태, 메모까지 함께 관리할 수 있습니다.
                        </p>
                      </div>
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
                    </div>
                  ) : (
                    <div className="rounded-[24px] border border-dashed border-slate-300 bg-slate-50 px-6 py-12 text-center text-sm text-slate-500 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-400">
                      상단의 `새 Task` 버튼을 눌러 여기서 하나의 Task 입력 폼만 열어 주세요.
                    </div>
                  )}
                </div>
              )}
            </Card>

            <ProjectTree
              projects={projects}
              selectedProjectId={selectedProject?.id ?? null}
              isDatabaseMode={isDatabaseMode}
              onCreateRoot={handleOpenRootProjectForm}
              onCreateChild={handleOpenChildProjectForm}
              onEditProject={handleOpenEditProjectForm}
              onDeleteProject={handleDeleteProject}
              onDuplicateProject={handleDuplicateProject}
            />

            <SystemFoundationPanel users={users} departments={departments} notifications={notifications} />
          </section>
        )}
      </div>

      <TaskDetailDrawer
        task={detailTask}
        projectName={detailTask ? projects.find((project) => project.id === detailTask.projectId)?.name : undefined}
        isDatabaseMode={isDatabaseMode}
        onClose={closeTaskDetail}
        onEdit={(taskId) => {
          closeTaskDetail();
          handleOpenEditTaskForm(taskId);
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
