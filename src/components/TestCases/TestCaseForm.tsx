import React, { useState, useEffect } from 'react';
import { Plus, X, Save, AlertCircle, Upload, Image as ImageIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { TestCase, TestStep, Priority, TestCaseStatus, ExecutionStatus, FileAttachment, TestSuite } from '@/types';
import { dataService } from '@/services/dataService';
import { v4 as uuidv4 } from 'uuid';

interface TestCaseFormProps {
  initialData?: TestCase;
  onSubmit: (testCase: Partial<TestCase>) => void;
  onCancel: () => void;
}

export const TestCaseForm: React.FC<TestCaseFormProps> = ({
  initialData,
  onSubmit,
  onCancel
}) => {
  const [formData, setFormData] = useState({
    title: initialData?.title || '',
    description: initialData?.description || '',
    preconditions: initialData?.preconditions || '',
    expectedResults: initialData?.expectedResults || '',
    priority: initialData?.priority || 'Medium' as Priority,
    status: initialData?.status || 'Draft' as TestCaseStatus,
    executionStatus: initialData?.executionStatus || 'Not Run' as ExecutionStatus,
    customStatus: initialData?.customStatus || '',
    suiteId: initialData?.suiteId || '',
    tags: initialData?.tags || [] as string[]
  });

  const [testSuites, setTestSuites] = useState<TestSuite[]>([]);
  const [screenshots, setScreenshots] = useState<FileAttachment[]>(initialData?.screenshots || []);

  const [steps, setSteps] = useState<TestStep[]>(
    initialData?.steps || [
      { id: uuidv4(), description: '', expectedResult: '' }
    ]
  );

  const [newTag, setNewTag] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    setTestSuites(dataService.getTestSuites());
  }, []);

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.title.trim()) {
      newErrors.title = 'Title is required';
    }

    if (!formData.description.trim()) {
      newErrors.description = 'Description is required';
    }

    if (steps.some(step => !step.description.trim())) {
      newErrors.steps = 'All steps must have a description';
    }

    if (steps.some(step => !step.expectedResult.trim())) {
      newErrors.steps = 'All steps must have an expected result';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    const testCaseData: Partial<TestCase> = {
      ...formData,
      steps: steps.filter(step => step.description.trim() && step.expectedResult.trim()),
      screenshots,
      id: initialData?.id
    };

    onSubmit(testCaseData);
  };

  const addStep = () => {
    setSteps([...steps, { id: uuidv4(), description: '', expectedResult: '' }]);
  };

  const removeStep = (stepId: string) => {
    if (steps.length > 1) {
      setSteps(steps.filter(step => step.id !== stepId));
    }
  };

  const updateStep = (stepId: string, field: keyof TestStep, value: string) => {
    setSteps(steps.map(step => 
      step.id === stepId ? { ...step, [field]: value } : step
    ));
  };

  const addTag = () => {
    const tag = newTag.trim().toLowerCase();
    if (tag && !formData.tags.includes(tag)) {
      setFormData({ ...formData, tags: [...formData.tags, tag] });
      setNewTag('');
    }
  };

  const removeTag = (tagToRemove: string) => {
    setFormData({
      ...formData,
      tags: formData.tags.filter(tag => tag !== tagToRemove)
    });
  };

  const handleKeyPress = (e: React.KeyboardEvent, action: () => void) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      action();
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    Array.from(files).forEach(file => {
      if (file.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onload = (event) => {
          const base64Data = event.target?.result as string;
          const attachment: FileAttachment = {
            id: uuidv4(),
            name: file.name,
            size: file.size,
            type: file.type,
            base64Data,
            uploadedAt: new Date().toISOString()
          };
          setScreenshots(prev => [...prev, attachment]);
        };
        reader.readAsDataURL(file);
      }
    });
  };

  const removeScreenshot = (id: string) => {
    setScreenshots(prev => prev.filter(s => s.id !== id));
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Basic Information */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Basic Information</CardTitle>
          <CardDescription>
            Provide the fundamental details for your test case
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <Label htmlFor="title">Title *</Label>
              <Input
                id="title"
                placeholder="e.g., User Login with Valid Credentials"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                className={errors.title ? 'border-destructive' : ''}
              />
              {errors.title && (
                <p className="text-sm text-destructive mt-1">{errors.title}</p>
              )}
            </div>

            <div>
              <Label htmlFor="priority">Priority</Label>
              <Select value={formData.priority} onValueChange={(value: Priority) => 
                setFormData({ ...formData, priority: value })
              }>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Low">Low</SelectItem>
                  <SelectItem value="Medium">Medium</SelectItem>
                  <SelectItem value="High">High</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="status">Status</Label>
              <Select value={formData.status} onValueChange={(value: TestCaseStatus) => 
                setFormData({ ...formData, status: value })
              }>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Draft">Draft</SelectItem>
                  <SelectItem value="Active">Active</SelectItem>
                  <SelectItem value="Archived">Archived</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="suite">Test Suite</Label>
              <Select value={formData.suiteId} onValueChange={(value: string) => 
                setFormData({ ...formData, suiteId: value || undefined })
              }>
                <SelectTrigger>
                  <SelectValue placeholder="Select a test suite" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">No Suite</SelectItem>
                  {testSuites.map(suite => (
                    <SelectItem key={suite.id} value={suite.id}>
                      {suite.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="executionStatus">Execution Status</Label>
              <Select value={formData.executionStatus} onValueChange={(value: ExecutionStatus) => 
                setFormData({ ...formData, executionStatus: value })
              }>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Pass">Pass</SelectItem>
                  <SelectItem value="Fail">Fail</SelectItem>
                  <SelectItem value="Blocked">Blocked</SelectItem>
                  <SelectItem value="Skipped">Skipped</SelectItem>
                  <SelectItem value="In Progress">In Progress</SelectItem>
                  <SelectItem value="Not Run">Not Run</SelectItem>
                  <SelectItem value="Other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {formData.executionStatus === 'Other' && (
              <div className="md:col-span-2">
                <Label htmlFor="customStatus">Custom Status</Label>
                <Input
                  id="customStatus"
                  placeholder="Enter custom status"
                  value={formData.customStatus}
                  onChange={(e) => setFormData({ ...formData, customStatus: e.target.value })}
                />
              </div>
            )}

            <div className="md:col-span-2">
              <Label htmlFor="description">Description *</Label>
              <Textarea
                id="description"
                placeholder="Describe what this test case validates..."
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className={errors.description ? 'border-destructive' : ''}
                rows={3}
              />
              {errors.description && (
                <p className="text-sm text-destructive mt-1">{errors.description}</p>
              )}
            </div>

            <div className="md:col-span-2">
              <Label htmlFor="preconditions">Preconditions</Label>
              <Textarea
                id="preconditions"
                placeholder="List any setup or conditions required before executing this test..."
                value={formData.preconditions}
                onChange={(e) => setFormData({ ...formData, preconditions: e.target.value })}
                rows={2}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Test Steps */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-lg">Test Steps</CardTitle>
              <CardDescription>
                Define the actions to perform and expected results
              </CardDescription>
            </div>
            <Button type="button" onClick={addStep} variant="outline" size="sm">
              <Plus className="w-4 h-4 mr-2" />
              Add Step
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {errors.steps && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{errors.steps}</AlertDescription>
            </Alert>
          )}
          
          {steps.map((step, index) => (
            <Card key={step.id} className="bg-muted/30">
              <CardContent className="pt-4">
                <div className="flex items-start gap-4">
                  <div className="flex-shrink-0 w-8 h-8 bg-primary rounded-full flex items-center justify-center text-primary-foreground text-sm font-medium">
                    {index + 1}
                  </div>
                  
                  <div className="flex-1 space-y-3">
                    <div>
                      <Label>Action</Label>
                      <Textarea
                        placeholder="Describe the action to perform..."
                        value={step.description}
                        onChange={(e) => updateStep(step.id, 'description', e.target.value)}
                        rows={2}
                      />
                    </div>
                    
                    <div>
                      <Label>Expected Result</Label>
                      <Textarea
                        placeholder="What should happen after this action?"
                        value={step.expectedResult}
                        onChange={(e) => updateStep(step.id, 'expectedResult', e.target.value)}
                        rows={2}
                      />
                    </div>
                  </div>

                  {steps.length > 1 && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => removeStep(step.id)}
                      className="text-destructive hover:text-destructive"
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </CardContent>
      </Card>

      {/* Expected Results & Tags */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Additional Information</CardTitle>
          <CardDescription>
            Overall expected results and categorization
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="expectedResults">Overall Expected Results</Label>
            <Textarea
              id="expectedResults"
              placeholder="Describe the overall expected outcome of this test case..."
              value={formData.expectedResults}
              onChange={(e) => setFormData({ ...formData, expectedResults: e.target.value })}
              rows={3}
            />
          </div>

          <div>
            <Label>Screenshots</Label>
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Input
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={handleFileUpload}
                  className="hidden"
                  id="screenshot-upload"
                />
                <Button type="button" variant="outline" asChild>
                  <Label htmlFor="screenshot-upload" className="cursor-pointer">
                    <Upload className="w-4 h-4 mr-2" />
                    Upload Screenshots
                  </Label>
                </Button>
                <span className="text-sm text-muted-foreground">
                  PNG, JPG, JPEG supported
                </span>
              </div>
              
              {screenshots.length > 0 && (
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {screenshots.map((screenshot) => (
                    <div key={screenshot.id} className="relative group">
                      <div className="bg-muted rounded-lg p-2 border">
                        <div className="flex items-center space-x-2">
                          <ImageIcon className="w-4 h-4 text-muted-foreground" />
                          <span className="text-xs truncate">{screenshot.name}</span>
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">
                          {(screenshot.size / 1024).toFixed(1)} KB
                        </p>
                      </div>
                      <Button
                        type="button"
                        variant="destructive"
                        size="sm"
                        className="absolute -top-2 -right-2 h-6 w-6 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                        onClick={() => removeScreenshot(screenshot.id)}
                      >
                        <X className="w-3 h-3" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div>
            <Label>Tags</Label>
            <div className="flex flex-wrap gap-2 mb-2">
              {formData.tags.map((tag) => (
                <Badge key={tag} variant="secondary" className="text-sm">
                  {tag}
                  <button
                    type="button"
                    onClick={() => removeTag(tag)}
                    className="ml-2 hover:bg-destructive hover:text-destructive-foreground rounded-full"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </Badge>
              ))}
            </div>
            <div className="flex gap-2">
              <Input
                placeholder="Add a tag..."
                value={newTag}
                onChange={(e) => setNewTag(e.target.value)}
                onKeyPress={(e) => handleKeyPress(e, addTag)}
              />
              <Button type="button" onClick={addTag} variant="outline">
                Add
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Form Actions */}
      <div className="flex justify-end gap-3 pt-4 border-t">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" className="bg-primary hover:bg-primary/90">
          <Save className="w-4 h-4 mr-2" />
          {initialData ? 'Update' : 'Create'} Test Case
        </Button>
      </div>
    </form>
  );
};