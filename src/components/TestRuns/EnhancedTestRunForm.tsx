import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { TestSuite, TestCase, TestRun, TestExecution } from '@/types';
import { dataService } from '@/services/dataService';

const testRunSchema = z.object({
  name: z.string().min(1, 'Test run name is required'),
  description: z.string().optional(),
  projectId: z.string().optional(),
  assignedTo: z.array(z.string()).optional(),
});

type TestRunFormData = z.infer<typeof testRunSchema>;

interface EnhancedTestRunFormProps {
  testSuites: TestSuite[];
  onSubmit: (data: Partial<TestRun>) => void;
  onCancel: () => void;
}

export function EnhancedTestRunForm({ testSuites, onSubmit, onCancel }: EnhancedTestRunFormProps) {
  const [selectedSuites, setSelectedSuites] = useState<string[]>([]);
  const [selectedTestCases, setSelectedTestCases] = useState<string[]>([]);
  const [availableTestCases, setAvailableTestCases] = useState<TestCase[]>([]);
  const [selectionMode, setSelectionMode] = useState<'suites' | 'individual'>('suites');
  const [assigneeInput, setAssigneeInput] = useState('');
  const [assignees, setAssignees] = useState<string[]>([]);

  const form = useForm<TestRunFormData>({
    resolver: zodResolver(testRunSchema),
    defaultValues: {
      name: '',
      description: '',
      projectId: '',
      assignedTo: [],
    },
  });

  useEffect(() => {
    // Load all test cases when component mounts
    const testCases = dataService.getTestCases();
    setAvailableTestCases(testCases);
  }, []);

  useEffect(() => {
    // Update available test cases when suites are selected
    if (selectionMode === 'suites') {
      const testCases = dataService.getTestCases();
      const filteredTestCases = testCases.filter(tc => 
        selectedSuites.length === 0 || selectedSuites.includes(tc.suiteId || '')
      );
      setSelectedTestCases(filteredTestCases.map(tc => tc.id));
    }
  }, [selectedSuites, selectionMode]);

  const handleSuiteToggle = (suiteId: string) => {
    setSelectedSuites(prev => 
      prev.includes(suiteId) 
        ? prev.filter(id => id !== suiteId)
        : [...prev, suiteId]
    );
  };

  const handleTestCaseToggle = (testCaseId: string) => {
    setSelectedTestCases(prev => 
      prev.includes(testCaseId) 
        ? prev.filter(id => id !== testCaseId)
        : [...prev, testCaseId]
    );
  };

  const addAssignee = () => {
    if (assigneeInput.trim() && !assignees.includes(assigneeInput.trim())) {
      setAssignees([...assignees, assigneeInput.trim()]);
      setAssigneeInput('');
    }
  };

  const removeAssignee = (assignee: string) => {
    setAssignees(assignees.filter(a => a !== assignee));
  };

  const handleSubmit = (data: TestRunFormData) => {
    // Create executions for selected test cases
    const executions: TestExecution[] = selectedTestCases.map(testCaseId => ({
      id: '',
      testCaseId,
      status: 'Not Executed' as const,
      comments: '',
      attachments: [],
      executedAt: '',
      executedBy: '',
      runId: ''
    }));

    const testRunData: Partial<TestRun> = {
      ...data,
      suiteIds: selectionMode === 'suites' ? selectedSuites : [],
      testCaseIds: selectedTestCases,
      status: 'Not Started',
      executions,
      assignedTo: assignees,
      currentExecutionIndex: 0
    };

    onSubmit(testRunData);
  };

  const getTestCasesForSuite = (suiteId: string) => {
    return availableTestCases.filter(tc => tc.suiteId === suiteId);
  };

  return (
    <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="name">Test Run Name *</Label>
          <Input
            id="name"
            {...form.register('name')}
            placeholder="Enter test run name"
          />
          {form.formState.errors.name && (
            <p className="text-sm text-destructive mt-1">{form.formState.errors.name.message}</p>
          )}
        </div>

        <div>
          <Label htmlFor="projectId">Project (Optional)</Label>
          <Select onValueChange={(value) => form.setValue('projectId', value)}>
            <SelectTrigger>
              <SelectValue placeholder="Select project" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="project-1">Project Alpha</SelectItem>
              <SelectItem value="project-2">Project Beta</SelectItem>
              <SelectItem value="project-3">Project Gamma</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div>
        <Label htmlFor="description">Description</Label>
        <Textarea
          id="description"
          {...form.register('description')}
          placeholder="Enter test run description"
          rows={3}
        />
      </div>

      {/* Selection Mode */}
      <div>
        <Label>Selection Mode</Label>
        <div className="flex space-x-4 mt-2">
          <Button
            type="button"
            variant={selectionMode === 'suites' ? 'default' : 'outline'}
            onClick={() => setSelectionMode('suites')}
          >
            Select by Test Suites
          </Button>
          <Button
            type="button"
            variant={selectionMode === 'individual' ? 'default' : 'outline'}
            onClick={() => setSelectionMode('individual')}
          >
            Select Individual Test Cases
          </Button>
        </div>
      </div>

      {/* Test Selection */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">
            {selectionMode === 'suites' ? 'Select Test Suites' : 'Select Test Cases'}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-64">
            {selectionMode === 'suites' ? (
              <div className="space-y-2">
                {testSuites.map((suite) => (
                  <div key={suite.id} className="flex items-center space-x-2 p-2 border rounded">
                    <Checkbox
                      checked={selectedSuites.includes(suite.id)}
                      onCheckedChange={() => handleSuiteToggle(suite.id)}
                    />
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium">{suite.name}</p>
                          <p className="text-sm text-muted-foreground">{suite.description}</p>
                        </div>
                        <Badge variant="outline">
                          {getTestCasesForSuite(suite.id).length} test cases
                        </Badge>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="space-y-2">
                {availableTestCases.map((testCase) => (
                  <div key={testCase.id} className="flex items-center space-x-2 p-2 border rounded">
                    <Checkbox
                      checked={selectedTestCases.includes(testCase.id)}
                      onCheckedChange={() => handleTestCaseToggle(testCase.id)}
                    />
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium">{testCase.title}</p>
                          <p className="text-sm text-muted-foreground">{testCase.description}</p>
                        </div>
                        <div className="flex space-x-2">
                          <Badge variant="outline">{testCase.priority}</Badge>
                          <Badge variant="secondary">{testCase.id}</Badge>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </ScrollArea>
          
          <div className="mt-4 p-3 bg-muted rounded-md">
            <p className="text-sm">
              <strong>Selected:</strong> {selectedTestCases.length} test case(s)
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Assignees */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Assign Testers (Optional)</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex space-x-2">
            <Input
              placeholder="Enter tester name or email"
              value={assigneeInput}
              onChange={(e) => setAssigneeInput(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addAssignee())}
            />
            <Button type="button" variant="outline" onClick={addAssignee}>
              Add
            </Button>
          </div>
          
          {assignees.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {assignees.map((assignee) => (
                <Badge key={assignee} variant="secondary" className="cursor-pointer" onClick={() => removeAssignee(assignee)}>
                  {assignee} ×
                </Badge>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Separator />

      <div className="flex justify-end space-x-2">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button 
          type="submit" 
          disabled={selectedTestCases.length === 0}
        >
          Create Test Run
        </Button>
      </div>
    </form>
  );
}