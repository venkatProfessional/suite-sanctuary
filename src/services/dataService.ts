import { v4 as uuidv4 } from 'uuid';
import { 
  TestCase, 
  TestSuite, 
  TestRun, 
  TestExecution, 
  TestCaseHistory, 
  AuditLog,
  FilterOptions,
  SortOptions,
  PaginationOptions,
  Priority,
  TestCaseStatus,
  ExecutionStatus 
} from '../types';

class DataService {
  private readonly STORAGE_KEYS = {
    TEST_CASES: 'tcmt_test_cases',
    TEST_SUITES: 'tcmt_test_suites',
    TEST_RUNS: 'tcmt_test_runs',
    TEST_EXECUTIONS: 'tcmt_test_executions',
    HISTORY: 'tcmt_history',
    AUDIT_LOGS: 'tcmt_audit_logs',
    SETTINGS: 'tcmt_settings'
  };

  // Generic storage methods
  private getFromStorage<T>(key: string, defaultValue: T): T {
    try {
      const item = localStorage.getItem(key);
      return item ? JSON.parse(item) : defaultValue;
    } catch (error) {
      console.error(`Error reading ${key} from localStorage:`, error);
      return defaultValue;
    }
  }

  private setToStorage<T>(key: string, value: T): void {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch (error) {
      console.error(`Error saving ${key} to localStorage:`, error);
      if (error instanceof DOMException && error.code === DOMException.QUOTA_EXCEEDED_ERR) {
        throw new Error('Storage quota exceeded. Please backup and clear old data.');
      }
      throw error;
    }
  }

  // Test Cases
  getTestCases(): TestCase[] {
    return this.getFromStorage(this.STORAGE_KEYS.TEST_CASES, []);
  }

  getTestCase(id: string): TestCase | null {
    const testCases = this.getTestCases();
    return testCases.find(tc => tc.id === id) || null;
  }

  saveTestCase(testCase: Partial<TestCase>): TestCase {
    const testCases = this.getTestCases();
    const now = new Date().toISOString();
    
    if (testCase.id) {
      // Update existing
      const index = testCases.findIndex(tc => tc.id === testCase.id);
      if (index >= 0) {
        const existing = testCases[index];
        const updated = {
          ...existing,
          ...testCase,
          updatedAt: now,
          version: existing.version + 1
        };
        testCases[index] = updated;
        this.setToStorage(this.STORAGE_KEYS.TEST_CASES, testCases);
        this.logAudit('Updated test case', 'TestCase', updated.id);
        this.saveHistory(updated, 'Updated');
        return updated;
      }
    }
    
    // Create new
    const newTestCase: TestCase = {
      id: uuidv4(),
      title: testCase.title || '',
      description: testCase.description || '',
      preconditions: testCase.preconditions || '',
      steps: testCase.steps || [],
      expectedResults: testCase.expectedResults || '',
      actualResult: testCase.actualResult || '',
      priority: testCase.priority || 'Medium',
      status: testCase.status || 'Draft',
      executionStatus: testCase.executionStatus || 'Not Run',
      customStatus: testCase.customStatus,
      tags: testCase.tags || [],
      screenshots: testCase.screenshots || [],
      createdAt: now,
      updatedAt: now,
      version: 1,
      suiteId: testCase.suiteId
    };
    
    testCases.push(newTestCase);
    this.setToStorage(this.STORAGE_KEYS.TEST_CASES, testCases);
    this.logAudit('Created test case', 'TestCase', newTestCase.id);
    this.saveHistory(newTestCase, 'Created');
    return newTestCase;
  }

  // Public method to access storage for other services
  public getStorageData<T>(key: string, defaultValue: T): T {
    return this.getFromStorage(key, defaultValue);
  }

