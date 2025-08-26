import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { TestRun, TestSuite } from '@/types';
import { dataService } from '@/services/dataService';

const testRunSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100, 'Name must be less than 100 characters'),
  description: z.string().min(1, 'Description is required').max(500, 'Description must be less than 500 characters'),
  suiteId: z.string().min(1, 'Test suite is required'),
});

type TestRunFormData = z.infer<typeof testRunSchema>;

interface TestRunFormProps {
  testSuites: TestSuite[];
  onSubmit: (data: Partial<TestRun>) => void;
  onCancel: () => void;
}

export function TestRunForm({ testSuites, onSubmit, onCancel }: TestRunFormProps) {
  const form = useForm<TestRunFormData>({
    resolver: zodResolver(testRunSchema),
    defaultValues: {
      name: '',
      description: '',
      suiteId: '',
    },
  });

  const handleSubmit = (data: TestRunFormData) => {
    // Get test cases for the selected suite
    const testCases = dataService.getTestCases().filter(tc => tc.suiteId === data.suiteId);
    
    // Create executions for each test case
    const executions = testCases.map(tc => ({
      id: '',
      testCaseId: tc.id,
      status: 'Not Executed' as const,
      comments: '',
      attachments: [],
      executedAt: new Date().toISOString(),
      executedBy: 'Current User', // In a real app, this would be the logged-in user
      runId: '',
    }));

    onSubmit({
      ...data,
      executions,
    });
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Name</FormLabel>
              <FormControl>
                <Input placeholder="Enter test run name" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Description</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Enter test run description"
                  rows={4}
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="suiteId"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Test Suite</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select test suite" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {testSuites.map((suite) => (
                    <SelectItem key={suite.id} value={suite.id}>
                      {suite.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="flex justify-end space-x-2 pt-4">
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancel
          </Button>
          <Button type="submit">
            Create Test Run
          </Button>
        </div>
      </form>
    </Form>
  );
}