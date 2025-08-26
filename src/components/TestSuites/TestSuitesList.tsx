import React, { useState, useEffect } from 'react';
import { Plus, FolderOpen, Folder, FileText, Edit, Trash2, MoreHorizontal } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';
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
  const [expandedSuites, setExpandedSuites] = useState<Set<string>>(new Set());
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
    if (confirm('Are you sure you want to delete this test suite?')) {
      dataService.deleteTestSuite(suite.id);
      loadData();
      toast({
        title: 'Success',
        description: 'Test suite deleted successfully',
      });
    }
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

    return (
      <div key={suite.id} className="space-y-2">
        <Card className="border-l-4 border-l-primary/20">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3" style={{ marginLeft: `${level * 20}px` }}>
                {hasChildren && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => toggleExpanded(suite.id)}
                    className="h-6 w-6 p-0"
                  >
                    {isExpanded ? <FolderOpen className="h-4 w-4" /> : <Folder className="h-4 w-4" />}
                  </Button>
                )}
                {!hasChildren && <div className="w-6" />}
                
                <div className="flex-1">
                  <h3 className="font-semibold text-foreground">{suite.name}</h3>
                  <p className="text-sm text-muted-foreground mt-1">{suite.description}</p>
                  <div className="flex items-center space-x-4 mt-2">
                    <Badge variant="outline">
                      {childSuites.length} suite{childSuites.length !== 1 ? 's' : ''}
                    </Badge>
                    <Badge variant="outline">
                      {suiteTestCases.length} test{suiteTestCases.length !== 1 ? 's' : ''}
                    </Badge>
                  </div>
                </div>
              </div>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm">
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => handleEdit(suite)}>
                    <Edit className="h-4 w-4 mr-2" />
                    Edit
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => handleDelete(suite)} className="text-destructive">
                    <Trash2 className="h-4 w-4 mr-2" />
                    Delete
                  </DropdownMenuItem>
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
          <h1 className="text-3xl font-bold text-foreground">Test Suites</h1>
          <p className="text-muted-foreground mt-1">
            Organize test cases into logical groups
          </p>
        </div>
        <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => setSelectedSuite(null)}>
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

      <div className="flex items-center space-x-4">
        <Input
          placeholder="Search test suites..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="max-w-sm"
        />
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