import { useEffect, useRef } from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  TimeScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import 'chartjs-adapter-date-fns'; // Adaptador para fechas
import { Line } from 'react-chartjs-2';

ChartJS.register(
  CategoryScale,
  LinearScale,
  TimeScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

interface TempData {
  time: number; // timestamp
  temperature: number;
  sensor: string;
}

interface TempChartProps {
  data: TempData[];
  title?: string;
}

export default function TempChart({ data, title = "Temperatura (24h)" }: TempChartProps) {
  const chartData = {
    datasets: [
      {
        label: 'Temperatura (°C)',
        data: data.map(d => ({
          x: d.time, // Chart.js usará el timestamp directamente
          y: d.temperature
        })),
        borderColor: 'rgb(75, 192, 192)',
        backgroundColor: 'rgba(75, 192, 192, 0.2)',
        tension: 0.1,
      },
    ],
  };

  const options = {
    responsive: true,
    plugins: {
      legend: {
        position: 'top' as const,
      },
      title: {
        display: true,
        text: title,
      },
    },
    scales: {
      x: {
        type: 'time' as const,
        time: {
          unit: 'hour' as const,
          displayFormats: {
            hour: 'HH:mm'
          }
        },
        title: {
          display: true,
          text: 'Hora'
        }
      },
      y: {
        beginAtZero: false,
        title: {
          display: true,
          text: 'Temperatura (°C)'
        }
      }
    },
  };

  return (
    <div style={{ maxWidth: '800px', margin: '0 auto' }}>
      <Line data={chartData} options={options} />
    </div>
  );
}