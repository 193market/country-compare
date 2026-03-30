const ESTAT_API_KEY = process.env.ESTAT_API_KEY || "e74c64d6ee9d867eea9174277d90e406ce667afc";
const ESTAT_BASE = "https://api.e-stat.go.jp/rest/3.0/app/json";

export const ESTAT_TABLES: Record<string, string> = {
  "0003143513": "Consumer Price Index",
  "0003143514": "Industrial Production Index",
  "0003006803": "Labor Force Survey",
  "0003109741": "Population Estimates",
  "0003003539": "Trade Statistics",
};

interface EstatValue {
  $: string;
  "@time": string;
  "@cat01"?: string;
}

export async function getEstatData(
  statsDataId: string,
  startYear?: number,
  endYear?: number
): Promise<{ time: string; value: string; category?: string }[]> {
  const params = new URLSearchParams({
    appId: ESTAT_API_KEY,
    statsDataId,
    lang: "E",
  });
  if (startYear) params.set("startPosition", `${startYear}`);

  const url = `${ESTAT_BASE}/getStatsData?${params.toString()}`;

  try {
    const res = await fetch(url);
    if (!res.ok) throw new Error(`e-Stat API error: ${res.status}`);

    const data = await res.json();
    const body = data?.GET_STATS_DATA?.STATISTICAL_DATA?.DATA_INF?.VALUE;
    if (!body || !Array.isArray(body)) return [];

    let results = body.map((v: EstatValue) => ({
      time: v["@time"] || "",
      value: v["$"] || "",
      category: v["@cat01"] || undefined,
    }));

    if (endYear) {
      results = results.filter((r: { time: string }) => {
        const year = parseInt(r.time);
        return !isNaN(year) && year <= endYear;
      });
    }

    return results.slice(0, 100);
  } catch (error) {
    if (error instanceof Error && error.message.includes("403")) {
      throw new Error("e-Stat data source may not be available from overseas servers");
    }
    throw error;
  }
}

export async function searchEstat(
  query: string
): Promise<{ id: string; title: string }[]> {
  const params = new URLSearchParams({
    appId: ESTAT_API_KEY,
    searchWord: query,
    lang: "E",
    limit: "10",
  });

  const url = `${ESTAT_BASE}/getStatsList?${params.toString()}`;

  try {
    const res = await fetch(url);
    if (!res.ok) throw new Error(`e-Stat search error: ${res.status}`);

    const data = await res.json();
    const tables = data?.GET_STATS_LIST?.DATALIST_INF?.TABLE_INF;
    if (!tables || !Array.isArray(tables)) return [];

    return tables.map((t: { "@id": string; STATISTICS_NAME: string; TITLE: string }) => ({
      id: t["@id"],
      title: `${t.STATISTICS_NAME} — ${t.TITLE}`,
    }));
  } catch (error) {
    if (error instanceof Error && error.message.includes("403")) {
      throw new Error("e-Stat search may not be available from overseas servers");
    }
    throw error;
  }
}
