import React, { useState, useEffect } from 'react';
import { 
  Play, 
  Clock, 
  CheckCircle, 
  AlertCircle, 
  Plus, 
  Eye, 
  Filter,
  SortAsc,
  SortDesc,
  PlayCircle,
  FileDown,
  RotateCcw
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Progress } from '@/components/ui/progress';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { TestRun, TestSuite, TestExecution, TestRunStatus } from '@/types';
import { dataService } from '@/services/dataService';
import { EnhancedTestRunForm } from './EnhancedTestRunForm';
import { TestRunDetail } from './TestRunDetail';
import { TestRunExecutor } from './TestRunExecutor';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';

export function EnhancedTestRunsList() {
  const [testRuns, setTestRuns] = useState<TestRun[]>([]);
  const [filteredTestRuns, setFilteredTestRuns] = useState<TestRun[]>([]);
  const [testSuites, setTestSuites] = useState<TestSuite[]>([]);
  const [selectedRun, setSelectedRun] = useState<TestRun | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [isExecutorOpen, setIsExecutorOpen] = useState(false);
  
  // Filters and sorting
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<'name' | 'date' | 'passRate'>('date');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  
  const { toast } = useToast();

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [testRuns, statusFilter, searchQuery, sortBy, sortOrder]);

  const loadData = () => {
    setTestRuns(dataService.getTestRuns());
    setTestSuites(dataService.getTestSuites());
  };

  const applyFilters = () => {
    let filtered = [...testRuns];

    // Apply status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(run => run.status === statusFilter);
    }

    // Apply search filter
    if (searchQuery) {
      filtered = filtered.filter(run => 
        run.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        run.description.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Apply sorting
    filtered.sort((a, b) => {
      let comparison = 0;
      
      switch (sortBy) {
        case 'name':
          comparison = a.name.localeCompare(b.name);
          break;
        case 'date':
          comparison = new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
          break;
        case 'passRate':
          const passRateA = getPassRate(a.executions);
          const passRateB = getPassRate(b.executions);
          comparison = passRateA - passRateB;
          break;
      }
      
      return sortOrder === 'asc' ? comparison : -comparison;
    });

    setFilteredTestRuns(filtered);
  };

  const getRunProgress = (run: TestRun) => {
    const total = run.executions.length;
    const completed = run.executions.filter(e => e.status !== 'Not Executed').length;
    return total > 0 ? (completed / total) * 100 : 0;
  };

  const getRunStatus = (run: TestRun): TestRunStatus => {
    return run.status;
  };

  const getStatusIcon = (status: TestRunStatus) => {
    switch (status) {
      case 'Completed':
        return <CheckCircle className="h-4 w-4 text-emerald-600" />;
      case 'In Progress':
        return <PlayCircle className="h-4 w-4 text-blue-600" />;
      case 'Paused':
        return <Clock className="h-4 w-4 text-orange-600" />;
      case 'Cancelled':
        return <AlertCircle className="h-4 w-4 text-red-600" />;
      default:
        return <Clock className="h-4 w-4 text-gray-600" />;
    }
  };

  const getStatusColor = (status: TestRunStatus) => {
    switch (status) {
      case 'Completed':
        return 'text-emerald-600 bg-emerald-50 border-emerald-200';
      case 'In Progress':
        return 'text-blue-600 bg-blue-50 border-blue-200';
      case 'Paused':
        return 'text-orange-600 bg-orange-50 border-orange-200';
      case 'Cancelled':
        return 'text-red-600 bg-red-50 border-red-200';
      default:
        return 'text-gray-600 bg-gray-50 border-gray-200';
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

  const handleStartExecution = (run: TestRun) => {
    setSelectedRun(run);
    setIsExecutorOpen(true);
  };

  const handleRerunFailed = (run: TestRun) => {
    const failedExecutions = run.executions.filter(e => e.status === 'Fail');
    
    if (failedExecutions.length === 0) {
      toast({
        title: 'No Failed Tests',
        description: 'There are no failed test cases to rerun',
      });
      return;
    }

    // Reset failed executions
    const updatedExecutions = run.executions.map(execution => 
      execution.status === 'Fail' 
        ? { ...execution, status: 'Not Executed' as const, comments: '', actualResult: '' }
        : execution
    );

    const updatedRun = {
      ...run,
      executions: updatedExecutions,
      status: 'Not Started' as const,
      currentExecutionIndex: 0
    };

    dataService.saveTestRun(updatedRun);
    loadData();
    
    toast({
      title: 'Rerun Initiated',
      description: `${failedExecutions.length} failed test cases reset for rerun`,
    });
  };

  const handleExportResults = (run: TestRun) => {
    try {
      const exportData = {
        testRun: run,
        summary: {
          total: run.executions.length,
          passed: run.executions.filter(e => e.status === 'Pass').length,
          failed: run.executions.filter(e => e.status === 'Fail').length,
          skipped: run.executions.filter(e => e.status === 'Skipped').length,
          blocked: run.executions.filter(e => e.status === 'Blocked').length,
          passRate: getPassRate(run.executions)
        },
        executions: run.executions
      };

      const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `test-run-${run.name.replace(/\s+/g, '-').toLowerCase()}-${format(new Date(), 'yyyy-MM-dd')}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
      toast({
        title: 'Export Complete',
        description: 'Test run results exported successfully',
      });
    } catch (error) {
      toast({
        title: 'Export Failed',
        description: 'Failed to export test run results',
        variant: 'destructive',
      });
    }
  };

  const getSuiteNames = (suiteIds: string[]) => {
    return suiteIds
      .map(id => testSuites.find(s => s.id === id)?.name)
      .filter(Boolean)
      .join(', ');
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Test Runs</h1>
          <p className="text-muted-foreground mt-1">
            Execute and track test case results with advanced workflow management
          </p>
        </div>
        <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              New Test Run
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Create Test Run</DialogTitle>
            </DialogHeader>
            <EnhancedTestRunForm
              testSuites={testSuites}
              onSubmit={handleFormSubmit}
              onCancel={() => setIsFormOpen(false)}
            />
          </DialogContent>
        </Dialog>
      </div>

      {/* Filters and Search */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-wrap gap-4 items-center">
            <div className="flex-1 min-w-64">
              <Input
                placeholder="Search test runs..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full"
              />
            </div>
            
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-48">
                <Filter className="h-4 w-4 mr-2" />
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="Not Started">Not Started</SelectItem>
                <SelectItem value="In Progress">In Progress</SelectItem>
                <SelectItem value="Paused">Paused</SelectItem>
                <SelectItem value="Completed">Completed</SelectItem>
                <SelectItem value="Cancelled">Cancelled</SelectItem>
              </SelectContent>
            </Select>

            <Select value={sortBy} onValueChange={(value: 'name' | 'date' | 'passRate') => setSortBy(value)}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Sort by" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="date">Created Date</SelectItem>
                <SelectItem value="name">Name</SelectItem>
                <SelectItem value="passRate">Pass Rate</SelectItem>
              </SelectContent>
            </Select>

            <Button
              variant="outline"
              size="sm"
              onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
            >
              {sortOrder === 'asc' ? <SortAsc className="h-4 w-4" /> : <SortDesc className="h-4 w-4" />}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Test Runs Grid */}
      <div className="grid gap-6">
        {filteredTestRuns.length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center">
              <Play className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">
                {testRuns.length === 0 ? 'No test runs found' : 'No test runs match your filters'}
              </p>
            </CardContent>
          </Card>
        ) : (
          filteredTestRuns.map((run) => {
            const progress = getRunProgress(run);
            const status = getRunStatus(run);
            const passRate = getPassRate(run.executions);
            const suiteNames = getSuiteNames(run.suiteIds);

            return (
              <Card key={run.id} className="hover:shadow-lg transition-all duration-200 border-l-4 border-l-primary/20">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="space-y-2">
                      <div className="flex items-center space-x-3">
                        {getStatusIcon(status)}
                        <h3 className="text-xl font-semibold">{run.name}</h3>
                        <Badge variant="outline" className={getStatusColor(status)}>
                          {status}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">{run.description}</p>
                      {suiteNames && (
                        <p className="text-sm text-muted-foreground">
                          <strong>Suites:</strong> {suiteNames}
                        </p>
                      )}
                      {run.assignedTo && run.assignedTo.length > 0 && (
                        <p className="text-sm text-muted-foreground">
                          <strong>Assigned to:</strong> {run.assignedTo.join(', ')}
                        </p>
                      )}
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      {status === 'Not Started' && (
                        <Button onClick={() => handleStartExecution(run)} size="sm">
                          <Play className="h-4 w-4 mr-2" />
                          Start
                        </Button>
                      )}
                      
                      {(status === 'In Progress' || status === 'Paused') && (
                        <Button onClick={() => handleStartExecution(run)} size="sm" variant="outline">
                          <PlayCircle className="h-4 w-4 mr-2" />
                          Continue
                        </Button>
                      )}

                      {status === 'Completed' && (
                        <>
                          <Button onClick={() => handleRerunFailed(run)} size="sm" variant="outline">
                            <RotateCcw className="h-4 w-4 mr-2" />
                            Rerun Failed
                          </Button>
                          <Button onClick={() => handleExportResults(run)} size="sm" variant="outline">
                            <FileDown className="h-4 w-4 mr-2" />
                            Export
                          </Button>
                        </>
                      )}
                      
                      <Button
                        variant="outline"
                        onClick={() => handleViewDetails(run)}
                        size="sm"
                      >
                        <Eye className="h-4 w-4 mr-2" />
                        Details
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                
                <CardContent>
                  <div className="space-y-4">
                    {/* Progress */}
                    <div>
                      <div className="flex justify-between text-sm mb-2">
                        <span>Progress</span>
                        <span>{progress.toFixed(0)}%</span>
                      </div>
                      <Progress value={progress} className="h-3" />
                    </div>

                    {/* Stats */}
                    <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                      <div className="text-center">
                        <div className="text-2xl font-bold text-foreground">
                          {run.executions.length}
                        </div>
                        <div className="text-xs text-muted-foreground">Total</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-emerald-600">
                          {run.executions.filter(e => e.status === 'Pass').length}
                        </div>
                        <div className="text-xs text-muted-foreground">Passed</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-red-600">
                          {run.executions.filter(e => e.status === 'Fail').length}
                        </div>
                        <div className="text-xs text-muted-foreground">Failed</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-orange-600">
                          {run.executions.filter(e => e.status === 'Skipped').length}
                        </div>
                        <div className="text-xs text-muted-foreground">Skipped</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-blue-600">
                          {passRate.toFixed(0)}%
                        </div>
                        <div className="text-xs text-muted-foreground">Pass Rate</div>
                      </div>
                    </div>

                    {/* Timestamps */}
                    <div className="flex justify-between text-xs text-muted-foreground">
                      <span>Created: {format(new Date(run.createdAt), 'MMM dd, yyyy HH:mm')}</span>
                      {run.completedAt && (
                        <span>Completed: {format(new Date(run.completedAt), 'MMM dd, yyyy HH:mm')}</span>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })
        )}
      </div>

      {/* Test Run Details Dialog */}
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

      {/* Test Run Executor Dialog */}
      <Dialog open={isExecutorOpen} onOpenChange={setIsExecutorOpen}>
        <DialogContent className="max-w-7xl max-h-[95vh] p-0">
          <div className="h-[90vh]">
            {selectedRun && (
              <TestRunExecutor
                testRun={selectedRun}
                onUpdate={loadData}
                onClose={() => setIsExecutorOpen(false)}
              />
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}