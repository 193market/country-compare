import type { ChartData } from "@/components/DataChart";

const CHART_BLOCK_REGEX = /```chart\s*\n?([\s\S]*?)\n?```/g;

const VALID_TYPES = new Set(["line", "bar", "doughnut"]);

export function parseCharts(text: string): {
  text: string;
  charts: ChartData[];
} {
  const charts: ChartData[] = [];
  const cleanedText = text.replace(CHART_BLOCK_REGEX, (_, jsonStr) => {
    try {
      const parsed = JSON.parse(jsonStr.trim());

      if (
        !VALID_TYPES.has(parsed.type) ||
        !Array.isArray(parsed.labels) ||
        !Array.isArray(parsed.datasets)
      ) {
        return "";
      }

      charts.push({
        type: parsed.type,
        title: parsed.title || "",
        labels: parsed.labels,
        datasets: parsed.datasets,
      });
    } catch {
      // invalid JSON — silently skip
    }
    return "";
  });

  return { text: cleanedText.trim(), charts };
}
