import { getProjectPath } from "@/lib/project-tree";
import { getPriorityLabel, getStatusLabel } from "@/lib/utils";
import type { Project, Task } from "@/types";

function escapeCsvCell(value: string) {
  return `"${String(value ?? "").replaceAll('"', '""')}"`;
}

function getExportRows(projects: Project[], tasks: Task[], projectId: string | null) {
  const allowedProjectIds = projectId
    ? new Set(
        projects
          .filter((project) => getProjectPath(projects, project.id).some((node) => node.id === projectId))
          .map((project) => project.id),
      )
    : null;

  return tasks
    .filter((task) => (allowedProjectIds ? allowedProjectIds.has(task.projectId) : true))
    .map((task) => ({
      projectPath: getProjectPath(projects, task.projectId)
        .map((item) => item.name)
        .join(" / "),
      title: task.title,
      description: task.description,
      assignee: task.assignee,
      priority: getPriorityLabel(task.priority),
      status: getStatusLabel(task.status),
      completed: task.isCompleted ? "완료" : "미완료",
      startDate: task.startDate,
      dueDate: task.dueDate,
      memo: task.memo,
      updatedAt: task.updatedAt,
    }));
}

function triggerDownload(blob: Blob, fileName: string) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = fileName;
  link.click();
  URL.revokeObjectURL(url);
}

export function downloadTasksCsv(projects: Project[], tasks: Task[], projectId: string | null) {
  const rows = getExportRows(projects, tasks, projectId);
  const header = ["프로젝트 경로", "제목", "설명", "담당자", "우선순위", "상태", "완료 여부", "시작일", "마감일", "메모", "수정일"];

  const csvContent = [
    header.map(escapeCsvCell).join(","),
    ...rows.map((row) =>
      [
        row.projectPath,
        row.title,
        row.description,
        row.assignee,
        row.priority,
        row.status,
        row.completed,
        row.startDate,
        row.dueDate,
        row.memo,
        row.updatedAt,
      ]
        .map(escapeCsvCell)
        .join(","),
    ),
  ].join("\n");

  triggerDownload(
    new Blob(["\uFEFF", csvContent], { type: "text/csv;charset=utf-8;" }),
    projectId ? `tasks-${projectId}.csv` : "tasks-all.csv",
  );
}

export function downloadTasksExcel(projects: Project[], tasks: Task[], projectId: string | null) {
  const rows = getExportRows(projects, tasks, projectId);
  const html = `
    <html>
      <head>
        <meta charset="utf-8" />
      </head>
      <body>
        <table border="1">
          <thead>
            <tr>
              <th>프로젝트 경로</th>
              <th>제목</th>
              <th>설명</th>
              <th>담당자</th>
              <th>우선순위</th>
              <th>상태</th>
              <th>완료 여부</th>
              <th>시작일</th>
              <th>마감일</th>
              <th>메모</th>
              <th>수정일</th>
            </tr>
          </thead>
          <tbody>
            ${rows
              .map(
                (row) => `
                  <tr>
                    <td>${row.projectPath}</td>
                    <td>${row.title}</td>
                    <td>${row.description}</td>
                    <td>${row.assignee}</td>
                    <td>${row.priority}</td>
                    <td>${row.status}</td>
                    <td>${row.completed}</td>
                    <td>${row.startDate}</td>
                    <td>${row.dueDate}</td>
                    <td>${row.memo}</td>
                    <td>${row.updatedAt}</td>
                  </tr>
                `,
              )
              .join("")}
          </tbody>
        </table>
      </body>
    </html>
  `;

  triggerDownload(
    new Blob(["\uFEFF", html], { type: "application/vnd.ms-excel;charset=utf-8;" }),
    projectId ? `tasks-${projectId}.xls` : "tasks-all.xls",
  );
}
