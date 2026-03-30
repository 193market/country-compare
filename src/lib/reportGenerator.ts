import { exec } from "child_process";
import { promisify } from "util";
import path from "path";
import fs from "fs";

const execAsync = promisify(exec);

interface ReportData {
  question: string;
  language: string;
  countries: string[];
  indicators: Record<string, unknown>;
  analysis: string;
}

export async function generatePDFReport(data: ReportData): Promise<string> {
  const tmpDir = path.join(process.cwd(), "tmp");
  if (!fs.existsSync(tmpDir)) fs.mkdirSync(tmpDir, { recursive: true });

  const ts = Date.now();
  const dataFile = path.join(tmpDir, `report_${ts}.json`);
  const outputFile = path.join(
    process.cwd(),
    "public",
    "reports",
    `report_${ts}.pdf`
  );

  const reportsDir = path.join(process.cwd(), "public", "reports");
  if (!fs.existsSync(reportsDir)) fs.mkdirSync(reportsDir, { recursive: true });

  fs.writeFileSync(dataFile, JSON.stringify(data, null, 2));

  const scriptPath = path.join(process.cwd(), "scripts", "generate_report.py");

  try {
    await execAsync(
      `python3 "${scriptPath}" "${dataFile}" "${outputFile}"`,
      { timeout: 60000 }
    );
  } catch {
    // Try "python" if "python3" not found
    await execAsync(
      `python "${scriptPath}" "${dataFile}" "${outputFile}"`,
      { timeout: 60000 }
    );
  }

  // Cleanup temp file
  try {
    fs.unlinkSync(dataFile);
  } catch {
    // ignore
  }

  return `/reports/${path.basename(outputFile)}`;
}
