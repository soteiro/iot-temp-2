import { useEffect, useRef } from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  TimeScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  Filler,
} from 'chart.js';
import 'chartjs-adapter-date-fns';
import { Line, Bar } from 'react-chartjs-2';

ChartJS.register(
  CategoryScale,
  LinearScale,
  TimeScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

interface AnalyticsData {
  time: number;
  temperature: number;
  humidity?: number;
  sensor: string;
}

interface AnalyticsChartProps {
  data: AnalyticsData[];
  type: 'line' | 'bar';
  title?: string;
  showHumidity?: boolean;
  timeRange?: 'day' | 'week' | 'month';
}

export default function AnalyticsChart({ 
  data, 
  type, 
  title = "Análisis de Temperatura", 
  showHumidity = false,
  timeRange = 'day'
}: AnalyticsChartProps) {
  
  const getTimeUnit = () => {
    switch(timeRange) {
      case 'day': return 'hour';
      case 'week': return 'day';
      case 'month': return 'day';
      default: return 'hour';
    }
  };

  const getDisplayFormat = () => {
    switch(timeRange) {
      case 'day': return 'HH:mm';
      case 'week': return 'MMM dd';
      case 'month': return 'MMM dd';
      default: return 'HH:mm';
    }
  };

  const chartData = {
    datasets: [
      {
        label: 'Temperatura (°C)',
        data: data.map(d => ({
          x: d.time,
          y: d.temperature
        })),
        borderColor: 'rgb(59, 130, 246)',
        backgroundColor: type === 'line' ? 'rgba(59, 130, 246, 0.1)' : 'rgba(59, 130, 246, 0.8)',
        tension: 0.4,
        fill: type === 'line',
      },
      ...(showHumidity ? [{
        label: 'Humedad (%)',
        data: data.map(d => ({
          x: d.time,
          y: d.humidity || 0
        })),
        borderColor: 'rgb(16, 185, 129)',
        backgroundColor: type === 'line' ? 'rgba(16, 185, 129, 0.1)' : 'rgba(16, 185, 129, 0.8)',
        tension: 0.4,
        fill: false,
        yAxisID: 'y1',
      }] : [])
    ],
  };

  const options = {
    responsive: true,
    interaction: {
      mode: 'index' as const,
      intersect: false,
    },
    plugins: {
      legend: {
        position: 'top' as const,
      },
      title: {
        display: true,
        text: title,
        font: {
          size: 16,
          weight: 'bold' as const,
        }
      },
      tooltip: {
        callbacks: {
          label: function(context: any) {
            let label = context.dataset.label || '';
            if (label) {
              label += ': ';
            }
            if (context.parsed.y !== null) {
              label += context.parsed.y.toFixed(1);
              label += context.dataset.label?.includes('Temperatura') ? '°C' : '%';
            }
            return label;
          }
        }
      }
    },
    scales: {
      x: {
        type: 'time' as const,
        time: {
          unit: getTimeUnit() as any,
          displayFormats: {
            [getTimeUnit()]: getDisplayFormat()
          }
        },
        title: {
          display: true,
          text: 'Tiempo'
        }
      },
      y: {
        type: 'linear' as const,
        display: true,
        position: 'left' as const,
        title: {
          display: true,
          text: 'Temperatura (°C)'
        }
      },
      ...(showHumidity ? {
        y1: {
          type: 'linear' as const,
          display: true,
          position: 'right' as const,
          title: {
            display: true,
            text: 'Humedad (%)'
          },
          grid: {
            drawOnChartArea: false,
          },
        }
      } : {})
    },
  };

  if (type === 'line') {
    return <Line data={chartData} options={options} />;
  }
  
  return <Bar data={chartData} options={options} />;
}