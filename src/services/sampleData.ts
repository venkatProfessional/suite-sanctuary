import { v4 as uuidv4 } from 'uuid';
import { TestCase, TestSuite, TestRun, TestExecution, Priority, TestCaseStatus } from '../types';
import { dataService } from './dataService';

export const createSampleData = () => {
  // Check if data already exists
  const existingTestCases = dataService.getTestCases();
  if (existingTestCases.length > 0) {
    return; // Sample data already exists
  }

  // Create sample test suites
  const loginSuite: TestSuite = {
    id: uuidv4(),
    name: 'User Authentication',
    description: 'Test suite for user login and authentication flows',
    testCaseIds: [],
    createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date().toISOString()
  };

  const dashboardSuite: TestSuite = {
    id: uuidv4(),
    name: 'Dashboard Features',
    description: 'Test suite for dashboard functionality and widgets',
    testCaseIds: [],
    createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date().toISOString()
  };

  const apiSuite: TestSuite = {
    id: uuidv4(),
    name: 'API Integration',
    description: 'Test suite for API endpoints and data handling',
    testCaseIds: [],
    createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date().toISOString()
  };

  // Save test suites
  dataService.saveTestSuite(loginSuite);
  dataService.saveTestSuite(dashboardSuite);
  dataService.saveTestSuite(apiSuite);

  // Create sample test cases
  const testCases: Partial<TestCase>[] = [
    {
      title: 'Valid User Login',
      description: 'Test successful login with valid credentials',
      preconditions: 'User has valid account credentials',
      steps: [
        { id: uuidv4(), description: 'Navigate to login page', expectedResult: 'Login page is displayed' },
        { id: uuidv4(), description: 'Enter valid username and password', expectedResult: 'Credentials are accepted' },
        { id: uuidv4(), description: 'Click login button', expectedResult: 'User is redirected to dashboard' }
      ],
      expectedResults: 'User successfully logs in and sees dashboard',
      priority: 'High' as Priority,
      status: 'Active' as TestCaseStatus,
      tags: ['login', 'authentication', 'smoke'],
      suiteId: loginSuite.id
    },
    {
      title: 'Invalid Password Login Attempt',
      description: 'Test login failure with incorrect password',
      preconditions: 'User has valid username but incorrect password',
      steps: [
        { id: uuidv4(), description: 'Navigate to login page', expectedResult: 'Login page is displayed' },
        { id: uuidv4(), description: 'Enter valid username and invalid password', expectedResult: 'Credentials are entered' },
        { id: uuidv4(), description: 'Click login button', expectedResult: 'Error message is displayed' }
      ],
      expectedResults: 'Login fails with appropriate error message',
      priority: 'High' as Priority,
      status: 'Active' as TestCaseStatus,
      tags: ['login', 'authentication', 'negative'],
      suiteId: loginSuite.id
    },
    {
      title: 'Dashboard Widget Loading',
      description: 'Verify dashboard widgets load correctly',
      preconditions: 'User is logged in to application',
      steps: [
        { id: uuidv4(), description: 'Navigate to dashboard', expectedResult: 'Dashboard page loads' },
        { id: uuidv4(), description: 'Observe widget loading', expectedResult: 'All widgets display data' },
        { id: uuidv4(), description: 'Refresh page', expectedResult: 'Widgets reload successfully' }
      ],
      expectedResults: 'All dashboard widgets display correct data',
      priority: 'Medium' as Priority,
      status: 'Active' as TestCaseStatus,
      tags: ['dashboard', 'widgets', 'ui'],
      suiteId: dashboardSuite.id
    },
    {
      title: 'Dashboard Responsive Design',
      description: 'Test dashboard layout on different screen sizes',
      preconditions: 'User is logged in and on dashboard',
      steps: [
        { id: uuidv4(), description: 'View dashboard on desktop', expectedResult: 'Layout is properly arranged' },
        { id: uuidv4(), description: 'Resize to tablet view', expectedResult: 'Layout adapts correctly' },
        { id: uuidv4(), description: 'Resize to mobile view', expectedResult: 'Mobile layout is displayed' }
      ],
      expectedResults: 'Dashboard is responsive across all screen sizes',
      priority: 'Medium' as Priority,
      status: 'Draft' as TestCaseStatus,
      tags: ['dashboard', 'responsive', 'ui'],
      suiteId: dashboardSuite.id
    },
    {
      title: 'API Data Retrieval',
      description: 'Test successful data retrieval from API endpoints',
      preconditions: 'API server is running and accessible',
      steps: [
        { id: uuidv4(), description: 'Send GET request to user endpoint', expectedResult: 'User data is returned' },
        { id: uuidv4(), description: 'Verify response format', expectedResult: 'JSON format is correct' },
        { id: uuidv4(), description: 'Check response time', expectedResult: 'Response within acceptable limits' }
      ],
      expectedResults: 'API returns correct user data in proper format',
      priority: 'High' as Priority,
      status: 'Active' as TestCaseStatus,
      tags: ['api', 'backend', 'performance'],
      suiteId: apiSuite.id
    },
    {
      title: 'API Error Handling',
      description: 'Test API error responses and handling',
      preconditions: 'API server is configured for error testing',
      steps: [
        { id: uuidv4(), description: 'Send request with invalid token', expectedResult: '401 error is returned' },
        { id: uuidv4(), description: 'Send malformed request', expectedResult: '400 error is returned' },
        { id: uuidv4(), description: 'Test server timeout', expectedResult: 'Timeout error is handled' }
      ],
      expectedResults: 'API errors are properly handled and reported',
      priority: 'Medium' as Priority,
      status: 'Archived' as TestCaseStatus,
      tags: ['api', 'error-handling', 'negative'],
      suiteId: apiSuite.id
    },
    {
      title: 'Password Reset Flow',
      description: 'Test password reset functionality',
      preconditions: 'User has valid email address',
      steps: [
        { id: uuidv4(), description: 'Click forgot password link', expectedResult: 'Password reset form appears' },
        { id: uuidv4(), description: 'Enter email address', expectedResult: 'Email is accepted' },
        { id: uuidv4(), description: 'Check email for reset link', expectedResult: 'Reset email is received' }
      ],
      expectedResults: 'Password reset email is sent and link works',
      priority: 'Low' as Priority,
      status: 'Draft' as TestCaseStatus,
      tags: ['authentication', 'password', 'email'],
      suiteId: loginSuite.id
    },
    {
      title: 'User Session Management',
      description: 'Test user session timeout and management',
      preconditions: 'User is logged in with active session',
      steps: [
        { id: uuidv4(), description: 'Login to application', expectedResult: 'Session is created' },
        { id: uuidv4(), description: 'Wait for session timeout period', expectedResult: 'Session expires' },
        { id: uuidv4(), description: 'Try to access protected resource', expectedResult: 'User is redirected to login' }
      ],
      expectedResults: 'Session management works as expected',
      priority: 'Medium' as Priority,
      status: 'Active' as TestCaseStatus,
      tags: ['session', 'security', 'timeout'],
      suiteId: loginSuite.id
    }
  ];

  // Save test cases
  const savedTestCases = testCases.map(tc => dataService.saveTestCase(tc));

  // Create sample test executions
  const executions: Partial<TestExecution>[] = [
    {
      testCaseId: savedTestCases[0].id,
      status: 'Pass',
      comments: 'Login functionality works as expected',
      attachments: [],
      executedBy: 'Test Engineer 1',
      runId: 'sample-run-1'
    },
    {
      testCaseId: savedTestCases[1].id,
      status: 'Pass',
      comments: 'Error message displays correctly',
      attachments: [],
      executedBy: 'Test Engineer 1',
      runId: 'sample-run-1'
    },
    {
      testCaseId: savedTestCases[2].id,
      status: 'Fail',
      comments: 'Widget loading timeout on slow connection',
      attachments: [],
      executedBy: 'Test Engineer 2',
      runId: 'sample-run-2'
    },
    {
      testCaseId: savedTestCases[4].id,
      status: 'Pass',
      comments: 'API response time within limits',
      attachments: [],
      executedBy: 'Test Engineer 2',
      runId: 'sample-run-2'
    },
    {
      testCaseId: savedTestCases[7].id,
      status: 'Skipped',
      comments: 'Session timeout testing postponed',
      attachments: [],
      executedBy: 'Test Engineer 3',
      runId: 'sample-run-3'
    },
    {
      testCaseId: savedTestCases[0].id,
      status: 'Blocked',
      comments: 'Test environment unavailable',
      attachments: [],
      executedBy: 'Test Engineer 3',
      runId: 'sample-run-4'
    }
  ];

  // Save test executions
  executions.forEach(exec => dataService.saveTestExecution(exec));

  // Create sample test runs
  const testRuns: Partial<TestRun>[] = [
    {
      name: 'Sprint 1 Regression',
      description: 'Regression testing for Sprint 1 features',
      suiteId: loginSuite.id,
      executions: []
    },
    {
      name: 'Dashboard Feature Testing',
      description: 'Focused testing on dashboard functionality',
      suiteId: dashboardSuite.id,
      executions: []
    },
    {
      name: 'API Integration Tests',
      description: 'Testing API integrations and data flow',
      suiteId: apiSuite.id,
      executions: []
    }
  ];

  // Save test runs
  testRuns.forEach(run => dataService.saveTestRun(run));

  console.log('Sample data created successfully!');
};

// Initialize sample data when the service is loaded
export const initializeSampleData = () => {
  try {
    createSampleData();
  } catch (error) {
    console.error('Error creating sample data:', error);
  }
};