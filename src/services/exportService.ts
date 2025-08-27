import * as XLSX from 'xlsx';
import { TestCase, TestSuite, TestExecution, ExportOptions } from '../types';
import { dataService } from './dataService';

class ExportService {
  private getTestExecutions(): TestExecution[] {
    try {
      const item = localStorage.getItem('tcmt_test_executions');
      return item ? JSON.parse(item) : [];
    } catch (error) {
      console.error('Error reading test executions from localStorage:', error);
      return [];
    }
  }
  exportToExcel(options: ExportOptions): void {
    const testCases = dataService.getTestCases();
    const testSuites = dataService.getTestSuites();
    const testExecutions = options.includeExecutions ? this.getTestExecutions() : [];
    
    // Apply filters if provided
    let filteredTestCases = testCases;
    if (options.filters) {
      filteredTestCases = this.applyFilters(testCases, options.filters);
    }
    
    const workbook = XLSX.utils.book_new();
    
    // Create test cases worksheet
    const testCasesData = this.prepareTestCasesData(filteredTestCases, testSuites, testExecutions);
    const testCasesWorksheet = XLSX.utils.json_to_sheet(testCasesData);
    
    // Auto-size columns
    const testCasesColWidths = this.calculateColumnWidths(testCasesData);
    testCasesWorksheet['!cols'] = testCasesColWidths;
    
    // Apply styling to headers
    this.styleHeaders(testCasesWorksheet, testCasesData);
    
    XLSX.utils.book_append_sheet(workbook, testCasesWorksheet, 'Test Cases');
    
    // Add test suites worksheet
    if (testSuites.length > 0) {
      const testSuitesData = this.prepareTestSuitesData(testSuites);
      const testSuitesWorksheet = XLSX.utils.json_to_sheet(testSuitesData);
      const testSuitesColWidths = this.calculateColumnWidths(testSuitesData);
      testSuitesWorksheet['!cols'] = testSuitesColWidths;
      this.styleHeaders(testSuitesWorksheet, testSuitesData);
      XLSX.utils.book_append_sheet(workbook, testSuitesWorksheet, 'Test Suites');
    }
    
    // Add executions worksheet if requested
    if (options.includeExecutions && testExecutions.length > 0) {
      const executionsData = this.prepareExecutionsData(testExecutions, filteredTestCases);
      const executionsWorksheet = XLSX.utils.json_to_sheet(executionsData);
      const executionsColWidths = this.calculateColumnWidths(executionsData);
      executionsWorksheet['!cols'] = executionsColWidths;
      this.styleHeaders(executionsWorksheet, executionsData);
      XLSX.utils.book_append_sheet(workbook, executionsWorksheet, 'Test Executions');
    }
    
    // Generate filename with timestamp
    const timestamp = new Date().toISOString().slice(0, 19).replace(/[:.]/g, '-');
    const filename = `test-cases-export-${timestamp}.xlsx`;
    
    // Download file
    XLSX.writeFile(workbook, filename);
  }
  
  private applyFilters(testCases: TestCase[], filters: any): TestCase[] {
    let filtered = testCases;
    
    if (filters.searchQuery) {
      const query = filters.searchQuery.toLowerCase();
      filtered = filtered.filter(tc =>
        tc.title.toLowerCase().includes(query) ||
        tc.description.toLowerCase().includes(query) ||
        tc.tags.some((tag: string) => tag.toLowerCase().includes(query))
      );
    }
    
    if (filters.status?.length) {
      filtered = filtered.filter(tc => filters.status.includes(tc.status));
    }
    
    if (filters.priority?.length) {
      filtered = filtered.filter(tc => filters.priority.includes(tc.priority));
    }
    
    if (filters.tags?.length) {
      filtered = filtered.filter(tc =>
        filters.tags.some((tag: string) => tc.tags.includes(tag))
      );
    }
    
    return filtered;
  }
  
