import React, { useEffect, useRef } from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ChartData,
  ChartOptions
} from 'chart.js';
import { Bar } from 'react-chartjs-2';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
);

interface MetricsChartProps {
  metrics: {
    totalExecutions: number;
    passRate: number;
    failRate: number;
    skipRate: number;
    blockRate: number;
  };
}

export const MetricsChart: React.FC<MetricsChartProps> = ({ metrics }) => {
  const chartRef = useRef<ChartJS<'bar'>>(null);

  const data: ChartData<'bar'> = {
    labels: ['Pass', 'Fail', 'Skipped', 'Blocked'],
    datasets: [
      {
        label: 'Execution Results (%)',
        data: [
          metrics.passRate,
          metrics.failRate,
          metrics.skipRate,
          metrics.blockRate
        ],
        backgroundColor: [
          'hsl(var(--exec-pass))',
          'hsl(var(--exec-fail))',
          'hsl(var(--exec-skip))',
          'hsl(var(--exec-block))'
        ],
        borderColor: [
          'hsl(var(--exec-pass))',
          'hsl(var(--exec-fail))',
          'hsl(var(--exec-skip))',
          'hsl(var(--exec-block))'
        ],
        borderWidth: 1,
        borderRadius: 4,
        borderSkipped: false,
      }
    ]
  };

  const options: ChartOptions<'bar'> = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false
      },
      tooltip: {
        callbacks: {
          label: (context) => {
            return `${context.parsed.y.toFixed(1)}%`;
          }
        }
      }
    },
    scales: {
      x: {
        grid: {
          display: false
        },
        ticks: {
          color: 'hsl(var(--muted-foreground))',
          font: {
            size: 12
          }
        }
      },
      y: {
        beginAtZero: true,
        max: 100,
        grid: {
          color: 'hsl(var(--border))'
        },
        ticks: {
          color: 'hsl(var(--muted-foreground))',
          font: {
            size: 12
          },
          callback: function(value) {
            return value + '%';
          }
        }
      }
    },
    elements: {
      bar: {
        borderRadius: 4
      }
    }
  };

  return (
    <div className="h-64">
      {metrics.totalExecutions === 0 ? (
        <div className="flex items-center justify-center h-full text-muted-foreground">
          <div className="text-center">
            <p className="text-sm">No execution data available</p>
            <p className="text-xs mt-1">Execute test cases to see metrics</p>
          </div>
        </div>
      ) : (
        <Bar ref={chartRef} data={data} options={options} />
      )}
    </div>
  );
};