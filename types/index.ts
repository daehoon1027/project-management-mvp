export type Priority = "low" | "medium" | "high" | "urgent";
export type TaskStatus = "planned" | "in_progress" | "in_review" | "approval_pending" | "done" | "on_hold";
export type ProjectStatus = "planned" | "active" | "internal_review" | "approval_pending" | "done" | "on_hold";
export type ThemeMode = "light" | "dark";
export type DetailViewMode = "list" | "board" | "timeline" | "calendar";
export type ProjectListTab = "active" | "archived";
export type DeadlineStatus = "overdue" | "due_soon" | "upcoming" | "none";
export type UserRole = "admin" | "manager" | "member";
export type NotificationType = "due_soon" | "overdue" | "assignee_changed" | "approval_requested" | "comment_added";
export type ApprovalStatus = "not_required" | "pending" | "approved" | "rejected";

export type ProjectColor =
  | "slate"
  | "blue"
  | "emerald"
  | "amber"
  | "rose"
  | "violet"
  | "cyan";

export type ChecklistItem = {
  id: string;
  text: string;
  isCompleted: boolean;
  createdAt: string;
};

export type ApprovalInfo = {
  status: ApprovalStatus;
  approverId: string | null;
  approvedAt: string | null;
};

export type Department = {
  id: string;
  name: string;
  code: string;
  description: string;
  createdAt: string;
  updatedAt: string;
};

export type User = {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  departmentId: string | null;
  title: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
};

export type Project = {
  id: string;
  name: string;
  description: string;
  parentId: string | null;
  depth: number;
  progress: number;
  color: ProjectColor;
  status: ProjectStatus;
  isFavorite: boolean;
  isArchived: boolean;
  archivedAt: string | null;
  departmentId: string | null;
  ownerId: string | null;
  createdById: string | null;
  updatedById: string | null;
  approval: ApprovalInfo;
  createdAt: string;
  updatedAt: string;
};

export type Task = {
  id: string;
  projectId: string;
  parentTaskId: string | null;
  title: string;
  description: string;
  assignee: string;
  assigneeId: string | null;
  priority: Priority;
  status: TaskStatus;
  isCompleted: boolean;
  startDate: string;
  dueDate: string;
  memo: string;
  checklist: ChecklistItem[];
  approval: ApprovalInfo;
  createdById: string | null;
  updatedById: string | null;
  createdAt: string;
  updatedAt: string;
};

export type Comment = {
  id: string;
  taskId: string;
  authorId: string;
  body: string;
  createdAt: string;
  updatedAt: string;
};

export type ActivityLog = {
  id: string;
  entityType: "project" | "task" | "comment";
  entityId: string;
  action: string;
  actorId: string | null;
  projectId?: string | null;
  taskId?: string | null;
  message: string;
  meta?: Record<string, string | number | boolean | null>;
  createdAt: string;
};

export type Attachment = {
  id: string;
  entityType: "project" | "task";
  entityId: string;
  fileName: string;
  storageKey: string;
  mimeType: string;
  size: number;
  createdById: string | null;
  createdAt: string;
};

export type Notification = {
  id: string;
  type: NotificationType;
  userId: string | null;
  title: string;
  body: string;
  isRead: boolean;
  relatedEntityType: "project" | "task" | "comment" | null;
  relatedEntityId: string | null;
  createdAt: string;
};

export type ProjectInput = {
  name: string;
  description: string;
  parentId: string | null;
  color?: ProjectColor;
};

export type TaskInput = Omit<Task, "id" | "projectId" | "createdAt" | "updatedAt">;
export type TaskPatch = Partial<TaskInput>;

export type TaskFilters = {
  query: string;
  completed: "all" | "done" | "open";
  status: "all" | TaskStatus;
  priority: "all" | Priority;
  assignee: string;
  sortBy: "dueDate" | "priority" | "updatedAt" | "title";
  hideCompleted: boolean;
};

export type ProjectSummary = {
  project: Project;
  openTasks: number;
  totalTasks: number;
};

export type AssigneeSummary = {
  assignee: string;
  total: number;
  done: number;
  overdue: number;
  dueSoon: number;
};

export type ProjectManagementSnapshot = {
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
};

export type ProjectManagementDataSource = "sample" | "database";
