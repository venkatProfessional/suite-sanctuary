export type Priority = 'Low' | 'Medium' | 'High';
export type TestCaseStatus = 'Draft' | 'Active' | 'Archived';
export type ExecutionStatus = 'Pass' | 'Fail' | 'Skipped' | 'Blocked' | 'In Progress' | 'Not Run' | 'Not Executed' | 'Other';
export type TestRunStatus = 'Not Started' | 'In Progress' | 'Completed' | 'Paused' | 'Cancelled';

export interface TestStep {
  id: string;
  description: string;
  expectedResult: string;
}

export interface TestCase {
  id: string;
  title: string;
  description: string;
  preconditions: string;
  steps: TestStep[];
  expectedResults: string;
  actualResult?: string;
  priority: Priority;
  status: TestCaseStatus;
  executionStatus?: ExecutionStatus;
  customStatus?: string;
  tags: string[];
  screenshots?: FileAttachment[];
  createdAt: string;
  updatedAt: string;
  version: number;
  suiteId?: string;
}

export interface TestSuite {
  id: string;
  name: string;
  description: string;
  parentId?: string;
  testCaseIds: string[];
  tags?: string[];
  priority?: Priority;
  groups?: string[];
  createdAt: string;
  updatedAt: string;
}

export interface TestExecution {
  id: string;
  testCaseId: string;
  status: ExecutionStatus;
  comments: string;
  actualResult?: string;
  attachments: FileAttachment[];
  executedAt: string;
  executedBy: string;
  runId: string;
  startedAt?: string;
  duration?: number; // in seconds
  stepResults?: TestStepResult[];
}

export interface TestStepResult {
  stepId: string;
  status: ExecutionStatus;
  actualResult: string;
  comments?: string;
  screenshots?: FileAttachment[];
}

export interface TestRun {
  id: string;
  name: string;
  description: string;
  projectId?: string;
  suiteIds: string[];
  testCaseIds: string[];
  executions: TestExecution[];
  status: TestRunStatus;
  assignedTo?: string[];
  createdAt: string;
  updatedAt: string;
  startedAt?: string;
  completedAt?: string;
  pausedAt?: string;
  currentExecutionIndex?: number;
}

export interface FileAttachment {
  id: string;
  name: string;
  size: number;
  type: string;
  base64Data: string;
  uploadedAt: string;
}

export interface TestCaseHistory {
  id: string;
  testCaseId: string;
  version: number;
  changes: Partial<TestCase>;
  changedAt: string;
  changeType: 'Created' | 'Updated' | 'Deleted' | 'Restored';
}

export interface AuditLog {
  id: string;
  action: string;
  entityType: 'TestCase' | 'TestSuite' | 'TestRun' | 'TestExecution';
  entityId: string;
  userId: string;
  timestamp: string;
  details: Record<string, any>;
}

export interface FilterOptions {
  status?: TestCaseStatus[];
  priority?: Priority[];
  tags?: string[];
  searchQuery?: string;
  suiteId?: string;
}

export interface SortOptions {
  field: 'title' | 'priority' | 'status' | 'createdAt' | 'updatedAt';
  direction: 'asc' | 'desc';
}

export interface PaginationOptions {
  page: number;
  limit: number;
}

export interface DashboardMetrics {
  totalTestCases: number;
  testCasesByStatus: Record<TestCaseStatus, number>;
  testCasesByPriority: Record<Priority, number>;
  executionMetrics: {
    totalExecutions: number;
    passRate: number;
    failRate: number;
    skipRate: number;
    blockRate: number;
  };
  recentActivity: AuditLog[];
}

export interface ExportOptions {
  format: 'xlsx' | 'csv' | 'json';
  includeHistory: boolean;
  includeExecutions: boolean;
  filters?: FilterOptions;
}

export interface User {
  id: string;
  username: string;
  email: string;
  role: 'admin' | 'tester';
  createdAt: string;
  lastLogin?: string;
}

export interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
}