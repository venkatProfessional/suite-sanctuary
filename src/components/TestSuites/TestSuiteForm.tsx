import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from '@/components/ui/form';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Target, Folder, Calendar } from 'lucide-react';
import { TestSuite } from '@/types';
import { dataService } from '@/services/dataService';
import { TestGroupManager } from './TestGroupManager';

const testSuiteSchema = z.object({
  name: z.string()
    .min(1, 'Name is required')
    .max(100, 'Name must be less than 100 characters')
    .regex(/^[a-zA-Z0-9\s\-_\.]+$/, 'Name can only contain letters, numbers, spaces, hyphens, underscores, and dots'),
  description: z.string()
    .min(10, 'Description must be at least 10 characters')
    .max(500, 'Description must be less than 500 characters'),
  parentId: z.string().optional(),
  tags: z.string().optional(),
  priority: z.enum(['Low', 'Medium', 'High']).default('Medium'),
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
  const [selectedGroups, setSelectedGroups] = React.useState<string[]>(suite?.groups || []);

  const form = useForm<TestSuiteFormData>({
    resolver: zodResolver(testSuiteSchema),
    defaultValues: {
      name: suite?.name || '',
      description: suite?.description || '',
      parentId: suite?.parentId || 'none',
      tags: suite?.tags?.join(', ') || '',
      priority: (suite as any)?.priority || 'Medium',
    },
  });

  const handleSubmit = (data: TestSuiteFormData) => {
    const processedData = {
      ...data,
      parentId: data.parentId === 'none' ? undefined : data.parentId,
      tags: data.tags ? data.tags.split(',').map(tag => tag.trim()).filter(Boolean) : [],
      groups: selectedGroups,
    };
    onSubmit(processedData);
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
        <div className="space-y-4">
          <div className="flex items-center space-x-2">
            <Folder className="h-5 w-5 text-primary" />
            <h3 className="text-lg font-semibold">Suite Information</h3>
          </div>
          
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-sm font-medium">Suite Name *</FormLabel>
                <FormControl>
                  <Input 
                    placeholder="e.g., User Authentication, Payment Processing" 
                    {...field} 
                    className="h-10"
                  />
                </FormControl>
                <FormDescription>
                  Choose a clear, descriptive name that reflects the testing scope
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="description"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-sm font-medium">Description *</FormLabel>
                <FormControl>
                  <Textarea
                    placeholder="Describe the purpose, scope, and objectives of this test suite..."
                    rows={4}
                    {...field}
                    className="resize-none"
                  />
                </FormControl>
                <FormDescription>
                  Provide context about what this suite tests and its business value
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <Separator />

        <div className="space-y-4">
          <div className="flex items-center space-x-2">
            <Target className="h-5 w-5 text-primary" />
            <h3 className="text-lg font-semibold">Organization & Priority</h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="parentId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-sm font-medium">Parent Suite</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select parent suite" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="none">No parent (Root level)</SelectItem>
                      {availableParents.map((parentSuite) => (
                        <SelectItem key={parentSuite.id} value={parentSuite.id}>
                          {parentSuite.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormDescription>
                    Create hierarchical test organization
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="priority"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-sm font-medium">Priority Level</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select priority" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="Low">
                        <div className="flex items-center space-x-2">
                          <Badge variant="secondary" className="w-2 h-2 p-0 rounded-full bg-green-500"></Badge>
                          <span>Low Priority</span>
                        </div>
                      </SelectItem>
                      <SelectItem value="Medium">
                        <div className="flex items-center space-x-2">
                          <Badge variant="secondary" className="w-2 h-2 p-0 rounded-full bg-yellow-500"></Badge>
                          <span>Medium Priority</span>
                        </div>
                      </SelectItem>
                      <SelectItem value="High">
                        <div className="flex items-center space-x-2">
                          <Badge variant="secondary" className="w-2 h-2 p-0 rounded-full bg-red-500"></Badge>
                          <span>High Priority</span>
                        </div>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                  <FormDescription>
                    Indicates execution priority for test planning
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <FormField
            control={form.control}
            name="tags"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-sm font-medium">Tags</FormLabel>
                <FormControl>
                  <Input 
                    placeholder="e.g., regression, smoke, api, ui (comma-separated)" 
                    {...field} 
                    className="h-10"
                  />
                </FormControl>
                <FormDescription>
                  Add tags for easier filtering and organization (comma-separated)
                </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <div className="space-y-2">
          <TestGroupManager
            selectedGroups={selectedGroups}
            onGroupsChange={setSelectedGroups}
          />
        </div>
      </div>

        {suite && (
          <>
            <Separator />
            <Card className="bg-muted/50">
              <CardContent className="p-4">
                <div className="flex items-center space-x-2 mb-3">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm font-medium">Suite Metadata</span>
                </div>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-muted-foreground">Created:</span>
                    <p className="font-medium">{new Date(suite.createdAt).toLocaleString()}</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Last Updated:</span>
                    <p className="font-medium">{new Date(suite.updatedAt).toLocaleString()}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </>
        )}

        <div className="flex justify-end space-x-3 pt-4">
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancel
          </Button>
          <Button type="submit" className="bg-primary hover:bg-primary/90">
            {suite ? 'Update Suite' : 'Create Suite'}
          </Button>
        </div>
      </form>
    </Form>
  );
}