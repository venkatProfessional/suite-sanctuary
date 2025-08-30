import React, { useState, useEffect } from 'react';
import { 
  Play, 
  Pause, 
  Square as Stop, 
  ChevronLeft, 
  ChevronRight, 
  CheckCircle, 
  XCircle, 
  Clock, 
  AlertTriangle,
  FileImage,
  Upload,
  MessageSquare,
  Timer
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { TestRun, TestCase, TestExecution, ExecutionStatus, TestStepResult } from '@/types';
import { dataService } from '@/services/dataService';
import { useToast } from '@/hooks/use-toast';

interface TestRunExecutorProps {
  testRun: TestRun;
  onUpdate: () => void;
  onClose: () => void;
}

export function TestRunExecutor({ testRun, onUpdate, onClose }: TestRunExecutorProps) {
  const [currentIndex, setCurrentIndex] = useState(testRun.currentExecutionIndex || 0);
  const [isRunning, setIsRunning] = useState(testRun.status === 'In Progress');
  const [executionStartTime, setExecutionStartTime] = useState<Date | null>(null);
  const [currentExecution, setCurrentExecution] = useState<TestExecution | null>(null);
  const [actualResult, setActualResult] = useState('');
  const [comments, setComments] = useState('');
  const [stepResults, setStepResults] = useState<TestStepResult[]>([]);
  const { toast } = useToast();

  const testCases = dataService.getTestCases();
  const currentTestCase = testCases.find(tc => tc.id === testRun.executions[currentIndex]?.testCaseId);
  const progress = (currentIndex / testRun.executions.length) * 100;

  useEffect(() => {
    if (currentIndex < testRun.executions.length) {
      const execution = testRun.executions[currentIndex];
      setCurrentExecution(execution);
      setActualResult(execution.actualResult || '');
      setComments(execution.comments || '');
      setStepResults(execution.stepResults || []);
    }
  }, [currentIndex, testRun.executions]);

  const startExecution = () => {
    setIsRunning(true);
    setExecutionStartTime(new Date());
    
    // Update test run status
    const updatedRun = {
      ...testRun,
      status: 'In Progress' as 'In Progress',
      startedAt: new Date().toISOString(),
      currentExecutionIndex: currentIndex
    };
    
    dataService.saveTestRun(updatedRun);
    onUpdate();
  };

  const pauseExecution = () => {
    setIsRunning(false);
    
    const updatedRun = {
      ...testRun,
      status: 'Paused' as 'Paused',
      pausedAt: new Date().toISOString(),
      currentExecutionIndex: currentIndex
    };
    
    dataService.saveTestRun(updatedRun);
    onUpdate();
  };

  const stopExecution = () => {
    setIsRunning(false);
    
    const updatedRun = {
      ...testRun,
      status: 'Cancelled' as 'Cancelled',
      currentExecutionIndex: currentIndex
    };
    
    dataService.saveTestRun(updatedRun);
    onUpdate();
    onClose();
  };

  const executeTestCase = (status: ExecutionStatus) => {
    if (!currentExecution || !executionStartTime) return;

    const duration = Math.floor((new Date().getTime() - executionStartTime.getTime()) / 1000);

    const updatedExecution: Partial<TestExecution> = {
      ...currentExecution,
      status,
      actualResult,
      comments,
      stepResults,
      executedAt: new Date().toISOString(),
      duration,
      executedBy: 'Current User'
    };

    dataService.saveTestExecution(updatedExecution);

    // Update the test run's executions array
    const updatedExecutions = [...testRun.executions];
    updatedExecutions[currentIndex] = { ...currentExecution, ...updatedExecution };

    // Check if this is the last test case
    const isLastCase = currentIndex === testRun.executions.length - 1;
    const newStatus = isLastCase ? 'Completed' : 'In Progress';

    const updatedRun = {
      ...testRun,
      executions: updatedExecutions,
      status: newStatus as 'Completed' | 'In Progress',
      currentExecutionIndex: isLastCase ? currentIndex : currentIndex + 1,
      completedAt: isLastCase ? new Date().toISOString() : undefined
    };

    dataService.saveTestRun(updatedRun);

    toast({
      title: 'Test Case Executed',
      description: `Test case marked as ${status}`,
    });

    // Move to next test case or complete
    if (!isLastCase) {
      setCurrentIndex(currentIndex + 1);
      setExecutionStartTime(new Date());
      setActualResult('');
      setComments('');
      setStepResults([]);
    } else {
      setIsRunning(false);
      toast({
        title: 'Test Run Completed',
        description: 'All test cases have been executed',
      });
    }

    onUpdate();
  };

  const navigateToTestCase = (index: number) => {
    if (index >= 0 && index < testRun.executions.length) {
      setCurrentIndex(index);
    }
  };

  const updateStepResult = (stepId: string, stepStatus: ExecutionStatus, stepActualResult: string) => {
    const updatedStepResults = [...stepResults];
    const existingIndex = updatedStepResults.findIndex(sr => sr.stepId === stepId);
    
    if (existingIndex >= 0) {
      updatedStepResults[existingIndex] = {
        ...updatedStepResults[existingIndex],
        status: stepStatus,
        actualResult: stepActualResult
      };
    } else {
      updatedStepResults.push({
        stepId,
        status: stepStatus,
        actualResult: stepActualResult
      });
    }
    
    setStepResults(updatedStepResults);
  };

  const getStatusColor = (status: ExecutionStatus) => {
    switch (status) {
      case 'Pass': return 'text-emerald-600 bg-emerald-50 border-emerald-200';
      case 'Fail': return 'text-red-600 bg-red-50 border-red-200';
      case 'Skipped': return 'text-orange-600 bg-orange-50 border-orange-200';
      case 'Blocked': return 'text-red-600 bg-red-50 border-red-200';
      default: return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  if (!currentTestCase) {
    return (
      <div className="p-6 text-center">
        <p className="text-muted-foreground">No test case found</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 h-full flex flex-col">
      {/* Header with progress and controls */}
      <div className="flex-shrink-0">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-4">
            <h2 className="text-2xl font-bold text-foreground">{testRun.name}</h2>
            <Badge variant="outline" className={getStatusColor(testRun.status as ExecutionStatus)}>
              {testRun.status}
            </Badge>
          </div>
          
          <div className="flex items-center space-x-2">
            {!isRunning && testRun.status !== 'Completed' && (
              <Button onClick={startExecution} size="sm">
                <Play className="h-4 w-4 mr-2" />
                {testRun.status === 'Paused' ? 'Resume' : 'Start'}
              </Button>
            )}
            
            {isRunning && (
              <Button onClick={pauseExecution} variant="outline" size="sm">
                <Pause className="h-4 w-4 mr-2" />
                Pause
              </Button>
            )}
            
            <Button onClick={stopExecution} variant="destructive" size="sm">
              <Stop className="h-4 w-4 mr-2" />
              Stop
            </Button>
          </div>
        </div>

        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span>Progress: {currentIndex + 1} of {testRun.executions.length}</span>
            <span>{progress.toFixed(0)}% Complete</span>
          </div>
          <Progress value={progress} className="h-2" />
        </div>

        {/* Navigation */}
        <div className="flex items-center justify-between mt-4">
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => navigateToTestCase(currentIndex - 1)}
            disabled={currentIndex === 0}
          >
            <ChevronLeft className="h-4 w-4 mr-2" />
            Previous
          </Button>
          
          <span className="text-sm text-muted-foreground">
            Test Case {currentIndex + 1}: {currentTestCase.id}
          </span>
          
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => navigateToTestCase(currentIndex + 1)}
            disabled={currentIndex === testRun.executions.length - 1}
          >
            Next
            <ChevronRight className="h-4 w-4 ml-2" />
          </Button>
        </div>
      </div>

      {/* Test Case Details */}
      <div className="flex-1 overflow-y-auto space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">{currentTestCase.title}</CardTitle>
            <p className="text-sm text-muted-foreground">{currentTestCase.description}</p>
          </CardHeader>
          <CardContent className="space-y-4">
            {currentTestCase.preconditions && (
              <div>
                <h4 className="font-medium text-sm mb-2">Preconditions:</h4>
                <p className="text-sm bg-muted p-3 rounded-md">{currentTestCase.preconditions}</p>
              </div>
            )}

            <div>
              <h4 className="font-medium text-sm mb-2">Test Steps:</h4>
              <div className="space-y-3">
                {currentTestCase.steps.map((step, index) => {
                  const stepResult = stepResults.find(sr => sr.stepId === step.id);
                  
                  return (
                    <div key={step.id} className="border rounded-lg p-3 space-y-3">
                      <div className="flex items-start space-x-3">
                        <div className="flex-shrink-0 w-6 h-6 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-xs font-medium">
                          {index + 1}
                        </div>
                        <div className="flex-1 space-y-2">
                          <p className="text-sm font-medium">{step.description}</p>
                          <p className="text-sm text-muted-foreground">
                            <strong>Expected:</strong> {step.expectedResult}
                          </p>
                          
                          <div className="space-y-2">
                            <Input
                              placeholder="Enter actual result..."
                              value={stepResult?.actualResult || ''}
                              onChange={(e) => updateStepResult(step.id, stepResult?.status || 'Not Run', e.target.value)}
                            />
                            
                            <div className="flex space-x-2">
                              <Button 
                                size="sm" 
                                variant={stepResult?.status === 'Pass' ? 'default' : 'outline'}
                                className={stepResult?.status === 'Pass' ? 'bg-emerald-600 hover:bg-emerald-700' : ''}
                                onClick={() => updateStepResult(step.id, 'Pass', stepResult?.actualResult || '')}
                              >
                                <CheckCircle className="h-3 w-3 mr-1" />
                                Pass
                              </Button>
                              <Button 
                                size="sm" 
                                variant={stepResult?.status === 'Fail' ? 'default' : 'outline'}
                                className={stepResult?.status === 'Fail' ? 'bg-red-600 hover:bg-red-700' : ''}
                                onClick={() => updateStepResult(step.id, 'Fail', stepResult?.actualResult || '')}
                              >
                                <XCircle className="h-3 w-3 mr-1" />
                                Fail
                              </Button>
                              <Button 
                                size="sm" 
                                variant={stepResult?.status === 'Skipped' ? 'default' : 'outline'}
                                className={stepResult?.status === 'Skipped' ? 'bg-orange-600 hover:bg-orange-700' : ''}
                                onClick={() => updateStepResult(step.id, 'Skipped', stepResult?.actualResult || '')}
                              >
                                <Clock className="h-3 w-3 mr-1" />
                                Skip
                              </Button>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <Separator />

            <div>
              <h4 className="font-medium text-sm mb-2">Overall Expected Result:</h4>
              <p className="text-sm bg-muted p-3 rounded-md">{currentTestCase.expectedResults}</p>
            </div>

            <div>
              <h4 className="font-medium text-sm mb-2">Actual Result:</h4>
              <Textarea
                placeholder="Enter the overall actual result..."
                value={actualResult}
                onChange={(e) => setActualResult(e.target.value)}
                rows={3}
              />
            </div>

            <div>
              <h4 className="font-medium text-sm mb-2">Comments:</h4>
              <Textarea
                placeholder="Add any comments or notes..."
                value={comments}
                onChange={(e) => setComments(e.target.value)}
                rows={2}
              />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Action buttons */}
      {isRunning && (
        <div className="flex-shrink-0 grid grid-cols-4 gap-2">
          <Button 
            className="bg-emerald-600 hover:bg-emerald-700 text-white"
            onClick={() => executeTestCase('Pass')}
          >
            <CheckCircle className="h-4 w-4 mr-2" />
            Pass
          </Button>
          <Button 
            className="bg-red-600 hover:bg-red-700 text-white"
            onClick={() => executeTestCase('Fail')}
          >
            <XCircle className="h-4 w-4 mr-2" />
            Fail
          </Button>
          <Button 
            className="bg-orange-600 hover:bg-orange-700 text-white"
            onClick={() => executeTestCase('Skipped')}
          >
            <Clock className="h-4 w-4 mr-2" />
            Skip
          </Button>
          <Button 
            className="bg-yellow-600 hover:bg-yellow-700 text-white"
            onClick={() => executeTestCase('Blocked')}
          >
            <AlertTriangle className="h-4 w-4 mr-2" />
            Block
          </Button>
        </div>
      )}
    </div>
  );
}