  deleteTestCase(id: string): boolean {
    const testCases = this.getTestCases();
    const index = testCases.findIndex(tc => tc.id === id);
    
    if (index >= 0) {
      const deleted = testCases[index];
      testCases.splice(index, 1);
      this.setToStorage(this.STORAGE_KEYS.TEST_CASES, testCases);
      this.logAudit('Deleted test case', 'TestCase', id);
      this.saveHistory(deleted, 'Deleted');
      return true;
    }
    return false;
  }

  searchTestCases(
    filters: FilterOptions = {},
    sort: SortOptions = { field: 'createdAt', direction: 'desc' },
    pagination: PaginationOptions = { page: 1, limit: 10 }
  ): { testCases: TestCase[]; total: number; totalPages: number } {
    let testCases = this.getTestCases();

    // Apply filters
    if (filters.searchQuery) {
      const query = filters.searchQuery.toLowerCase();
      testCases = testCases.filter(tc =>
        tc.title.toLowerCase().includes(query) ||
        tc.description.toLowerCase().includes(query) ||
        tc.tags.some(tag => tag.toLowerCase().includes(query)) ||
        tc.id.toLowerCase().includes(query)
      );
    }

    if (filters.status?.length) {
      testCases = testCases.filter(tc => filters.status!.includes(tc.status));
    }

    if (filters.priority?.length) {
      testCases = testCases.filter(tc => filters.priority!.includes(tc.priority));
    }

    if (filters.tags?.length) {
      testCases = testCases.filter(tc =>
        filters.tags!.some(tag => tc.tags.includes(tag))
      );
    }

    if (filters.suiteId) {
      testCases = testCases.filter(tc => tc.suiteId === filters.suiteId);
    }

    // Apply sorting
    testCases.sort((a, b) => {
      let aValue = a[sort.field];
      let bValue = b[sort.field];

      if (typeof aValue === 'string' && typeof bValue === 'string') {
        aValue = aValue.toLowerCase();
        bValue = bValue.toLowerCase();
      }

      if (aValue < bValue) return sort.direction === 'asc' ? -1 : 1;
      if (aValue > bValue) return sort.direction === 'asc' ? 1 : -1;
      return 0;
    });

    const total = testCases.length;
    const totalPages = Math.ceil(total / pagination.limit);
    const startIndex = (pagination.page - 1) * pagination.limit;
    const paginatedTestCases = testCases.slice(startIndex, startIndex + pagination.limit);

    return {
      testCases: paginatedTestCases,
      total,
      totalPages
    };
  }

  // Test Suites
  getTestSuites(): TestSuite[] {
    return this.getFromStorage(this.STORAGE_KEYS.TEST_SUITES, []);
  }

  getTestSuite(id: string): TestSuite | null {
    const suites = this.getTestSuites();
    return suites.find(s => s.id === id) || null;
  }

  saveTestSuite(suite: Partial<TestSuite>): TestSuite {
    const suites = this.getTestSuites();
    const now = new Date().toISOString();
    
    if (suite.id) {
      const index = suites.findIndex(s => s.id === suite.id);
      if (index >= 0) {
        const updated = { ...suites[index], ...suite, updatedAt: now };
        suites[index] = updated;
        this.setToStorage(this.STORAGE_KEYS.TEST_SUITES, suites);
        this.logAudit('Updated test suite', 'TestSuite', updated.id);
        return updated;
      }
    }
    
    const newSuite: TestSuite = {
      id: uuidv4(),
      name: suite.name || '',
      description: suite.description || '',
      parentId: suite.parentId,
      testCaseIds: suite.testCaseIds || [],
      tags: suite.tags,
      priority: suite.priority,
      groups: suite.groups,
      createdAt: now,
      updatedAt: now
    };
    
    suites.push(newSuite);
    this.setToStorage(this.STORAGE_KEYS.TEST_SUITES, suites);
    this.logAudit('Created test suite', 'TestSuite', newSuite.id);
    return newSuite;
  }

