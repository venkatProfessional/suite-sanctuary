import React, { useState, useEffect } from 'react';
import { BarChart, PieChart, TrendingUp, Activity, FileText, Calendar } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DatePickerWithRange } from '@/components/ui/date-picker-with-range';
import { Badge } from '@/components/ui/badge';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend, ArcElement } from 'chart.js';
import { Bar, Pie } from 'react-chartjs-2';
import { dataService } from '@/services/dataService';
import { TestCase, TestRun, ExecutionStatus } from '@/types';
import { format, subDays, isWithinInterval } from 'date-fns';

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend, ArcElement);

interface ReportMetrics {
  totalTestCases: number;
  totalTestRuns: number;
  executionMetrics: {
    pass: number;
    fail: number;
    skipped: number;
    blocked: number;
    notExecuted: number;
  };
  passRate: number;
  trendsData: Array<{
    date: string;
    pass: number;
    fail: number;
    skipped: number;
  }>;
  priorityDistribution: Record<string, number>;
  statusDistribution: Record<string, number>;
}

export function ReportsDashboard() {
  const [metrics, setMetrics] = useState<ReportMetrics | null>(null);
  const [selectedPeriod, setSelectedPeriod] = useState('30');
  const [dateRange, setDateRange] = useState<{ from: Date; to: Date } | undefined>();

  useEffect(() => {
    calculateMetrics();
  }, [selectedPeriod, dateRange]);

  const calculateMetrics = () => {
    const testCases = dataService.getTestCases();
    const testRuns = dataService.getTestRuns();
    
    // Filter by date range if specified
    let filteredRuns = testRuns;
    if (dateRange?.from && dateRange?.to) {
      filteredRuns = testRuns.filter(run => 
        isWithinInterval(new Date(run.createdAt), {
          start: dateRange.from,
          end: dateRange.to
        })
      );
    } else {
      const days = parseInt(selectedPeriod);
      const cutoffDate = subDays(new Date(), days);
      filteredRuns = testRuns.filter(run => 
        new Date(run.createdAt) >= cutoffDate
      );
    }

    // Calculate execution metrics
    const allExecutions = filteredRuns.flatMap(run => run.executions);
    const executionMetrics = {
      pass: allExecutions.filter(e => e.status === 'Pass').length,
      fail: allExecutions.filter(e => e.status === 'Fail').length,
      skipped: allExecutions.filter(e => e.status === 'Skipped').length,
      blocked: allExecutions.filter(e => e.status === 'Blocked').length,
      notExecuted: allExecutions.filter(e => e.status === 'Not Executed').length,
    };

    const totalExecuted = executionMetrics.pass + executionMetrics.fail + executionMetrics.skipped + executionMetrics.blocked;
    const passRate = totalExecuted > 0 ? (executionMetrics.pass / totalExecuted) * 100 : 0;

    // Calculate trends data (last 7 days)
    const trendsData = [];
    for (let i = 6; i >= 0; i--) {
      const date = subDays(new Date(), i);
      const dayRuns = filteredRuns.filter(run => 
        format(new Date(run.createdAt), 'yyyy-MM-dd') === format(date, 'yyyy-MM-dd')
      );
      const dayExecutions = dayRuns.flatMap(run => run.executions);
      
      trendsData.push({
        date: format(date, 'MMM dd'),
        pass: dayExecutions.filter(e => e.status === 'Pass').length,
        fail: dayExecutions.filter(e => e.status === 'Fail').length,
        skipped: dayExecutions.filter(e => e.status === 'Skipped').length,
      });
    }

    // Priority distribution
    const priorityDistribution = {
      High: testCases.filter(tc => tc.priority === 'High').length,
      Medium: testCases.filter(tc => tc.priority === 'Medium').length,
      Low: testCases.filter(tc => tc.priority === 'Low').length,
    };

    // Status distribution
    const statusDistribution = {
      Active: testCases.filter(tc => tc.status === 'Active').length,
      Draft: testCases.filter(tc => tc.status === 'Draft').length,
      Archived: testCases.filter(tc => tc.status === 'Archived').length,
    };

    setMetrics({
      totalTestCases: testCases.length,
      totalTestRuns: filteredRuns.length,
      executionMetrics,
      passRate,
      trendsData,
      priorityDistribution,
      statusDistribution,
    });
  };

  if (!metrics) {
    return <div>Loading...</div>;
  }

  const executionChartData = {
    labels: ['Pass', 'Fail', 'Skipped', 'Blocked', 'Not Executed'],
    datasets: [
      {
        label: 'Test Executions',
        data: [
          metrics.executionMetrics.pass,
          metrics.executionMetrics.fail,
          metrics.executionMetrics.skipped,
          metrics.executionMetrics.blocked,
          metrics.executionMetrics.notExecuted,
        ],
        backgroundColor: [
          'hsl(var(--success))',
          'hsl(var(--destructive))',
          'hsl(var(--warning))',
          'hsl(var(--destructive))',
          'hsl(var(--muted))',
        ],
        borderWidth: 1,
      },
    ],
  };

  const trendsChartData = {
    labels: metrics.trendsData.map(d => d.date),
    datasets: [
      {
        label: 'Pass',
        data: metrics.trendsData.map(d => d.pass),
        backgroundColor: 'hsl(var(--success))',
      },
      {
        label: 'Fail',
        data: metrics.trendsData.map(d => d.fail),
        backgroundColor: 'hsl(var(--destructive))',
      },
      {
        label: 'Skipped',
        data: metrics.trendsData.map(d => d.skipped),
        backgroundColor: 'hsl(var(--warning))',
      },
    ],
  };

  const priorityChartData = {
    labels: Object.keys(metrics.priorityDistribution),
    datasets: [
      {
        data: Object.values(metrics.priorityDistribution),
        backgroundColor: [
          'hsl(var(--destructive))',
          'hsl(var(--warning))',
          'hsl(var(--success))',
        ],
      },
    ],
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Reports</h1>
          <p className="text-muted-foreground mt-1">
            Analytics and insights for your testing efforts
          </p>
        </div>
        <div className="flex items-center space-x-4">
          <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7">Last 7 days</SelectItem>
              <SelectItem value="30">Last 30 days</SelectItem>
              <SelectItem value="90">Last 90 days</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Test Cases</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.totalTestCases}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Test Runs</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.totalTestRuns}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pass Rate</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-success">
              {metrics.passRate.toFixed(1)}%
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Executions</CardTitle>
            <BarChart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {Object.values(metrics.executionMetrics).reduce((a, b) => a + b, 0)}
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="execution" className="space-y-6">
        <TabsList>
          <TabsTrigger value="execution">Execution Results</TabsTrigger>
          <TabsTrigger value="trends">Trends</TabsTrigger>
          <TabsTrigger value="distribution">Distribution</TabsTrigger>
        </TabsList>

        <TabsContent value="execution" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Test Execution Results</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-80">
                <Bar
                  data={executionChartData}
                  options={{
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                      legend: {
                        display: false,
                      },
                    },
                  }}
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="trends" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Execution Trends (Last 7 Days)</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-80">
                <Bar
                  data={trendsChartData}
                  options={{
                    responsive: true,
                    maintainAspectRatio: false,
                    scales: {
                      x: {
                        stacked: true,
                      },
                      y: {
                        stacked: true,
                      },
                    },
                  }}
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="distribution" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Priority Distribution</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-80">
                  <Pie
                    data={priorityChartData}
                    options={{
                      responsive: true,
                      maintainAspectRatio: false,
                    }}
                  />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Test Case Status</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {Object.entries(metrics.statusDistribution).map(([status, count]) => (
                  <div key={status} className="flex items-center justify-between">
                    <Badge variant="outline">{status}</Badge>
                    <span className="font-semibold">{count}</span>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}