import type { Project, User, UserRole } from "@/types";

export type PermissionAction =
  | "project.read"
  | "project.write"
  | "project.archive"
  | "task.read"
  | "task.write"
  | "comment.write"
  | "admin.manage";

function hasRole(user: User | null | undefined, role: UserRole) {
  return user?.role === role;
}

export function can(user: User | null | undefined, action: PermissionAction, project?: Project | null) {
  if (!user) {
    return false;
  }

  if (hasRole(user, "admin")) {
    return true;
  }

  if (action === "admin.manage") {
    return false;
  }

  if (hasRole(user, "manager")) {
    if (!project) {
      return true;
    }

    return !project.departmentId || project.departmentId === user.departmentId;
  }

  if (action === "project.read" || action === "task.read" || action === "comment.write") {
    return true;
  }

  return false;
}