  deleteTestSuite(id: string): boolean {
    const suites = this.getTestSuites();
    const index = suites.findIndex(s => s.id === id);
    
    if (index >= 0) {
      suites.splice(index, 1);
      this.setToStorage(this.STORAGE_KEYS.TEST_SUITES, suites);
      this.logAudit('Deleted test suite', 'TestSuite', id);
      return true;
    }
    
    return false;
  }

  // Test Runs & Executions
  getTestRuns(): TestRun[] {
    return this.getFromStorage(this.STORAGE_KEYS.TEST_RUNS, []);
  }

  saveTestRun(run: Partial<TestRun>): TestRun {
    const runs = this.getTestRuns();
    const now = new Date().toISOString();
    
    if (run.id) {
      const index = runs.findIndex(r => r.id === run.id);
      if (index >= 0) {
        const updated = { ...runs[index], ...run, updatedAt: now };
        runs[index] = updated;
        this.setToStorage(this.STORAGE_KEYS.TEST_RUNS, runs);
        this.logAudit('Updated test run', 'TestRun', updated.id);
        return updated;
      }
    }
    
    const newRun: TestRun = {
      id: uuidv4(),
      name: run.name || '',
      description: run.description || '',
      suiteId: run.suiteId || '',
      executions: run.executions || [],
      createdAt: now,
      updatedAt: now,
      completedAt: run.completedAt
    };
    
    runs.push(newRun);
    this.setToStorage(this.STORAGE_KEYS.TEST_RUNS, runs);
    this.logAudit('Created test run', 'TestRun', newRun.id);
    return newRun;
  }

  saveTestExecution(execution: Partial<TestExecution>): TestExecution {
    const executions = this.getFromStorage(this.STORAGE_KEYS.TEST_EXECUTIONS, []);
    const now = new Date().toISOString();
    
    if (execution.id) {
      const index = executions.findIndex(e => e.id === execution.id);
      if (index >= 0) {
        const updated = { ...executions[index], ...execution };
        executions[index] = updated;
        this.setToStorage(this.STORAGE_KEYS.TEST_EXECUTIONS, executions);
        this.logAudit('Updated test execution', 'TestExecution', updated.id);
        return updated;
      }
    }
    
    const newExecution: TestExecution = {
      id: uuidv4(),
      testCaseId: execution.testCaseId || '',
      status: execution.status || 'Not Executed',
      comments: execution.comments || '',
      attachments: execution.attachments || [],
      executedAt: now,
      executedBy: execution.executedBy || 'Current User',
      runId: execution.runId || ''
    };
    
    executions.push(newExecution);
    this.setToStorage(this.STORAGE_KEYS.TEST_EXECUTIONS, executions);
    this.logAudit('Created test execution', 'TestExecution', newExecution.id);
    return newExecution;
  }

  // History & Audit
  private saveHistory(testCase: TestCase, changeType: TestCaseHistory['changeType']): void {
    const history = this.getFromStorage(this.STORAGE_KEYS.HISTORY, []);
    const historyRecord: TestCaseHistory = {
      id: uuidv4(),
      testCaseId: testCase.id,
      version: testCase.version,
      changes: testCase,
      changedAt: new Date().toISOString(),
      changeType
    };
    
    history.push(historyRecord);
    // Keep only last 100 history records per test case
    const filtered = history.filter(h => h.testCaseId === testCase.id).slice(-100);
    const others = history.filter(h => h.testCaseId !== testCase.id);
    this.setToStorage(this.STORAGE_KEYS.HISTORY, [...others, ...filtered]);
  }

  private logAudit(action: string, entityType: AuditLog['entityType'], entityId: string, details?: Record<string, any>): void {
    const logs = this.getFromStorage(this.STORAGE_KEYS.AUDIT_LOGS, []);
    const auditLog: AuditLog = {
      id: uuidv4(),
      action,
      entityType,
      entityId,
      userId: 'current-user',
      timestamp: new Date().toISOString(),
      details: details || {}
    };
    
    logs.push(auditLog);
    // Keep only last 1000 audit logs
    if (logs.length > 1000) {
      logs.splice(0, logs.length - 1000);
    }
    this.setToStorage(this.STORAGE_KEYS.AUDIT_LOGS, logs);
  }

