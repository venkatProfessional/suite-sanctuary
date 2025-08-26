import React, { useState } from 'react';
import { CheckCircle, XCircle, Clock, AlertTriangle, MessageSquare, Paperclip } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { TestRun, TestExecution, ExecutionStatus } from '@/types';
import { dataService } from '@/services/dataService';
import { useToast } from '@/hooks/use-toast';

interface TestRunDetailProps {
  testRun: TestRun;
  onUpdate: () => void;
  onClose: () => void;
}

export function TestRunDetail({ testRun, onUpdate, onClose }: TestRunDetailProps) {
  const [editingExecution, setEditingExecution] = useState<string | null>(null);
  const [executionComments, setExecutionComments] = useState<Record<string, string>>({});
  const { toast } = useToast();

  const testCases = dataService.getTestCases();

  const getStatusIcon = (status: ExecutionStatus) => {
    switch (status) {
      case 'Pass':
        return <CheckCircle className="h-4 w-4 text-success" />;
      case 'Fail':
        return <XCircle className="h-4 w-4 text-destructive" />;
      case 'Skipped':
        return <Clock className="h-4 w-4 text-warning" />;
      case 'Blocked':
        return <AlertTriangle className="h-4 w-4 text-destructive" />;
      default:
        return <Clock className="h-4 w-4 text-muted-foreground" />;
    }
  };

  const getStatusVariant = (status: ExecutionStatus) => {
    switch (status) {
      case 'Pass':
        return 'default';
      case 'Fail':
        return 'destructive';
      case 'Skipped':
        return 'secondary';
      case 'Blocked':
        return 'destructive';
      default:
        return 'outline';
    }
  };

  const handleUpdateExecution = (executionId: string, status: ExecutionStatus, comments: string) => {
    try {
      const execution = testRun.executions.find(e => e.id === executionId);
      if (execution) {
        const updatedExecution: Partial<TestExecution> = {
          ...execution,
          status,
          comments,
          executedAt: new Date().toISOString(),
        };
        
        dataService.saveTestExecution(updatedExecution);
        onUpdate();
        setEditingExecution(null);
        setExecutionComments(prev => ({ ...prev, [executionId]: '' }));
        
        toast({
          title: 'Success',
          description: 'Test execution updated successfully',
        });
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to update test execution',
        variant: 'destructive',
      });
    }
  };

  const startEditing = (executionId: string, currentComments: string) => {
    setEditingExecution(executionId);
    setExecutionComments(prev => ({ ...prev, [executionId]: currentComments }));
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-foreground">{testRun.name}</h2>
        <p className="text-muted-foreground mt-1">{testRun.description}</p>
      </div>

      <div className="grid grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-foreground">
              {testRun.executions.length}
            </div>
            <div className="text-sm text-muted-foreground">Total Tests</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-success">
              {testRun.executions.filter(e => e.status === 'Pass').length}
            </div>
            <div className="text-sm text-muted-foreground">Passed</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-destructive">
              {testRun.executions.filter(e => e.status === 'Fail').length}
            </div>
            <div className="text-sm text-muted-foreground">Failed</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-warning">
              {testRun.executions.filter(e => e.status === 'Skipped').length}
            </div>
            <div className="text-sm text-muted-foreground">Skipped</div>
          </CardContent>
        </Card>
      </div>

      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-foreground">Test Executions</h3>
        {testRun.executions.map((execution) => {
          const testCase = testCases.find(tc => tc.id === execution.testCaseId);
          const isEditing = editingExecution === execution.id;
          
          return (
            <Card key={execution.id} className="border-l-4 border-l-primary/20">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    {getStatusIcon(execution.status)}
                    <div>
                      <CardTitle className="text-base">
                        {testCase?.title || 'Unknown Test Case'}
                      </CardTitle>
                      <p className="text-sm text-muted-foreground mt-1">
                        {testCase?.description}
                      </p>
                    </div>
                  </div>
                  <Badge variant={getStatusVariant(execution.status)}>
                    {execution.status}
                  </Badge>
                </div>
              </CardHeader>
              
              <CardContent>
                {isEditing ? (
                  <div className="space-y-4">
                    <div>
                      <label className="text-sm font-medium text-foreground">Status</label>
                      <Select
                        defaultValue={execution.status}
                        onValueChange={(value) => {
                          const newExecution = { ...execution, status: value as ExecutionStatus };
                          const index = testRun.executions.findIndex(e => e.id === execution.id);
                          testRun.executions[index] = newExecution;
                        }}
                      >
                        <SelectTrigger className="mt-1">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Pass">Pass</SelectItem>
                          <SelectItem value="Fail">Fail</SelectItem>
                          <SelectItem value="Skipped">Skipped</SelectItem>
                          <SelectItem value="Blocked">Blocked</SelectItem>
                          <SelectItem value="Not Executed">Not Executed</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div>
                      <label className="text-sm font-medium text-foreground">Comments</label>
                      <Textarea
                        className="mt-1"
                        value={executionComments[execution.id] || ''}
                        onChange={(e) => setExecutionComments(prev => ({
                          ...prev,
                          [execution.id]: e.target.value
                        }))}
                        placeholder="Add execution comments..."
                        rows={3}
                      />
                    </div>
                    
                    <div className="flex space-x-2">
                      <Button
                        size="sm"
                        onClick={() => {
                          const newStatus = testRun.executions.find(e => e.id === execution.id)?.status || execution.status;
                          handleUpdateExecution(
                            execution.id,
                            newStatus,
                            executionComments[execution.id] || ''
                          );
                        }}
                      >
                        Save
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setEditingExecution(null)}
                      >
                        Cancel
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {execution.comments && (
                      <div className="flex items-start space-x-2">
                        <MessageSquare className="h-4 w-4 text-muted-foreground mt-0.5" />
                        <p className="text-sm text-foreground">{execution.comments}</p>
                      </div>
                    )}
                    
                    {execution.attachments.length > 0 && (
                      <div className="flex items-center space-x-2">
                        <Paperclip className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm text-muted-foreground">
                          {execution.attachments.length} attachment(s)
                        </span>
                      </div>
                    )}
                    
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => startEditing(execution.id, execution.comments)}
                    >
                      Edit Execution
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}