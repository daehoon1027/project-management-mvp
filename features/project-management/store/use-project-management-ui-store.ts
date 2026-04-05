"use client";

import { create } from "zustand";
import { defaultTaskFilters } from "@/lib/constants";
import type { TaskFilters } from "@/types";

export type ProjectFormState =
  | { mode: "create-root" }
  | { mode: "create-child"; parentId: string }
  | { mode: "edit"; projectId: string }
  | null;

export type TaskFormState =
  | { mode: "create"; projectId: string }
  | { mode: "edit"; taskId: string }
  | null;

type ProjectManagementUiState = {
  projectFormState: ProjectFormState;
  taskFormState: TaskFormState;
  taskFilters: TaskFilters;
  detailTaskId: string | null;
  openRootProjectForm: () => void;
  openChildProjectForm: (projectId: string) => void;
  openEditProjectForm: (projectId: string) => void;
  closeProjectForm: () => void;
  openCreateTaskForm: (projectId: string) => void;
  openEditTaskForm: (taskId: string) => void;
  closeTaskForm: () => void;
  setTaskFilters: (filters: TaskFilters) => void;
  openTaskDetail: (taskId: string) => void;
  closeTaskDetail: () => void;
};

export const useProjectManagementUiStore = create<ProjectManagementUiState>((set) => ({
  projectFormState: null,
  taskFormState: null,
  taskFilters: defaultTaskFilters,
  detailTaskId: null,
  openRootProjectForm: () => set({ projectFormState: { mode: "create-root" } }),
  openChildProjectForm: (projectId) => set({ projectFormState: { mode: "create-child", parentId: projectId } }),
  openEditProjectForm: (projectId) => set({ projectFormState: { mode: "edit", projectId } }),
  closeProjectForm: () => set({ projectFormState: null }),
  openCreateTaskForm: (projectId) => set({ taskFormState: { mode: "create", projectId } }),
  openEditTaskForm: (taskId) => set({ taskFormState: { mode: "edit", taskId } }),
  closeTaskForm: () => set({ taskFormState: null }),
  setTaskFilters: (taskFilters) => set({ taskFilters }),
  openTaskDetail: (taskId) => set({ detailTaskId: taskId }),
  closeTaskDetail: () => set({ detailTaskId: null }),
}));