  private prepareTestCasesData(testCases: TestCase[], testSuites: TestSuite[], executions: TestExecution[]): any[] {
    return testCases.map(tc => {
      const suite = testSuites.find(s => s.id === tc.suiteId);
      const execution = executions.find(e => e.testCaseId === tc.id);
      
      return {
        'Test Case ID': tc.id.substring(0, 8).toUpperCase(),
        'Title': tc.title,
        'Description': tc.description,
        'Test Suite': suite?.name || 'No Suite',
        'Groups': suite?.groups?.join(', ') || 'None',
        'Priority': tc.priority,
        'Status': tc.status,
        'Execution Status': tc.executionStatus || execution?.status || 'Not Executed',
        'Custom Status': tc.customStatus || '',
        'Preconditions': tc.preconditions,
        'Test Steps': tc.steps.map((step, index) => 
          `${index + 1}. ${step.description}`
        ).join('\n'),
        'Expected Results': tc.steps.map((step, index) => 
          `${index + 1}. ${step.expectedResult}`
        ).join('\n'),
        'Overall Expected Result': tc.expectedResults,
        'Tags': tc.tags.join(', '),
        'Screenshots': tc.screenshots?.length ? `${tc.screenshots.length} attached` : 'None',
        'Created Date': new Date(tc.createdAt).toLocaleDateString(),
        'Updated Date': new Date(tc.updatedAt).toLocaleDateString(),
        'Version': tc.version,
        'Execution Comments': execution?.comments || '',
        'Executed By': execution?.executedBy || '',
        'Execution Date': execution?.executedAt ? new Date(execution.executedAt).toLocaleDateString() : ''
      };
    });
  }
  
  private prepareTestSuitesData(testSuites: TestSuite[]): any[] {
    return testSuites.map(suite => ({
      'Suite ID': suite.id.substring(0, 8).toUpperCase(),
      'Name': suite.name,
      'Description': suite.description,
      'Groups': suite.groups?.join(', ') || 'None',
      'Priority': suite.priority || 'Not Set',
      'Test Cases Count': suite.testCaseIds.length,
      'Tags': suite.tags?.join(', ') || 'None',
      'Created Date': new Date(suite.createdAt).toLocaleDateString(),
      'Updated Date': new Date(suite.updatedAt).toLocaleDateString()
    }));
  }
  
  private prepareExecutionsData(executions: TestExecution[], testCases: TestCase[]): any[] {
    return executions.map(exec => {
      const testCase = testCases.find(tc => tc.id === exec.testCaseId);
      return {
        'Execution ID': exec.id.substring(0, 8).toUpperCase(),
        'Test Case ID': exec.testCaseId.substring(0, 8).toUpperCase(),
        'Test Case Title': testCase?.title || 'Unknown',
        'Status': exec.status,
        'Comments': exec.comments,
        'Executed By': exec.executedBy,
        'Execution Date': new Date(exec.executedAt).toLocaleDateString(),
        'Attachments Count': exec.attachments?.length || 0
      };
    });
  }
  
  private calculateColumnWidths(data: any[]): any[] {
    if (data.length === 0) return [];
    
    const headers = Object.keys(data[0]);
    return headers.map(header => {
      const maxLength = Math.max(
        header.length,
        ...data.map(row => String(row[header] || '').length)
      );
      return { width: Math.min(Math.max(maxLength + 2, 10), 50) };
    });
  }
  
  private styleHeaders(worksheet: any, data: any[]): void {
    if (data.length === 0) return;
    
    const headers = Object.keys(data[0]);
    headers.forEach((header, index) => {
      const cellAddress = XLSX.utils.encode_cell({ r: 0, c: index });
      if (worksheet[cellAddress]) {
        worksheet[cellAddress].s = {
          font: { bold: true, color: { rgb: "FFFFFF" } },
          fill: { fgColor: { rgb: "366092" } },
          alignment: { horizontal: "center", vertical: "center" }
        };
      }
    });
  }
}

export const exportService = new ExportService();