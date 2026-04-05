import { mockActivityLogs, mockComments, mockDepartments, mockNotifications, mockUsers } from "@/lib/mock-company-data";
import { getInitialData } from "@/lib/sample-data";
import type { ProjectManagementPageData } from "@/features/project-management/server/dto/project-management.dto";
import { buildProjectManagementSnapshot } from "@/features/project-management/server/mappers/project-management.mapper";
import { isDatabaseConfigured } from "@/server/db/runtime";
import { listActivityLogs } from "@/server/repositories/activity-log.repository";
import { listComments } from "@/server/repositories/comment.repository";
import { listNotifications } from "@/server/repositories/notification.repository";
import { listProjects } from "@/server/repositories/project.repository";
import { listTasks } from "@/server/repositories/task.repository";
import { listDepartments, listUsers } from "@/server/repositories/user.repository";

function getSamplePageData(): ProjectManagementPageData {
  const initialData = getInitialData();

  return {
    source: "sample",
    snapshot: {
      users: mockUsers,
      departments: mockDepartments,
      comments: mockComments,
      activityLogs: mockActivityLogs,
      notifications: mockNotifications,
      currentUserId: "user-admin",
      projects: initialData.projects,
      tasks: initialData.tasks,
      selectedProjectId: initialData.selectedProjectId,
      expandedProjectIds: initialData.expandedProjectIds,
    },
  };
}

export async function getProjectManagementPageData(): Promise<ProjectManagementPageData> {
  const fallbackPageData = getSamplePageData();

  if (!isDatabaseConfigured()) {
    return fallbackPageData;
  }

  try {
    const [departments, users, projects, tasks, comments, notifications, activityLogs] = await Promise.all([
      listDepartments(),
      listUsers(),
      listProjects(),
      listTasks(),
      listComments(),
      listNotifications(),
      listActivityLogs(),
    ]);

    return {
      source: "database",
      snapshot: buildProjectManagementSnapshot({
        departments,
        users,
        projects,
        tasks,
        comments,
        notifications,
        activityLogs,
        currentUserId: users[0]?.id ?? null,
      }),
    };
  } catch (error) {
    console.error("Failed to load project management data from database.", error);
    return fallbackPageData;
  }
}
