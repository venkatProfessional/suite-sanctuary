import React, { useState, useEffect } from 'react';
import { Play, Clock, CheckCircle, AlertCircle, Plus, Eye } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Progress } from '@/components/ui/progress';
import { TestRun, TestSuite, TestExecution } from '@/types';
import { dataService } from '@/services/dataService';
import { TestRunForm } from './TestRunForm';
import { TestRunDetail } from './TestRunDetail';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';

export function TestRunsList() {
  const [testRuns, setTestRuns] = useState<TestRun[]>([]);
  const [testSuites, setTestSuites] = useState<TestSuite[]>([]);
  const [selectedRun, setSelectedRun] = useState<TestRun | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    loadData();
  }, []);

  const loadData = () => {
    setTestRuns(dataService.getTestRuns());
    setTestSuites(dataService.getTestSuites());
  };

  const getRunProgress = (run: TestRun) => {
    const total = run.executions.length;
    const completed = run.executions.filter(e => e.status !== 'Not Executed').length;
    return total > 0 ? (completed / total) * 100 : 0;
  };

  const getRunStatus = (run: TestRun) => {
    const progress = getRunProgress(run);
    if (progress === 0) return 'Not Started';
    if (progress === 100) return 'Completed';
    return 'In Progress';
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'Completed':
        return <CheckCircle className="h-4 w-4 text-success" />;
      case 'In Progress':
        return <Clock className="h-4 w-4 text-warning" />;
      default:
        return <AlertCircle className="h-4 w-4 text-muted-foreground" />;
    }
  };

  const getPassRate = (executions: TestExecution[]) => {
    const executed = executions.filter(e => e.status !== 'Not Executed');
    if (executed.length === 0) return 0;
    const passed = executed.filter(e => e.status === 'Pass');
    return (passed.length / executed.length) * 100;
  };

  const handleFormSubmit = (data: Partial<TestRun>) => {
    try {
      dataService.saveTestRun(data);
      loadData();
      setIsFormOpen(false);
      toast({
        title: 'Success',
        description: 'Test run created successfully',
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to create test run',
        variant: 'destructive',
      });
    }
  };

  const handleViewDetails = (run: TestRun) => {
    setSelectedRun(run);
    setIsDetailOpen(true);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Test Runs</h1>
          <p className="text-muted-foreground mt-1">
            Execute and track test case results
          </p>
        </div>
        <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              New Test Run
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Create Test Run</DialogTitle>
            </DialogHeader>
            <TestRunForm
              testSuites={testSuites}
              onSubmit={handleFormSubmit}
              onCancel={() => setIsFormOpen(false)}
            />
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-6">
        {testRuns.length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center">
              <Play className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">No test runs found</p>
            </CardContent>
          </Card>
        ) : (
          testRuns.map((run) => {
            const progress = getRunProgress(run);
            const status = getRunStatus(run);
            const passRate = getPassRate(run.executions);
            const suite = testSuites.find(s => s.id === run.suiteId);

            return (
              <Card key={run.id} className="hover:shadow-md transition-shadow">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="flex items-center space-x-2">
                        {getStatusIcon(status)}
                        <span>{run.name}</span>
                        <Badge variant="outline">{status}</Badge>
                      </CardTitle>
                      <p className="text-sm text-muted-foreground mt-1">
                        {run.description}
                      </p>
                      {suite && (
                        <p className="text-sm text-muted-foreground">
                          Suite: {suite.name}
                        </p>
                      )}
                    </div>
                    <Button
                      variant="outline"
                      onClick={() => handleViewDetails(run)}
                    >
                      <Eye className="h-4 w-4 mr-2" />
                      View Details
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div>
                      <div className="flex justify-between text-sm mb-2">
                        <span>Progress</span>
                        <span>{progress.toFixed(0)}%</span>
                      </div>
                      <Progress value={progress} className="h-2" />
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div className="text-center">
                        <div className="text-2xl font-bold text-foreground">
                          {run.executions.length}
                        </div>
                        <div className="text-xs text-muted-foreground">Total Tests</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-success">
                          {run.executions.filter(e => e.status === 'Pass').length}
                        </div>
                        <div className="text-xs text-muted-foreground">Passed</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-destructive">
                          {run.executions.filter(e => e.status === 'Fail').length}
                        </div>
                        <div className="text-xs text-muted-foreground">Failed</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-warning">
                          {passRate.toFixed(0)}%
                        </div>
                        <div className="text-xs text-muted-foreground">Pass Rate</div>
                      </div>
                    </div>

                    <div className="flex justify-between text-sm text-muted-foreground">
                      <span>Created: {format(new Date(run.createdAt), 'MMM dd, yyyy')}</span>
                      {run.completedAt && (
                        <span>Completed: {format(new Date(run.completedAt), 'MMM dd, yyyy')}</span>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })
        )}
      </div>

      <Dialog open={isDetailOpen} onOpenChange={setIsDetailOpen}>
        <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Test Run Details</DialogTitle>
          </DialogHeader>
          {selectedRun && (
            <TestRunDetail
              testRun={selectedRun}
              onUpdate={loadData}
              onClose={() => setIsDetailOpen(false)}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}