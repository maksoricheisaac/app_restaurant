"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Line } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
} from "chart.js";

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

interface ChartDataPoint {
  date: string;
  revenue: number;
  orders: number;
}

interface RevenueChartProps {
  data: ChartDataPoint[];
  period: string;
}

export function RevenueChart({ data, period }: RevenueChartProps) {
  const chartData = {
    labels: data.map(item => item.date),
    datasets: [
      {
        label: "Revenus (FCFA)",
        data: data.map(item => item.revenue),
        borderColor: "rgb(249, 115, 22)",
        backgroundColor: "rgba(249, 115, 22, 0.1)",
        tension: 0.4,
        fill: true,
      },
      {
        label: "Commandes",
        data: data.map(item => item.orders),
        borderColor: "rgb(59, 130, 246)",
        backgroundColor: "rgba(59, 130, 246, 0.1)",
        tension: 0.4,
        fill: false,
        yAxisID: "y1",
      },
    ],
  };

  const options = {
    responsive: true,
    interaction: {
      mode: "index" as const,
      intersect: false,
    },
    scales: {
      x: {
        display: true,
        title: {
          display: true,
          text: "Période",
        },
      },
      y: {
        type: "linear" as const,
        display: true,
        position: "left" as const,
        title: {
          display: true,
          text: "Revenus (FCFA)",
        },
      },
      y1: {
        type: "linear" as const,
        display: true,
        position: "right" as const,
        title: {
          display: true,
          text: "Nombre de commandes",
        },
        grid: {
          drawOnChartArea: false,
        },
      },
    },
    plugins: {
      legend: {
        position: "top" as const,
      },
      title: {
        display: true,
        text: `Évolution des revenus - ${period}`,
      },
    },
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Graphique des revenus</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-[400px]">
          <Line data={chartData} options={options} />
        </div>
      </CardContent>
    </Card>
  );
} 