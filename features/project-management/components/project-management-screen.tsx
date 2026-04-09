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
import { Card } from "@/components/ui/card";
import { useMounted } from "@/hooks/use-mounted";
import {
  createProjectAction,
  deleteProjectAction,
  updateProjectAction,
} from "@/features/project-management/server/actions/project-actions";
import {
  addCommentAction,
  createTaskAction,
  deleteTaskAction,
  updateTaskAction,
} from "@/features/project-management/server/actions/task-actions";
import type { ProjectManagementPageData } from "@/features/project-management/server/dto/project-management.dto";
import { useProjectManagementUiStore } from "@/features/project-management/store/use-project-management-ui-store";
import { downloadTasksCsv } from "@/lib/export";
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

type WorkspaceSection = "overview" | "input" | "project-map" | "project-tasks" | "assignee" | "system";
type InputSection = "project" | "task";

export function ProjectManagementScreen({ pageData }: ProjectManagementScreenProps) {
  const mounted = useMounted();
  const router = useRouter();
  const [, startTransition] = useTransition();
  const [activeSection, setActiveSection] = useState<WorkspaceSection>("overview");
  const [inputSection, setInputSection] = useState<InputSection>("project");
  const isDatabaseMode = pageData.source === "database";
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
    document.documentElement.classList.remove("dark");
    window.localStorage.removeItem("project-management-theme");
  }, []);

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

  const sidebarItems: Array<{ id: WorkspaceSection; label: string; description: string }> = [
    { id: "overview", label: "전체 현황", description: "프로젝트와 Task 전체 흐름" },
    { id: "input", label: "입력 워크스페이스", description: "프로젝트와 Task 입력" },
    { id: "project-map", label: "프로젝트 맵", description: "계층과 연결 Task 탐색" },
    { id: "project-tasks", label: "프로젝트 Task", description: "선택 프로젝트 Task 조회" },
    { id: "assignee", label: "담당자 기준", description: "담당자별 실행 현황" },
    { id: "system", label: "시스템 현황", description: "사용자, 부서, 알림 현황" },
  ];

  const sectionMeta: Record<WorkspaceSection, { title: string; description: string }> = {
    overview: {
      title: "전체 현황",
      description: "프로젝트 진행 현황과 전체 Task 흐름을 한 곳에서 빠르게 확인합니다.",
    },
    input: {
      title: "입력 워크스페이스",
      description: "입력은 이 한 화면에서만 시작하고, 필요한 프로젝트를 기준으로 바로 등록합니다.",
    },
    "project-map": {
      title: "프로젝트 맵",
      description: "루트 프로젝트부터 펼쳐 보며 하위 구조와 연결 Task를 한 눈에 확인합니다.",
    },
    "project-tasks": {
      title: "프로젝트 Task",
      description: "선택한 프로젝트 범위의 Task만 밀도 있게 모아서 봅니다.",
    },
    assignee: {
      title: "담당자 기준",
      description: "담당자별로 업무량과 진행 상태를 빠르게 확인합니다.",
    },
    system: {
      title: "시스템 현황",
      description: "사용자, 부서, 알림 같은 운영 기반 데이터를 확인합니다.",
    },
  };

  const renderInputWorkspace = () => (
    <section className="space-y-5">
      <Card className="space-y-5 border-amber-100 bg-white">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
          <div className="space-y-2">
            <span className="inline-flex w-fit rounded-full bg-amber-50 px-3 py-1 text-xs font-semibold tracking-[0.14em] text-amber-700">
              INPUT WORKSPACE
            </span>
            <div>
              <h2 className="text-2xl font-semibold tracking-tight text-slate-900">입력 워크스페이스</h2>
              <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-500">
                프로젝트와 Task 입력은 여기서만 시작합니다. 프로젝트 맵에서 대상을 고른 뒤 바로 등록해 주세요.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={handleOpenRootProjectForm}
              className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-900 transition hover:bg-slate-50"
            >
              프로젝트 입력
            </button>
            <button
              type="button"
              onClick={handleStartChildProjectEntry}
              className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-900 transition hover:bg-slate-50"
            >
              하위 프로젝트 입력
            </button>
            <button
              type="button"
              onClick={handleStartTaskEntry}
              className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-900 transition hover:bg-slate-50"
            >
              Task 입력
            </button>
            <button
              type="button"
              onClick={handleStartProjectEdit}
              className="rounded-xl bg-slate-900 px-3 py-2 text-sm font-semibold text-white transition hover:bg-slate-800"
            >
              수정
            </button>
            <button
              type="button"
              onClick={handleStartProjectDelete}
              className="rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-sm font-semibold text-rose-600 transition hover:bg-rose-100"
            >
              프로젝트 삭제
            </button>
          </div>
        </div>

        {inputSection === "project" ? (
          <div className="rounded-[26px] border border-slate-200/90 bg-white p-5">
            {projectFormState ? (
              <div className="space-y-4">
                <div>
                  <h3 className="text-lg font-semibold text-slate-900">
                    {projectFormState.mode === "edit"
                      ? "프로젝트 수정"
                      : projectFormState.mode === "create-child"
                        ? "하위 프로젝트 입력"
                        : "프로젝트 입력"}
                  </h3>
                  <p className="mt-1 text-sm text-slate-500">
                    {projectFormState.mode === "create-child"
                      ? "선택한 프로젝트 아래에 새 하위 프로젝트를 등록합니다."
                      : projectFormState.mode === "edit"
                        ? "선택한 프로젝트 정보를 여기서 수정합니다."
                        : "새 루트 프로젝트의 기본 정보를 입력해 주세요."}
                  </p>
                </div>
                <ProjectForm
                  mode={projectFormState.mode === "edit" ? "edit" : "create"}
                  parentProject={
                    projectFormState.mode === "create-child"
                      ? projects.find((project) => project.id === projectFormState.parentId) ?? null
                      : null
                  }
                  initialProject={editingProject}
                  onSubmit={handleProjectFormSubmit}
                  onCancel={closeProjectForm}
                />
              </div>
            ) : (
              <div className="rounded-[24px] border border-dashed border-slate-300 bg-slate-50 px-6 py-12 text-center text-sm text-slate-500">
                위의 프로젝트 입력, 하위 프로젝트 입력, 수정 버튼 중 하나를 눌러 바로 시작해 주세요.
              </div>
            )}
          </div>
        ) : (
          <div className="rounded-[26px] border border-slate-200/90 bg-white p-5">
            <div className="mb-4 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-500">
              대상 프로젝트
              <p className="mt-1 font-semibold text-slate-900">
                {selectedProject?.name ?? "먼저 프로젝트 맵에서 프로젝트를 선택해 주세요."}
              </p>
            </div>
            {taskFormState ? (
              <div className="space-y-4">
                <div>
                  <h3 className="text-lg font-semibold text-slate-900">
                    {taskFormState.mode === "edit" ? "Task 수정" : "Task 생성"}
                  </h3>
                  <p className="mt-1 text-sm text-slate-500">
                    일정, 우선순위, 상태, 메모까지 한 번에 입력할 수 있습니다.
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
              <div className="rounded-[24px] border border-dashed border-slate-300 bg-slate-50 px-6 py-12 text-center text-sm text-slate-500">
                위의 Task 입력 버튼을 눌러 바로 Task 등록을 시작해 주세요.
              </div>
            )}
          </div>
        )}
      </Card>
    </section>
  );

  const renderActiveSection = () => {
    if (activeSection === "overview") {
      return <Dashboard projects={projects} tasks={tasks} onExportAllTasks={() => downloadTasksCsv(projects, tasks, null)} />;
    }

    if (activeSection === "project-map") {
      return (
        <ProjectTree
          projects={projects}
          tasks={tasks}
          selectedProjectId={selectedProject?.id ?? null}
          isDatabaseMode={isDatabaseMode}
          onDeleteProject={handleDeleteProject}
          onDuplicateProject={handleDuplicateProject}
        />
      );
    }

    if (activeSection === "project-tasks") {
      return (
        <section className="space-y-5">
          <div className="flex justify-end">
            <button
              type="button"
              onClick={() => setActiveSection("project-map")}
              className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
            >
              프로젝트 맵 보기
            </button>
          </div>
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
        <section className="flex flex-col gap-4 xl:flex-row xl:items-start">
          <aside className="xl:w-[220px] xl:flex-none">
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

          <section className="min-w-0 xl:flex-1">
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
        <div className="mx-auto flex max-w-7xl items-center justify-center rounded-[32px] border border-amber-100 bg-white p-12 text-slate-700">
          데이터를 불러오는 중입니다...
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top_right,rgba(14,165,233,0.10),transparent_28%),radial-gradient(circle_at_bottom_left,rgba(245,158,11,0.10),transparent_30%),linear-gradient(180deg,#f8fbff_0%,#eef4fb_100%)] px-4 py-6 text-slate-900 md:px-6 lg:px-8">
      <div className="mx-auto max-w-[2000px] space-y-5">
        <section className="overflow-hidden rounded-[30px] border border-white/70 bg-[linear-gradient(135deg,rgba(255,255,255,0.97)_0%,rgba(243,248,255,0.97)_100%)] px-6 py-5 shadow-[0_18px_48px_rgba(71,85,105,0.08)]">
          <h1 className="text-4xl font-semibold tracking-tight text-slate-950 md:text-[42px]">프로젝트 관리 워크스페이스</h1>
        </section>

        <div className="flex flex-col gap-4 xl:flex-row xl:items-start">
          <aside className="xl:sticky xl:top-6 xl:w-[220px] xl:flex-none">
            <Card className="overflow-hidden border-amber-100 bg-white/95 p-0">
              <div className="border-b border-slate-200 bg-[linear-gradient(135deg,#fffaf0_0%,#f5f9ff_100%)] px-4 py-4">
                <h2 className="text-xl font-semibold text-slate-900">프로젝트 컨트롤</h2>
              </div>

              <div className="space-y-2 px-3 py-3">
                {sidebarItems.map((item) => {
                  const isActive = activeSection === item.id;

                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => setActiveSection(item.id)}
                      className={cn(
                        "w-full rounded-[16px] border px-3 py-3 text-left transition",
                        isActive
                          ? "border-sky-200 bg-sky-50 text-sky-700 shadow-[0_10px_22px_rgba(14,165,233,0.08)]"
                          : "border-slate-200 bg-white text-slate-700 hover:border-slate-300 hover:bg-slate-50",
                      )}
                    >
                      <p className="text-sm font-semibold">{item.label}</p>
                      <p className={cn("mt-1 text-xs", isActive ? "text-sky-600" : "text-slate-400")}>{item.description}</p>
                    </button>
                  );
                })}
              </div>
            </Card>
          </aside>

          <section className="min-w-0 space-y-4 xl:flex-1">
            <div className="rounded-[24px] border border-white/70 bg-white/94 px-5 py-4 shadow-[0_14px_32px_rgba(71,85,105,0.07)]">
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">ACTIVE VIEW</p>
              <h2 className="mt-2 text-[30px] font-semibold tracking-tight text-slate-950">{sectionMeta[activeSection].title}</h2>
              <p className="mt-2 text-sm leading-6 text-slate-500">{sectionMeta[activeSection].description}</p>
            </div>

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
