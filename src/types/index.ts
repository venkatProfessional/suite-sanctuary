export type Priority = 'Low' | 'Medium' | 'High';
export type TestCaseStatus = 'Draft' | 'Active' | 'Archived';
export type ExecutionStatus = 'Pass' | 'Fail' | 'Skipped' | 'Blocked' | 'Not Executed';

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
  priority: Priority;
  status: TestCaseStatus;
  tags: string[];
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
  createdAt: string;
  updatedAt: string;
}

export interface TestExecution {
  id: string;
  testCaseId: string;
  status: ExecutionStatus;
  comments: string;
  attachments: FileAttachment[];
  executedAt: string;
  executedBy: string;
  runId: string;
}

export interface TestRun {
  id: string;
  name: string;
  description: string;
  suiteId: string;
  executions: TestExecution[];
  createdAt: string;
  updatedAt: string;
  completedAt?: string;
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