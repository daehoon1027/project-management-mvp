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
import { useMounted } from "@/hooks/use-mounted";
import { useTheme } from "@/hooks/use-theme";
import { createProjectAction, deleteProjectAction, updateProjectAction } from "@/features/project-management/server/actions/project-actions";
import { addCommentAction, createTaskAction, deleteTaskAction, updateTaskAction } from "@/features/project-management/server/actions/task-actions";
import type { ProjectManagementPageData } from "@/features/project-management/server/dto/project-management.dto";
import { useProjectManagementUiStore } from "@/features/project-management/store/use-project-management-ui-store";
import { downloadTasksCsv } from "@/lib/export";
import { getDescendantProjectIds } from "@/lib/project-tree";
import { cn } from "@/lib/utils";
import { useProjectStore } from "@/store/use-project-store";
import type { ProjectInput, TaskFilters, TaskInput, TaskPatch } from "@/types";

type ProjectManagementScreenProps = {
  pageData: ProjectManagementPageData;
};

type MutationResult = {
  ok: boolean;
  message?: string;
};

type WorkspaceSection = "dashboard" | "project-map" | "project-tasks" | "assignee" | "input" | "system";
type InputSection = "project" | "task";

export function ProjectManagementScreen({ pageData }: ProjectManagementScreenProps) {
  const mounted = useMounted();
  const router = useRouter();
  const [isMutating, startTransition] = useTransition();
  const [activeSection, setActiveSection] = useState<WorkspaceSection>("dashboard");
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
      setActiveSection("input");
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
  const selectedProjectScopeIds = useMemo(
    () => (selectedProject ? [selectedProject.id, ...getDescendantProjectIds(projects, selectedProject.id)] : []),
    [projects, selectedProject],
  );
  const selectedProjectTasks = useMemo(
    () => (selectedProject ? tasks.filter((task) => selectedProjectScopeIds.includes(task.projectId)) : []),
    [selectedProject, selectedProjectScopeIds, tasks],
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

  const detailTask = useMemo(() => tasks.find((task) => task.id === detailTaskId) ?? null, [detailTaskId, tasks]);

  const handleTaskFiltersChange = (nextFilters: SetStateAction<TaskFilters>) => {
    setTaskFilters(typeof nextFilters === "function" ? nextFilters(taskFilters) : nextFilters);
  };

  const handleOpenRootProjectForm = () => {
    setActiveSection("input");
    setInputSection("project");
    openRootProjectForm();
  };

  const handleOpenChildProjectForm = (projectId: string) => {
    setActiveSection("input");
    setInputSection("project");
    openChildProjectForm(projectId);
  };

  const handleOpenEditProjectForm = (projectId: string) => {
    setActiveSection("input");
    setInputSection("project");
    openEditProjectForm(projectId);
  };

  const handleOpenCreateTaskForm = (projectId: string) => {
    setActiveSection("input");
    setInputSection("task");
    openCreateTaskForm(projectId);
  };

  const handleOpenEditTaskForm = (taskId: string) => {
    setActiveSection("input");
    setInputSection("task");
    openEditTaskForm(taskId);
  };

  const handleStartTaskEntry = () => {
    if (!selectedProject) {
      window.alert("프로젝트 맵에서 먼저 프로젝트를 선택해 주세요.");
      return;
    }

    handleOpenCreateTaskForm(selectedProject.id);
  };

  const handleStartChildProjectEntry = () => {
    if (!selectedProject) {
      window.alert("하위 프로젝트를 만들 상위 프로젝트를 먼저 선택해 주세요.");
      return;
    }

    handleOpenChildProjectForm(selectedProject.id);
  };

  const handleStartProjectEdit = () => {
    if (!selectedProject) {
      window.alert("수정할 프로젝트를 먼저 선택해 주세요.");
      return;
    }

    handleOpenEditProjectForm(selectedProject.id);
  };

  const handleStartProjectDelete = () => {
    if (!selectedProject) {
      window.alert("삭제할 프로젝트를 먼저 선택해 주세요.");
      return;
    }

    if (!window.confirm("선택한 프로젝트와 하위 프로젝트, 연결된 Task를 모두 삭제할까요?")) {
      return;
    }

    closeProjectForm();
    closeTaskForm();
    handleDeleteProject(selectedProject.id);
  };

  const runServerMutation = (mutation: () => Promise<MutationResult>, onSuccess?: () => void) => {
    startTransition(async () => {
      const result = await mutation();

      if (!result.ok) {
        window.alert(result.message ?? "작업 중 오류가 발생했습니다.");
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
      window.alert("DB 모드에서는 프로젝트 복제를 아직 지원하지 않습니다.");
      return;
    }

    const result = duplicateProject(projectId);
    if (!result.ok && result.message) {
      window.alert(result.message);
    }
  };

  const handleDuplicateTask = (taskId: string) => {
    if (isDatabaseMode) {
      window.alert("DB 모드에서는 Task 복제를 아직 지원하지 않습니다.");
      return;
    }

    const result = duplicateTask(taskId);
    if (!result.ok && result.message) {
      window.alert(result.message);
    }
  };

  const sidebarGroups: Array<{
    title: string;
    items: Array<{
      id: WorkspaceSection;
      label: string;
      description: string;
    }>;
  }> = [
    {
      title: "분석",
      items: [
        { id: "dashboard", label: "경영 대시보드", description: "KPI와 오늘의 실행 현황" },
        { id: "project-map", label: "프로젝트 맵", description: "루트 프로젝트 중심으로 탐색" },
        { id: "project-tasks", label: "프로젝트 Task", description: "선택 프로젝트의 Task만 조회" },
        { id: "assignee", label: "담당자 기준", description: "담당자별 실행 현황" },
      ],
    },
    {
      title: "입력",
      items: [{ id: "input", label: "입력 워크스페이스", description: "프로젝트와 Task 입력" }],
    },
    {
      title: "관리",
      items: [{ id: "system", label: "시스템 현황", description: "사용자, 부서, 알림 현황" }],
    },
  ];

  const sectionMeta: Record<WorkspaceSection, { title: string; description: string }> = {
    dashboard: {
      title: "경영 대시보드",
      description: "전체 KPI와 오늘 바로 확인해야 할 실행 항목을 한곳에서 봅니다.",
    },
    "project-map": {
      title: "프로젝트 맵",
      description: "한 주제씩 집중해서 보고, 필요한 계층과 연결 Task만 펼쳐서 확인합니다.",
    },
    "project-tasks": {
      title: "프로젝트 Task",
      description: "선택한 프로젝트와 하위 프로젝트에 연결된 Task만 모아서 봅니다.",
    },
    assignee: {
      title: "담당자 기준 조회",
      description: "담당자 단위로 업무량과 상태를 빠르게 확인합니다.",
    },
    input: {
      title: "입력 워크스페이스",
      description: "입력은 여기 한 곳에서만 시작하고, 다른 화면과 명확히 분리합니다.",
    },
    system: {
      title: "시스템 현황",
      description: "사용자, 부서, 알림 기반 운영 정보를 점검합니다.",
    },
  };

  const renderInputWorkspace = () => (
    <section className="space-y-6">
      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.25fr)_360px]">
        <Card className="space-y-6">
          <div className="flex flex-col gap-5 xl:flex-row xl:items-start xl:justify-between">
            <div className="space-y-2">
              <span className="inline-flex w-fit rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold tracking-[0.14em] text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                INPUT WORKSPACE
              </span>
              <div>
                <h2 className="text-2xl font-semibold tracking-tight text-slate-900 dark:text-white">상단 입력 영역</h2>
                <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-500 dark:text-slate-400">
                  프로젝트와 Task 입력은 여기에서만 시작합니다. 오른쪽 프로젝트 맵에서 대상을 선택한 뒤 바로 입력해 주세요.
                </p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <button type="button" onClick={handleOpenRootProjectForm} className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-900 transition hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:hover:bg-slate-800">
                프로젝트 입력
              </button>
              <button type="button" onClick={handleStartChildProjectEntry} className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-900 transition hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:hover:bg-slate-800">
                하위 프로젝트 입력
              </button>
              <button type="button" onClick={handleStartTaskEntry} className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-900 transition hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:hover:bg-slate-800">
                Task 입력
              </button>
              <button type="button" onClick={handleStartProjectEdit} className="rounded-xl bg-slate-900 px-3 py-2 text-sm font-semibold text-white transition hover:bg-slate-800 dark:bg-white dark:text-slate-950 dark:hover:bg-slate-200">
                수정
              </button>
              <button type="button" onClick={handleStartProjectDelete} className="rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-sm font-semibold text-rose-600 transition hover:bg-rose-100 dark:border-rose-900 dark:bg-rose-950/20 dark:text-rose-300 dark:hover:bg-rose-950/30">
                프로젝트 삭제
              </button>
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            <div className="rounded-[26px] border border-slate-200/90 bg-gradient-to-b from-white to-slate-50 p-5 dark:border-slate-800 dark:from-slate-900 dark:to-slate-950">
              <p className="text-sm text-slate-500 dark:text-slate-400">현재 선택 프로젝트</p>
              <p className="mt-2 text-xl font-semibold tracking-tight text-slate-900 dark:text-white">{selectedProject?.name ?? "선택된 프로젝트 없음"}</p>
            </div>
            <div className="rounded-[26px] border border-slate-200/90 bg-white p-5 dark:border-slate-800 dark:bg-slate-950">
              <p className="text-sm text-slate-500 dark:text-slate-400">선택 범위 Task</p>
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
                      {projectFormState.mode === "edit" ? "프로젝트 수정" : projectFormState.mode === "create-child" ? "하위 프로젝트 입력" : "프로젝트 입력"}
                    </h3>
                    <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                      {projectFormState.mode === "create-child"
                        ? "선택한 프로젝트 아래에 하위 프로젝트를 입력합니다."
                        : projectFormState.mode === "edit"
                          ? "선택한 프로젝트 정보를 여기에서 바로 수정합니다."
                          : "새 루트 프로젝트의 기본 정보를 입력해 주세요."}
                    </p>
                  </div>
                  <ProjectForm
                    mode={projectFormState.mode === "edit" ? "edit" : "create"}
                    parentProject={projectFormState.mode === "create-child" ? projects.find((project) => project.id === projectFormState.parentId) ?? null : null}
                    initialProject={editingProject}
                    onSubmit={handleProjectFormSubmit}
                    onCancel={closeProjectForm}
                  />
                </div>
              ) : (
                <div className="rounded-[24px] border border-dashed border-slate-300 bg-slate-50 px-6 py-12 text-center text-sm text-slate-500 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-400">
                  위의 프로젝트 입력, 하위 프로젝트 입력, 수정 버튼 중 하나를 눌러 바로 시작해 주세요.
                </div>
              )}
            </div>
          ) : (
            <div className="rounded-[26px] border border-slate-200/90 bg-white p-5 dark:border-slate-800 dark:bg-slate-950">
              <div className="mb-4 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-500 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300">
                대상 프로젝트
                <p className="mt-1 font-semibold text-slate-900 dark:text-white">{selectedProject?.name ?? "먼저 프로젝트 맵에서 프로젝트를 선택해 주세요."}</p>
              </div>
              {taskFormState ? (
                <div className="space-y-4">
                  <div>
                    <h3 className="text-lg font-semibold text-slate-900 dark:text-white">{taskFormState.mode === "edit" ? "Task 수정" : "Task 생성"}</h3>
                    <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">일정, 우선순위, 상태, 메모까지 한 번에 입력할 수 있습니다.</p>
                  </div>
                  <TaskForm
                    mode={taskFormState.mode === "edit" ? "edit" : "create"}
                    project={taskFormState.mode === "create" ? projects.find((project) => project.id === taskFormState.projectId) ?? null : projects.find((project) => project.id === editingTask?.projectId) ?? null}
                    initialTask={editingTask}
                    isDatabaseMode={isDatabaseMode}
                    onSubmit={handleTaskFormSubmit}
                    onCancel={closeTaskForm}
                  />
                </div>
              ) : (
                <div className="rounded-[24px] border border-dashed border-slate-300 bg-slate-50 px-6 py-12 text-center text-sm text-slate-500 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-400">
                  위의 Task 입력 버튼을 눌러 바로 Task 입력을 시작해 주세요.
                </div>
              )}
            </div>
          )}
        </Card>

        <ProjectTree
          projects={projects}
          tasks={tasks}
          selectedProjectId={selectedProject?.id ?? null}
          isDatabaseMode={isDatabaseMode}
          onDeleteProject={handleDeleteProject}
          onDuplicateProject={handleDuplicateProject}
        />
      </div>
    </section>
  );

  const renderActiveSection = () => {
    if (activeSection === "dashboard") {
      return (
        <section className="space-y-6">
          <Dashboard projects={projects} tasks={tasks} />
          <TodayFocus projects={projects} tasks={tasks} onOpenTask={openTaskDetail} />
        </section>
      );
    }

    if (activeSection === "project-map") {
      return (
        <section className="space-y-6">
          <Card className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-sm font-semibold text-slate-900 dark:text-white">현재 선택 프로젝트</p>
              <p className="mt-1 text-lg font-semibold text-slate-900 dark:text-white">{selectedProject?.name ?? "선택된 프로젝트 없음"}</p>
              <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">프로젝트 맵에서 카드를 누르면 선택 프로젝트가 바뀌고, 다른 화면도 같은 기준으로 이어집니다.</p>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-600 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300">
              선택 범위 Task {selectedProjectTasks.length}개
            </div>
          </Card>

          <ProjectTree
            projects={projects}
            tasks={tasks}
            selectedProjectId={selectedProject?.id ?? null}
            isDatabaseMode={isDatabaseMode}
            onDeleteProject={handleDeleteProject}
            onDuplicateProject={handleDuplicateProject}
          />
        </section>
      );
    }

    if (activeSection === "project-tasks") {
      return (
        <section className="space-y-6">
          <Card className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-sm font-semibold text-slate-900 dark:text-white">Task 기준 프로젝트</p>
              <p className="mt-1 text-lg font-semibold text-slate-900 dark:text-white">{selectedProject?.name ?? "선택된 프로젝트 없음"}</p>
              <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">프로젝트를 바꾸고 싶으면 프로젝트 맵에서 다른 프로젝트를 선택해 주세요.</p>
            </div>
            <button
              type="button"
              onClick={() => setActiveSection("project-map")}
              className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"
            >
              프로젝트 맵 보기
            </button>
          </Card>

          <ProjectDetail
            selectedProject={selectedProject}
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
        </section>
      );
    }

    if (activeSection === "assignee") {
      return (
        <section className="grid gap-6 xl:grid-cols-[280px_minmax(0,1fr)]">
          <aside className="space-y-6">
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
          </aside>

          <section className="space-y-6">
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
          </section>
        </section>
      );
    }

    if (activeSection === "system") {
      return <SystemFoundationPanel users={users} departments={departments} notifications={notifications} />;
    }

    return renderInputWorkspace();
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
      <div className="mx-auto max-w-[1600px] space-y-6">
        <section className="overflow-hidden rounded-[34px] border border-sky-200 bg-[linear-gradient(135deg,#ffffff_0%,#e2efff_45%,#d8ecff_100%)] px-6 py-8 text-slate-950 shadow-[0_25px_60px_rgba(15,23,42,0.10)] dark:border-slate-800 dark:bg-[linear-gradient(135deg,#0f172a_0%,#172554_45%,#1d4ed8_100%)] dark:text-white dark:shadow-[0_25px_60px_rgba(15,23,42,0.34)]">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
            <div className="space-y-3">
              <div className="flex flex-wrap items-center gap-3">
                <span className="inline-flex w-fit rounded-full border border-slate-300 bg-white px-3 py-1 text-xs font-semibold tracking-[0.14em] text-slate-900 dark:border-white/20 dark:bg-slate-950/35 dark:text-slate-50">
                  PROJECT OPERATIONS
                </span>
                <span className="inline-flex rounded-full border border-slate-300 bg-white px-3 py-1 text-xs font-semibold text-slate-900 dark:border-white/20 dark:bg-slate-950/35 dark:text-slate-50">
                  {isDatabaseMode ? "POSTGRESQL CONNECTED" : "SAMPLE DATA MODE"}
                </span>
                {isMutating ? (
                  <span className="inline-flex rounded-full border border-slate-300 bg-white px-3 py-1 text-xs font-semibold text-slate-900 dark:border-white/20 dark:bg-slate-950/35 dark:text-slate-50">
                    SAVING...
                  </span>
                ) : null}
              </div>
              <div className="space-y-2">
                <h1 className="inline-flex rounded-[24px] border border-slate-300 bg-white px-5 py-3 text-3xl font-semibold tracking-tight text-slate-950 shadow-[0_18px_45px_rgba(15,23,42,0.08)] dark:border-white/10 dark:bg-white/10 dark:text-slate-50 dark:shadow-[0_6px_18px_rgba(15,23,42,0.45)]">
                  프로젝트 관리 워크스페이스
                </h1>
                <p className="max-w-3xl text-sm leading-6 text-slate-700 dark:text-slate-200">
                  왼쪽 바에서 필요한 주제만 눌러 보고, 오른쪽에서는 그 내용에만 집중하도록 화면을 나눴습니다.
                </p>
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <button
                type="button"
                onClick={() => downloadTasksCsv(projects, tasks, null)}
                className="rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm font-semibold text-slate-950 transition hover:bg-slate-50 dark:border-white/20 dark:bg-white dark:text-slate-900 dark:hover:bg-slate-100"
              >
                전체 CSV 다운로드
              </button>
              <ThemeToggle isDarkMode={isDarkMode} onToggle={toggleTheme} />
            </div>
          </div>
        </section>

        <div className="grid gap-6 xl:grid-cols-[280px_minmax(0,1fr)]">
          <aside className="space-y-4">
            <Card className="overflow-hidden p-0">
              <div className="border-b border-slate-200/90 bg-gradient-to-r from-slate-50 to-white px-5 py-5 dark:border-slate-800 dark:from-slate-900 dark:to-slate-900">
                <p className="text-xs font-semibold tracking-[0.18em] text-slate-500 dark:text-slate-400">NAVIGATION</p>
                <h2 className="mt-2 text-xl font-semibold text-slate-900 dark:text-white">프로젝트 컨트롤</h2>
                <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                  왼쪽 메뉴를 누르면 해당 내용만 오른쪽에 표시됩니다.
                </p>
              </div>

              <div className="space-y-5 px-4 py-4">
                {sidebarGroups.map((group) => (
                  <div key={group.title} className="space-y-2">
                    <p className="px-2 text-xs font-semibold uppercase tracking-[0.16em] text-slate-400 dark:text-slate-500">
                      {group.title}
                    </p>
                    <div className="space-y-1">
                      {group.items.map((item) => {
                        const isActive = activeSection === item.id;

                        return (
                          <button
                            key={item.id}
                            type="button"
                            onClick={() => setActiveSection(item.id)}
                            className={cn(
                              "w-full rounded-[20px] border px-4 py-3 text-left transition",
                              isActive
                                ? "border-brand-200 bg-brand-50 text-brand-700 shadow-sm dark:border-brand-500/20 dark:bg-brand-500/10 dark:text-brand-300"
                                : "border-transparent bg-white text-slate-700 hover:border-slate-200 hover:bg-slate-50 dark:bg-slate-950 dark:text-slate-200 dark:hover:border-slate-800 dark:hover:bg-slate-900",
                            )}
                          >
                            <p className="text-sm font-semibold">{item.label}</p>
                            <p className={cn("mt-1 text-xs", isActive ? "text-brand-600 dark:text-brand-300" : "text-slate-400 dark:text-slate-500")}>
                              {item.description}
                            </p>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            </Card>

            <Card className="space-y-3">
              <div>
                <p className="text-sm font-semibold text-slate-900 dark:text-white">현재 선택 프로젝트</p>
                <p className="mt-1 text-lg font-semibold text-slate-900 dark:text-white">
                  {selectedProject?.name ?? "선택된 프로젝트 없음"}
                </p>
              </div>
              <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-1">
                <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 dark:border-slate-700 dark:bg-slate-900">
                  <p className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-400 dark:text-slate-500">선택 범위 Task</p>
                  <p className="mt-1 text-2xl font-semibold text-slate-900 dark:text-white">{selectedProjectTasks.length}</p>
                </div>
                <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 dark:border-slate-700 dark:bg-slate-900">
                  <p className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-400 dark:text-slate-500">미완료</p>
                  <p className="mt-1 text-2xl font-semibold text-slate-900 dark:text-white">{selectedProjectOpenTasks}</p>
                </div>
              </div>
            </Card>
          </aside>

          <section className="space-y-6">
            <Card className="border border-slate-200/80 bg-white/95 shadow-[0_18px_50px_rgba(15,23,42,0.08)] dark:border-slate-800/90 dark:bg-slate-900/95 dark:shadow-[0_20px_60px_rgba(2,6,23,0.45)]">
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-400 dark:text-slate-500">ACTIVE VIEW</p>
              <h2 className="mt-2 text-2xl font-semibold tracking-tight text-slate-900 dark:text-white">
                {sectionMeta[activeSection].title}
              </h2>
              <p className="mt-2 text-sm leading-6 text-slate-500 dark:text-slate-400">
                {sectionMeta[activeSection].description}
              </p>
            </Card>

            {renderActiveSection()}
          </section>
        </div>
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
