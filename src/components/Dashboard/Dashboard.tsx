import React, { useState, useEffect } from 'react';
import { 
  FileText, 
  FolderOpen, 
  PlayCircle, 
  TrendingUp,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  Minus
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { dataService } from '@/services/dataService';
import { DashboardMetrics, AuditLog } from '@/types';
import { MetricsChart } from './MetricsChart';

export const Dashboard: React.FC = () => {
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadMetrics = () => {
      try {
        const data = dataService.getMetrics();
        setMetrics(data);
      } catch (error) {
        console.error('Error loading metrics:', error);
      } finally {
        setLoading(false);
      }
    };

    loadMetrics();
    // Refresh metrics every 30 seconds
    const interval = setInterval(loadMetrics, 30000);
    
    return () => clearInterval(interval);
  }, []);

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardHeader className="pb-2">
                <div className="h-4 bg-muted rounded w-1/2"></div>
                <div className="h-8 bg-muted rounded w-1/3 mt-2"></div>
              </CardHeader>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (!metrics) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">Failed to load dashboard metrics</p>
      </div>
    );
  }

  const getStatusIcon = (status: string) => {
    switch (status.toLowerCase()) {
      case 'pass': return <CheckCircle className="w-4 h-4 text-execution-pass" />;
      case 'fail': return <XCircle className="w-4 h-4 text-execution-fail" />;
      case 'skipped': return <Minus className="w-4 h-4 text-execution-skip" />;
      case 'blocked': return <AlertCircle className="w-4 h-4 text-execution-block" />;
      default: return <Clock className="w-4 h-4 text-muted-foreground" />;
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div>
        <h1 className="text-3xl font-bold text-foreground">Dashboard</h1>
        <p className="text-muted-foreground mt-1">
          Overview of your test case management activities
        </p>
      </div>

      {/* Key Metrics Cards */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="bg-gradient-to-br from-card to-card/50 border-l-4 border-l-primary">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center text-sm font-medium text-muted-foreground">
              <FileText className="w-4 h-4 mr-2" />
              Total Test Cases
            </CardTitle>
            <div className="text-2xl font-bold text-foreground">
              {metrics.totalTestCases}
            </div>
          </CardHeader>
        </Card>

        <Card className="bg-gradient-to-br from-card to-card/50 border-l-4 border-l-success">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center text-sm font-medium text-muted-foreground">
              <CheckCircle className="w-4 h-4 mr-2" />
              Pass Rate
            </CardTitle>
            <div className="text-2xl font-bold text-foreground">
              {metrics.executionMetrics.passRate.toFixed(1)}%
            </div>
          </CardHeader>
        </Card>

        <Card className="bg-gradient-to-br from-card to-card/50 border-l-4 border-l-warning">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center text-sm font-medium text-muted-foreground">
              <PlayCircle className="w-4 h-4 mr-2" />
              Total Executions
            </CardTitle>
            <div className="text-2xl font-bold text-foreground">
              {metrics.executionMetrics.totalExecutions}
            </div>
          </CardHeader>
        </Card>

        <Card className="bg-gradient-to-br from-card to-card/50 border-l-4 border-l-info">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center text-sm font-medium text-muted-foreground">
              <TrendingUp className="w-4 h-4 mr-2" />
              Active Test Cases
            </CardTitle>
            <div className="text-2xl font-bold text-foreground">
              {metrics.testCasesByStatus.Active || 0}
            </div>
          </CardHeader>
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Test Case Status Distribution */}
        <Card>
          <CardHeader>
            <CardTitle>Test Case Status</CardTitle>
            <CardDescription>
              Distribution of test cases by status
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {Object.entries(metrics.testCasesByStatus).map(([status, count]) => (
                <div key={status} className="flex items-center justify-between">
                  <div className="flex items-center">
                    <Badge 
                      variant="secondary" 
                      className={`mr-2 ${
                        status === 'Active' ? 'bg-status-active/10 text-status-active' :
                        status === 'Draft' ? 'bg-status-draft/10 text-status-draft' :
                        'bg-status-archived/10 text-status-archived'
                      }`}
                    >
                      {status}
                    </Badge>
                    <span className="text-sm text-muted-foreground">{count} cases</span>
                  </div>
                  <div className="flex-1 mx-4">
                    <Progress 
                      value={metrics.totalTestCases > 0 ? (count / metrics.totalTestCases) * 100 : 0}
                      className="h-2"
                    />
                  </div>
                  <span className="text-sm font-medium">
                    {metrics.totalTestCases > 0 ? Math.round((count / metrics.totalTestCases) * 100) : 0}%
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Execution Metrics Chart */}
        <Card>
          <CardHeader>
            <CardTitle>Execution Metrics</CardTitle>
            <CardDescription>
              Test execution results overview
            </CardDescription>
          </CardHeader>
          <CardContent>
            <MetricsChart metrics={metrics.executionMetrics} />
          </CardContent>
        </Card>

        {/* Priority Distribution */}
        <Card>
          <CardHeader>
            <CardTitle>Test Cases by Priority</CardTitle>
            <CardDescription>
              Distribution of test cases by priority level
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {Object.entries(metrics.testCasesByPriority).map(([priority, count]) => (
                <div key={priority} className="flex items-center justify-between">
                  <div className="flex items-center">
                    <Badge 
                      variant="secondary" 
                      className={`mr-2 ${
                        priority === 'High' ? 'bg-priority-high/10 text-priority-high' :
                        priority === 'Medium' ? 'bg-priority-medium/10 text-priority-medium' :
                        'bg-priority-low/10 text-priority-low'
                      }`}
                    >
                      {priority}
                    </Badge>
                    <span className="text-sm text-muted-foreground">{count} cases</span>
                  </div>
                  <div className="flex-1 mx-4">
                    <Progress 
                      value={metrics.totalTestCases > 0 ? (count / metrics.totalTestCases) * 100 : 0}
                      className="h-2"
                    />
                  </div>
                  <span className="text-sm font-medium">
                    {metrics.totalTestCases > 0 ? Math.round((count / metrics.totalTestCases) * 100) : 0}%
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Recent Activity */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
            <CardDescription>
              Latest actions in the system
            </CardDescription>
          </CardHeader>
          <CardContent>
            {metrics.recentActivity.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">
                No recent activity
              </p>
            ) : (
              <div className="space-y-3">
                {metrics.recentActivity.map((log: AuditLog) => (
                  <div key={log.id} className="flex items-start space-x-3 text-sm">
                    <div className="flex-shrink-0 mt-0.5">
                      {getStatusIcon(log.action)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-foreground font-medium truncate">
                        {log.action}
                      </p>
                      <p className="text-muted-foreground text-xs">
                        {log.entityType} • {formatDate(log.timestamp)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};