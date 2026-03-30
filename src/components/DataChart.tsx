"use client";

import { useRef, useEffect } from "react";
import {
  Chart,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler,
} from "chart.js";

Chart.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

const COLORS = [
  { bg: "rgba(59, 130, 246, 0.5)", border: "rgb(59, 130, 246)" },   // blue
  { bg: "rgba(239, 68, 68, 0.5)", border: "rgb(239, 68, 68)" },     // red
  { bg: "rgba(34, 197, 94, 0.5)", border: "rgb(34, 197, 94)" },     // green
  { bg: "rgba(245, 158, 11, 0.5)", border: "rgb(245, 158, 11)" },   // amber
  { bg: "rgba(168, 85, 247, 0.5)", border: "rgb(168, 85, 247)" },   // purple
  { bg: "rgba(236, 72, 153, 0.5)", border: "rgb(236, 72, 153)" },   // pink
  { bg: "rgba(20, 184, 166, 0.5)", border: "rgb(20, 184, 166)" },   // teal
  { bg: "rgba(249, 115, 22, 0.5)", border: "rgb(249, 115, 22)" },   // orange
];

export interface ChartData {
  type: "line" | "bar" | "doughnut";
  title: string;
  labels: string[];
  datasets: { label: string; data: number[] }[];
}

export default function DataChart({ type, title, labels, datasets }: ChartData) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const chartRef = useRef<Chart | null>(null);

  useEffect(() => {
    if (!canvasRef.current) return;

    if (chartRef.current) {
      chartRef.current.destroy();
    }

    const isDoughnut = type === "doughnut";

    chartRef.current = new Chart(canvasRef.current, {
      type,
      data: {
        labels,
        datasets: datasets.map((ds, i) => ({
          label: ds.label,
          data: ds.data,
          backgroundColor: isDoughnut
            ? ds.data.map((_, j) => COLORS[j % COLORS.length].bg)
            : COLORS[i % COLORS.length].bg,
          borderColor: isDoughnut
            ? ds.data.map((_, j) => COLORS[j % COLORS.length].border)
            : COLORS[i % COLORS.length].border,
          borderWidth: isDoughnut ? 2 : 2,
          tension: type === "line" ? 0.3 : undefined,
          pointRadius: type === "line" ? 3 : undefined,
          fill: type === "line" ? false : undefined,
        })),
      },
      options: {
        responsive: true,
        maintainAspectRatio: true,
        plugins: {
          title: {
            display: !!title,
            text: title,
            color: "#e5e7eb",
            font: { size: 14, weight: "bold" },
          },
          legend: {
            labels: { color: "#9ca3af" },
          },
          tooltip: {
            backgroundColor: "rgba(17, 24, 39, 0.9)",
            titleColor: "#f3f4f6",
            bodyColor: "#d1d5db",
          },
        },
        scales: isDoughnut
          ? {}
          : {
              x: {
                ticks: { color: "#9ca3af" },
                grid: { color: "rgba(75, 85, 99, 0.3)" },
              },
              y: {
                ticks: { color: "#9ca3af" },
                grid: { color: "rgba(75, 85, 99, 0.3)" },
              },
            },
      },
    });

    return () => {
      if (chartRef.current) {
        chartRef.current.destroy();
        chartRef.current = null;
      }
    };
  }, [type, title, labels, datasets]);

  return (
    <div className="my-4 p-4 bg-gray-900 rounded-xl">
      <canvas ref={canvasRef} />
    </div>
  );
}
