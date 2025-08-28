import React, { useState, useEffect } from 'react';
import { Eye, Edit, Trash2, FileText, Clock, Users, Target, CheckCircle, XCircle, AlertCircle, Minus } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { TestSuite, TestCase, ExecutionStatus } from '@/types';
import { dataService } from '@/services/dataService';

interface TestSuiteDetailProps {
  testSuite: TestSuite;
  onEdit?: () => void;
  onClose?: () => void;
}

export const TestSuiteDetail: React.FC<TestSuiteDetailProps> = ({
  testSuite,
  onEdit,
  onClose
}) => {
  const [testCases, setTestCases] = useState<TestCase[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadTestCases();
  }, [testSuite.id]);

  const loadTestCases = () => {
    try {
      const allTestCases = dataService.getTestCases();
      const suiteTestCases = allTestCases.filter(tc => tc.suiteId === testSuite.id);
      setTestCases(suiteTestCases);
    } catch (error) {
      console.error('Error loading test cases:', error);
    } finally {
      setLoading(false);
    }
  };

  const getExecutionStatusColor = (status?: ExecutionStatus | string) => {
    switch (status) {
      case 'Pass': return 'text-execution-pass';
      case 'Fail': return 'text-execution-fail';
      case 'Blocked': return 'text-execution-block';
      case 'Skipped': return 'text-execution-skip';
      case 'In Progress': return 'text-execution-progress';
      case 'Not Run': return 'text-muted-foreground';
      case 'Other': return 'text-secondary-foreground';
      default: return 'text-muted-foreground';
    }
  };

  const getExecutionStatusIcon = (status?: ExecutionStatus | string) => {
    switch (status) {
      case 'Pass': return <CheckCircle className="w-4 h-4" />;
      case 'Fail': return <XCircle className="w-4 h-4" />;
      case 'Blocked': return <AlertCircle className="w-4 h-4" />;
      case 'Skipped': return <Minus className="w-4 h-4" />;
      case 'In Progress': return <Clock className="w-4 h-4" />;
      default: return <Clock className="w-4 h-4" />;
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'High': return 'bg-priority-high/10 text-priority-high border-priority-high/20';
      case 'Medium': return 'bg-priority-medium/10 text-priority-medium border-priority-medium/20';
      case 'Low': return 'bg-priority-low/10 text-priority-low border-priority-low/20';
      default: return 'bg-muted/10 text-muted-foreground border-muted/20';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Active': return 'bg-status-active/10 text-status-active border-status-active/20';
      case 'Draft': return 'bg-status-draft/10 text-status-draft border-status-draft/20';
      case 'Archived': return 'bg-status-archived/10 text-status-archived border-status-archived/20';
      default: return 'bg-muted/10 text-muted-foreground border-muted/20';
    }
  };

  // Calculate execution metrics
  const executionStats = testCases.reduce((acc, testCase) => {
    const status = testCase.executionStatus || 'Not Run';
    acc[status] = (acc[status] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const totalExecuted = testCases.filter(tc => tc.executionStatus && tc.executionStatus !== 'Not Run').length;
  const passedTests = executionStats['Pass'] || 0;
  const passRate = totalExecuted > 0 ? Math.round((passedTests / totalExecuted) * 100) : 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="space-y-2">
          <h2 className="text-2xl font-bold text-foreground">{testSuite.name}</h2>
          <p className="text-muted-foreground">{testSuite.description}</p>
          <div className="flex items-center gap-2">
            {testSuite.priority && (
              <Badge variant="outline" className={getPriorityColor(testSuite.priority)}>
                {testSuite.priority} Priority
              </Badge>
            )}
            {testSuite.groups && testSuite.groups.map(group => (
              <Badge key={group} variant="secondary">
                {group}
              </Badge>
            ))}
            {testSuite.tags && testSuite.tags.map(tag => (
              <Badge key={tag} variant="outline">
                {tag}
              </Badge>
            ))}
          </div>
        </div>
        <div className="flex items-center gap-2">
          {onEdit && (
            <Button variant="outline" onClick={onEdit}>
              <Edit className="w-4 h-4 mr-2" />
              Edit Suite
            </Button>
          )}
          {onClose && (
            <Button variant="outline" onClick={onClose}>
              Close
            </Button>
          )}
        </div>
      </div>

      {/* Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center">
              <FileText className="w-4 h-4 mr-2" />
              Total Test Cases
            </CardTitle>
            <div className="text-2xl font-bold">{testCases.length}</div>
          </CardHeader>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center">
              <Target className="w-4 h-4 mr-2" />
              Executed
            </CardTitle>
            <div className="text-2xl font-bold">{totalExecuted}</div>
          </CardHeader>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center">
              <CheckCircle className="w-4 h-4 mr-2" />
              Pass Rate
            </CardTitle>
            <div className="text-2xl font-bold text-execution-pass">{passRate}%</div>
          </CardHeader>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center">
              <Clock className="w-4 h-4 mr-2" />
              Pending
            </CardTitle>
            <div className="text-2xl font-bold">{testCases.length - totalExecuted}</div>
          </CardHeader>
        </Card>
      </div>

      {/* Execution Status Breakdown */}
      <Card>
        <CardHeader>
          <CardTitle>Execution Status Breakdown</CardTitle>
          <CardDescription>
            Current execution status of all test cases in this suite
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {Object.entries(executionStats).map(([status, count]) => (
              <div key={status} className="flex items-center justify-between">
                <div className="flex items-center">
                  <div className={`mr-2 ${getExecutionStatusColor(status)}`}>
                    {getExecutionStatusIcon(status)}
                  </div>
                  <span className="text-sm font-medium">{status}</span>
                  <span className="text-sm text-muted-foreground ml-2">({count} cases)</span>
                </div>
                <div className="flex-1 mx-4">
                  <Progress 
                    value={testCases.length > 0 ? (count / testCases.length) * 100 : 0}
                    className="h-2"
                  />
                </div>
                <span className="text-sm font-medium">
                  {testCases.length > 0 ? Math.round((count / testCases.length) * 100) : 0}%
                </span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Test Cases Table */}
      <Card>
        <CardHeader>
          <CardTitle>Test Cases ({testCases.length})</CardTitle>
          <CardDescription>
            All test cases belonging to this test suite
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          {loading ? (
            <div className="p-6 text-center text-muted-foreground">
              Loading test cases...
            </div>
          ) : testCases.length === 0 ? (
            <div className="p-6 text-center text-muted-foreground">
              No test cases found in this suite
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Title</TableHead>
                  <TableHead>Priority</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Execution Status</TableHead>
                  <TableHead>Last Updated</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {testCases.map((testCase) => (
                  <TableRow key={testCase.id}>
                    <TableCell>
                      <div>
                        <div className="font-medium">{testCase.title}</div>
                        <div className="text-sm text-muted-foreground truncate max-w-xs">
                          {testCase.description}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className={`text-xs ${getPriorityColor(testCase.priority)}`}>
                        {testCase.priority}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className={`text-xs ${getStatusColor(testCase.status)}`}>
                        {testCase.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className={`flex items-center ${getExecutionStatusColor(testCase.executionStatus)}`}>
                        {getExecutionStatusIcon(testCase.executionStatus)}
                        <span className="ml-2 text-sm">
                          {testCase.executionStatus === 'Other' ? testCase.customStatus : testCase.executionStatus || 'Not Run'}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {new Date(testCase.updatedAt).toLocaleDateString()}
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm">
                            <Eye className="w-4 h-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem>
                            <Eye className="w-4 h-4 mr-2" />
                            View Details
                          </DropdownMenuItem>
                          <DropdownMenuItem>
                            <Edit className="w-4 h-4 mr-2" />
                            Edit
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Suite Metadata */}
      <Card>
        <CardHeader>
          <CardTitle>Suite Information</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div>
              <span className="font-medium text-muted-foreground">Created:</span>
              <div>{new Date(testSuite.createdAt).toLocaleString()}</div>
            </div>
            <div>
              <span className="font-medium text-muted-foreground">Last Updated:</span>
              <div>{new Date(testSuite.updatedAt).toLocaleString()}</div>
            </div>
            <div>
              <span className="font-medium text-muted-foreground">Test Cases:</span>
              <div>{testCases.length} cases</div>
            </div>
            <div>
              <span className="font-medium text-muted-foreground">Completion:</span>
              <div>{passRate}% passed</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};