  getAuditLogs(limit = 50): AuditLog[] {
    const logs = this.getFromStorage(this.STORAGE_KEYS.AUDIT_LOGS, []);
    return logs.slice(-limit).reverse();
  }

  // Backup & Restore
  exportData(): string {
    const data = {
      testCases: this.getTestCases(),
      testSuites: this.getTestSuites(),
      testRuns: this.getTestRuns(),
      executions: this.getFromStorage(this.STORAGE_KEYS.TEST_EXECUTIONS, []),
      history: this.getFromStorage(this.STORAGE_KEYS.HISTORY, []),
      auditLogs: this.getFromStorage(this.STORAGE_KEYS.AUDIT_LOGS, []),
      exportedAt: new Date().toISOString(),
      version: '1.0'
    };
    return JSON.stringify(data, null, 2);
  }

  importData(jsonData: string): boolean {
    try {
      const data = JSON.parse(jsonData);
      
      if (data.testCases) this.setToStorage(this.STORAGE_KEYS.TEST_CASES, data.testCases);
      if (data.testSuites) this.setToStorage(this.STORAGE_KEYS.TEST_SUITES, data.testSuites);
      if (data.testRuns) this.setToStorage(this.STORAGE_KEYS.TEST_RUNS, data.testRuns);
      if (data.executions) this.setToStorage(this.STORAGE_KEYS.TEST_EXECUTIONS, data.executions);
      if (data.history) this.setToStorage(this.STORAGE_KEYS.HISTORY, data.history);
      if (data.auditLogs) this.setToStorage(this.STORAGE_KEYS.AUDIT_LOGS, data.auditLogs);
      
      this.logAudit('Imported data', 'TestCase', 'bulk-import');
      return true;
    } catch (error) {
      console.error('Error importing data:', error);
      return false;
    }
  }

  clearAllData(): void {
    Object.values(this.STORAGE_KEYS).forEach(key => {
      localStorage.removeItem(key);
    });
    this.logAudit('Cleared all data', 'TestCase', 'system');
  }

  // Analytics
  getMetrics() {
    const testCases = this.getTestCases();
    const executions = this.getFromStorage(this.STORAGE_KEYS.TEST_EXECUTIONS, []);
    
    const statusCounts = testCases.reduce((acc, tc) => {
      acc[tc.status] = (acc[tc.status] || 0) + 1;
      return acc;
    }, {} as Record<TestCaseStatus, number>);

    const priorityCounts = testCases.reduce((acc, tc) => {
      acc[tc.priority] = (acc[tc.priority] || 0) + 1;
      return acc;
    }, {} as Record<Priority, number>);

    const executionCounts = executions.reduce((acc, exec) => {
      acc[exec.status] = (acc[exec.status] || 0) + 1;
      return acc;
    }, {} as Record<ExecutionStatus, number>);

    const totalExecutions = executions.length;
    
    return {
      totalTestCases: testCases.length,
      testCasesByStatus: statusCounts,
      testCasesByPriority: priorityCounts,
      executionMetrics: {
        totalExecutions,
        passRate: totalExecutions > 0 ? (executionCounts['Pass'] || 0) / totalExecutions * 100 : 0,
        failRate: totalExecutions > 0 ? (executionCounts['Fail'] || 0) / totalExecutions * 100 : 0,
        skipRate: totalExecutions > 0 ? (executionCounts['Skipped'] || 0) / totalExecutions * 100 : 0,
        blockRate: totalExecutions > 0 ? (executionCounts['Blocked'] || 0) / totalExecutions * 100 : 0,
      },
      recentActivity: this.getAuditLogs(10)
    };
  }
}

export const dataService = new DataService();
