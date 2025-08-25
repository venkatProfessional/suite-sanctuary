import React from 'react';
import { Edit, Calendar, User, Hash, Tag, CheckCircle2, FileText } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { TestCase, Priority, TestCaseStatus } from '@/types';

interface TestCaseDetailProps {
  testCase: TestCase;
  onClose: () => void;
  onEdit: () => void;
}

export const TestCaseDetail: React.FC<TestCaseDetailProps> = ({
  testCase,
  onClose,
  onEdit
}) => {
  const getPriorityColor = (priority: Priority) => {
    switch (priority) {
      case 'High': return 'bg-priority-high/10 text-priority-high border-priority-high/20';
      case 'Medium': return 'bg-priority-medium/10 text-priority-medium border-priority-medium/20';
      case 'Low': return 'bg-priority-low/10 text-priority-low border-priority-low/20';
      default: return 'bg-muted text-muted-foreground';
    }
  };

  const getStatusColor = (status: TestCaseStatus) => {
    switch (status) {
      case 'Active': return 'bg-status-active/10 text-status-active border-status-active/20';
      case 'Draft': return 'bg-status-draft/10 text-status-draft border-status-draft/20';
      case 'Archived': return 'bg-status-archived/10 text-status-archived border-status-archived/20';
      default: return 'bg-muted text-muted-foreground';
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <h2 className="text-2xl font-bold text-foreground mb-2">{testCase.title}</h2>
          <div className="flex items-center gap-4 text-sm text-muted-foreground">
            <div className="flex items-center gap-1">
              <Hash className="w-4 h-4" />
              {testCase.id}
            </div>
            <div className="flex items-center gap-1">
              <Calendar className="w-4 h-4" />
              Version {testCase.version}
            </div>
          </div>
        </div>
        <Button onClick={onEdit} className="bg-primary hover:bg-primary/90">
          <Edit className="w-4 h-4 mr-2" />
          Edit
        </Button>
      </div>

      {/* Status and Priority */}
      <div className="flex flex-wrap gap-2">
        <Badge variant="outline" className={getPriorityColor(testCase.priority)}>
          {testCase.priority} Priority
        </Badge>
        <Badge variant="outline" className={getStatusColor(testCase.status)}>
          {testCase.status}
        </Badge>
      </div>

      {/* Basic Information */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <FileText className="w-5 h-5" />
            Description
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-foreground leading-relaxed">{testCase.description}</p>
        </CardContent>
      </Card>

      {/* Preconditions */}
      {testCase.preconditions && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Preconditions</CardTitle>
            <CardDescription>
              Setup and conditions required before executing this test
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-foreground leading-relaxed">{testCase.preconditions}</p>
          </CardContent>
        </Card>
      )}

      {/* Test Steps */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Test Steps</CardTitle>
          <CardDescription>
            Detailed steps to execute this test case
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {testCase.steps.map((step, index) => (
              <div key={step.id} className="flex gap-4">
                <div className="flex-shrink-0">
                  <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center text-primary-foreground text-sm font-medium">
                    {index + 1}
                  </div>
                </div>
                <div className="flex-1 space-y-2">
                  <div>
                    <h4 className="font-medium text-foreground mb-1">Action</h4>
                    <p className="text-muted-foreground leading-relaxed">{step.description}</p>
                  </div>
                  <div>
                    <h4 className="font-medium text-foreground mb-1 flex items-center gap-1">
                      <CheckCircle2 className="w-4 h-4 text-success" />
                      Expected Result
                    </h4>
                    <p className="text-muted-foreground leading-relaxed">{step.expectedResult}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Expected Results */}
      {testCase.expectedResults && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-success" />
              Overall Expected Results
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-foreground leading-relaxed">{testCase.expectedResults}</p>
          </CardContent>
        </Card>
      )}

      {/* Tags */}
      {testCase.tags.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Tag className="w-5 h-5" />
              Tags
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {testCase.tags.map((tag) => (
                <Badge key={tag} variant="secondary" className="text-sm">
                  {tag}
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Metadata */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Metadata</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div>
              <span className="font-medium text-foreground">Created:</span>
              <span className="text-muted-foreground ml-2">
                {formatDate(testCase.createdAt)}
              </span>
            </div>
            <div>
              <span className="font-medium text-foreground">Last Updated:</span>
              <span className="text-muted-foreground ml-2">
                {formatDate(testCase.updatedAt)}
              </span>
            </div>
            <div>
              <span className="font-medium text-foreground">Version:</span>
              <span className="text-muted-foreground ml-2">{testCase.version}</span>
            </div>
            <div>
              <span className="font-medium text-foreground">Test Steps:</span>
              <span className="text-muted-foreground ml-2">{testCase.steps.length}</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Actions */}
      <div className="flex justify-end gap-3 pt-4 border-t">
        <Button variant="outline" onClick={onClose}>
          Close
        </Button>
        <Button onClick={onEdit} className="bg-primary hover:bg-primary/90">
          <Edit className="w-4 h-4 mr-2" />
          Edit Test Case
        </Button>
      </div>
    </div>
  );
};