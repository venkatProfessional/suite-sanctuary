import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { TestSuite } from '@/types';
import { dataService } from '@/services/dataService';

const testSuiteSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100, 'Name must be less than 100 characters'),
  description: z.string().min(1, 'Description is required').max(500, 'Description must be less than 500 characters'),
  parentId: z.string().optional(),
});

type TestSuiteFormData = z.infer<typeof testSuiteSchema>;

interface TestSuiteFormProps {
  suite?: TestSuite | null;
  onSubmit: (data: Partial<TestSuite>) => void;
  onCancel: () => void;
}

export function TestSuiteForm({ suite, onSubmit, onCancel }: TestSuiteFormProps) {
  const testSuites = dataService.getTestSuites();
  const availableParents = testSuites.filter(s => s.id !== suite?.id);

  const form = useForm<TestSuiteFormData>({
    resolver: zodResolver(testSuiteSchema),
    defaultValues: {
      name: suite?.name || '',
      description: suite?.description || '',
      parentId: suite?.parentId || 'none',
    },
  });

  const handleSubmit = (data: TestSuiteFormData) => {
    onSubmit({
      ...data,
      parentId: data.parentId === 'none' ? undefined : data.parentId,
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
                <Input placeholder="Enter suite name" {...field} />
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
                  placeholder="Enter suite description"
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
          name="parentId"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Parent Suite (Optional)</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select parent suite" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="none">No parent</SelectItem>
                  {availableParents.map((parentSuite) => (
                    <SelectItem key={parentSuite.id} value={parentSuite.id}>
                      {parentSuite.name}
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
            {suite ? 'Update Suite' : 'Create Suite'}
          </Button>
        </div>
      </form>
    </Form>
  );
}