import React, { useState, useEffect } from 'react';
import { Plus, FolderOpen, Folder, FileText, Edit, Trash2, MoreHorizontal, Info, Copy, Archive, BarChart3, Target, Users, Calendar } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from '@/components/ui/dialog';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { TestSuite, TestCase } from '@/types';
import { dataService } from '@/services/dataService';
import { TestSuiteForm } from './TestSuiteForm';
import { useToast } from '@/hooks/use-toast';

export function TestSuitesList() {
  const [testSuites, setTestSuites] = useState<TestSuite[]>([]);
  const [testCases, setTestCases] = useState<TestCase[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSuite, setSelectedSuite] = useState<TestSuite | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isInfoOpen, setIsInfoOpen] = useState(false);
  const [expandedSuites, setExpandedSuites] = useState<Set<string>>(new Set());
  const [sortBy, setSortBy] = useState<'name' | 'created' | 'testCount'>('name');
  const [viewMode, setViewMode] = useState<'tree' | 'grid'>('tree');
  const { toast } = useToast();

  useEffect(() => {
    loadData();
  }, []);

  const loadData = () => {
    setTestSuites(dataService.getTestSuites());
    setTestCases(dataService.getTestCases());
  };

  const filteredSuites = testSuites.filter(suite =>
    suite.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    suite.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const rootSuites = filteredSuites.filter(suite => !suite.parentId);

  const getChildSuites = (parentId: string) => {
    return filteredSuites.filter(suite => suite.parentId === parentId);
  };

  const getSuiteTestCases = (suiteId: string) => {
    return testCases.filter(testCase => testCase.suiteId === suiteId);
  };

  const toggleExpanded = (suiteId: string) => {
    const newExpanded = new Set(expandedSuites);
    if (newExpanded.has(suiteId)) {
      newExpanded.delete(suiteId);
    } else {
      newExpanded.add(suiteId);
    }
    setExpandedSuites(newExpanded);
  };

  const handleEdit = (suite: TestSuite) => {
    setSelectedSuite(suite);
    setIsFormOpen(true);
  };

  const handleDelete = (suite: TestSuite) => {
    dataService.deleteTestSuite(suite.id);
    loadData();
    toast({
      title: 'Success',
      description: 'Test suite deleted successfully',
    });
  };

  const handleDuplicate = (suite: TestSuite) => {
    const duplicatedSuite = {
      ...suite,
      id: undefined,
      name: `${suite.name} (Copy)`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    dataService.saveTestSuite(duplicatedSuite);
    loadData();
    toast({
      title: 'Success',
      description: 'Test suite duplicated successfully',
    });
  };

  const getSuiteStats = (suite: TestSuite) => {
    const childSuites = getChildSuites(suite.id);
    const suiteTestCases = getSuiteTestCases(suite.id);
    const totalTests = suiteTestCases.length + childSuites.reduce((acc, child) => acc + getSuiteTestCases(child.id).length, 0);
    const highPriorityTests = suiteTestCases.filter(tc => tc.priority === 'High').length;
    const activeTests = suiteTestCases.filter(tc => tc.status === 'Active').length;
    
    return {
      totalTests,
      highPriorityTests,
      activeTests,
      suiteCount: childSuites.length,
      testCaseCount: suiteTestCases.length
    };
  };

  const handleFormSubmit = (data: Partial<TestSuite>) => {
    try {
      if (selectedSuite) {
        dataService.saveTestSuite({ ...data, id: selectedSuite.id });
        toast({
          title: 'Success',
          description: 'Test suite updated successfully',
        });
      } else {
        dataService.saveTestSuite(data);
        toast({
          title: 'Success',
          description: 'Test suite created successfully',
        });
      }
      loadData();
      setIsFormOpen(false);
      setSelectedSuite(null);
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to save test suite',
        variant: 'destructive',
      });
    }
  };

  const renderSuite = (suite: TestSuite, level = 0) => {
    const childSuites = getChildSuites(suite.id);
    const suiteTestCases = getSuiteTestCases(suite.id);
    const isExpanded = expandedSuites.has(suite.id);
    const hasChildren = childSuites.length > 0 || suiteTestCases.length > 0;
    const stats = getSuiteStats(suite);

    return (
      <div key={suite.id} className="space-y-2">
        <Card className="border-l-4 border-l-primary/20 hover:shadow-md transition-shadow duration-200">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3" style={{ marginLeft: `${level * 20}px` }}>
                {hasChildren && (
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => toggleExpanded(suite.id)}
                          className="h-6 w-6 p-0"
                        >
                          {isExpanded ? <FolderOpen className="h-4 w-4" /> : <Folder className="h-4 w-4" />}
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>
                        {isExpanded ? 'Collapse suite' : 'Expand suite'}
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                )}
                {!hasChildren && (
                  <div className="w-6 flex justify-center">
                    <FileText className="h-4 w-4 text-muted-foreground" />
                  </div>
                )}
                
                <div className="flex-1">
                  <div className="flex items-center space-x-2">
                    <h3 className="font-semibold text-foreground">{suite.name}</h3>
                    {stats.highPriorityTests > 0 && (
                      <Badge variant="destructive" className="text-xs">
                        {stats.highPriorityTests} High Priority
                      </Badge>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground mt-1 line-clamp-2">{suite.description}</p>
                  
                  <div className="flex items-center space-x-4 mt-3">
                    <div className="flex items-center space-x-1">
                      <Folder className="h-3 w-3 text-muted-foreground" />
                      <span className="text-xs text-muted-foreground">
                        {stats.suiteCount} suite{stats.suiteCount !== 1 ? 's' : ''}
                      </span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <Target className="h-3 w-3 text-muted-foreground" />
                      <span className="text-xs text-muted-foreground">
                        {stats.testCaseCount} test{stats.testCaseCount !== 1 ? 's' : ''}
                      </span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <BarChart3 className="h-3 w-3 text-muted-foreground" />
                      <span className="text-xs text-muted-foreground">
                        {stats.activeTests} active
                      </span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <Calendar className="h-3 w-3 text-muted-foreground" />
                      <span className="text-xs text-muted-foreground">
                        {new Date(suite.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48">
                  <DropdownMenuItem onClick={() => handleEdit(suite)}>
                    <Edit className="h-4 w-4 mr-2" />
                    Edit Suite
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => handleDuplicate(suite)}>
                    <Copy className="h-4 w-4 mr-2" />
                    Duplicate Suite
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem>
                    <Archive className="h-4 w-4 mr-2" />
                    Archive Suite
                  </DropdownMenuItem>
                  <DropdownMenuItem>
                    <BarChart3 className="h-4 w-4 mr-2" />
                    View Analytics
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <DropdownMenuItem onSelect={(e) => e.preventDefault()} className="text-destructive focus:text-destructive">
                        <Trash2 className="h-4 w-4 mr-2" />
                        Delete Suite
                      </DropdownMenuItem>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Delete Test Suite</AlertDialogTitle>
                        <AlertDialogDescription>
                          Are you sure you want to delete "{suite.name}"? This action cannot be undone and will also remove all associated test cases.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={() => handleDelete(suite)} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                          Delete Suite
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </CardContent>
        </Card>

        {isExpanded && (
          <div className="space-y-2">
            {childSuites.map(childSuite => renderSuite(childSuite, level + 1))}
            {suiteTestCases.map(testCase => (
              <Card key={testCase.id} className="border-l-4 border-l-accent/30">
                <CardContent className="p-3" style={{ marginLeft: `${(level + 1) * 20}px` }}>
                  <div className="flex items-center space-x-3">
                    <FileText className="h-4 w-4 text-muted-foreground" />
                    <div className="flex-1">
                      <h4 className="text-sm font-medium text-foreground">{testCase.title}</h4>
                      <div className="flex items-center space-x-2 mt-1">
                        <Badge variant={testCase.priority === 'High' ? 'destructive' : testCase.priority === 'Medium' ? 'default' : 'secondary'}>
                          {testCase.priority}
                        </Badge>
                        <Badge variant="outline">
                          {testCase.status}
                        </Badge>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center space-x-3">
            <h1 className="text-3xl font-bold text-foreground">Test Suites</h1>
            <Dialog open={isInfoOpen} onOpenChange={setIsInfoOpen}>
              <DialogTrigger asChild>
                <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                  <Info className="h-4 w-4" />
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle className="flex items-center space-x-2">
                    <Folder className="h-5 w-5" />
                    <span>What are Test Suites?</span>
                  </DialogTitle>
                  <DialogDescription className="text-left space-y-4 mt-4">
                    <p>
                      <strong>Test Suites</strong> are logical collections of related test cases that help organize your testing efforts efficiently and systematically.
                    </p>
                    <div className="space-y-3">
                      <div className="flex items-start space-x-3">
                        <Target className="h-5 w-5 text-primary mt-0.5" />
                        <div>
                          <h4 className="font-semibold">Purpose & Benefits</h4>
                          <p className="text-sm text-muted-foreground">Group test cases by functionality, feature, or module to improve test management, execution planning, and result analysis.</p>
                        </div>
                      </div>
                      <div className="flex items-start space-x-3">
                        <Users className="h-5 w-5 text-primary mt-0.5" />
                        <div>
                          <h4 className="font-semibold">Hierarchical Organization</h4>
                          <p className="text-sm text-muted-foreground">Create nested suites for complex applications. For example: "User Management" → "Authentication" → "Login Tests".</p>
                        </div>
                      </div>
                      <div className="flex items-start space-x-3">
                        <BarChart3 className="h-5 w-5 text-primary mt-0.5" />
                        <div>
                          <h4 className="font-semibold">Test Execution & Reporting</h4>
                          <p className="text-sm text-muted-foreground">Execute entire suites at once, track progress, and generate comprehensive reports for stakeholders.</p>
                        </div>
                      </div>
                    </div>
                    <Separator />
                    <div className="bg-muted/50 p-4 rounded-lg">
                      <h4 className="font-semibold mb-2">Best Practices:</h4>
                      <ul className="text-sm space-y-1 text-muted-foreground">
                        <li>• Keep suites focused on specific features or user flows</li>
                        <li>• Use clear, descriptive names that reflect the testing scope</li>
                        <li>• Maintain reasonable suite sizes (10-50 test cases per suite)</li>
                        <li>• Organize by priority, functionality, or test type</li>
                        <li>• Regular maintenance to keep suites relevant and up-to-date</li>
                      </ul>
                    </div>
                  </DialogDescription>
                </DialogHeader>
              </DialogContent>
            </Dialog>
          </div>
          <p className="text-muted-foreground mt-1">
            Organize and manage your test cases with professional test suite structure
          </p>
        </div>
        <div className="flex items-center space-x-3">
          <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
            <DialogTrigger asChild>
              <Button onClick={() => setSelectedSuite(null)} className="bg-primary hover:bg-primary/90">
                <Plus className="h-4 w-4 mr-2" />
                New Suite
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>
                  {selectedSuite ? 'Edit Test Suite' : 'Create Test Suite'}
                </DialogTitle>
              </DialogHeader>
              <TestSuiteForm
                suite={selectedSuite}
                onSubmit={handleFormSubmit}
                onCancel={() => {
                  setIsFormOpen(false);
                  setSelectedSuite(null);
                }}
              />
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Input
            placeholder="Search test suites..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="max-w-sm"
          />
          <Select value={sortBy} onValueChange={(value: 'name' | 'created' | 'testCount') => setSortBy(value)}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="Sort by..." />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="name">Sort by Name</SelectItem>
              <SelectItem value="created">Sort by Created Date</SelectItem>
              <SelectItem value="testCount">Sort by Test Count</SelectItem>
            </SelectContent>
          </Select>
        </div>
        
        <div className="flex items-center space-x-2">
          <span className="text-sm text-muted-foreground">
            {rootSuites.length} suite{rootSuites.length !== 1 ? 's' : ''} • {testCases.length} total tests
          </span>
        </div>
      </div>

      <div className="space-y-4">
        {rootSuites.length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center">
              <Folder className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">No test suites found</p>
            </CardContent>
          </Card>
        ) : (
          rootSuites.map(suite => renderSuite(suite))
        )}
      </div>
    </div>
  );
}