const ECOS_API_KEY = process.env.ECOS_API_KEY || "MDRX7H8VT4X2CZFNI3NR";
const ECOS_BASE = "https://ecos.bok.or.kr/api";

export const ECOS_SERIES: Record<string, string> = {
  "722Y001": "Bank of Korea Base Rate",
  "901Y009": "GDP Growth Rate",
  "901Y014": "GDP by Expenditure",
  "021Y125": "Consumer Price Index",
  "028Y015": "Producer Price Index",
  "902Y004": "Balance of Payments",
  "731Y003": "USD/KRW Exchange Rate",
  "121Y006": "Household Credit",
  "104Y016": "Bank Deposits",
  "901Y027": "GNI Per Capita",
};

interface EcosRow {
  STAT_NAME: string;
  ITEM_NAME1: string;
  TIME: string;
  DATA_VALUE: string;
}

export async function getEcosSeries(
  statCode: string,
  period: string,
  startDate: string,
  endDate: string
): Promise<{ stat: string; item: string; time: string; value: string }[]> {
  const url = `${ECOS_BASE}/StatisticSearch/${ECOS_API_KEY}/json/en/1/100/${statCode}/${period}/${startDate}/${endDate}`;

  try {
    const res = await fetch(url);
    if (!res.ok) throw new Error(`ECOS API error: ${res.status}`);

    const data = await res.json();
    const rows: EcosRow[] = data?.StatisticSearch?.row;
    if (!rows || !Array.isArray(rows)) return [];

    return rows.map((r) => ({
      stat: r.STAT_NAME,
      item: r.ITEM_NAME1,
      time: r.TIME,
      value: r.DATA_VALUE,
    }));
  } catch (error) {
    if (error instanceof Error && error.message.includes("403")) {
      throw new Error("ECOS data source may not be available from overseas servers");
    }
    throw error;
  }
}

export async function searchEcos(
  query: string
): Promise<{ code: string; name: string }[]> {
  const url = `${ECOS_BASE}/StatisticTableList/${ECOS_API_KEY}/json/en/1/10/${encodeURIComponent(query)}`;

  try {
    const res = await fetch(url);
    if (!res.ok) throw new Error(`ECOS search error: ${res.status}`);

    const data = await res.json();
    const rows = data?.StatisticTableList?.row;
    if (!rows || !Array.isArray(rows)) return [];

    return rows.map((r: { STAT_CODE: string; STAT_NAME: string }) => ({
      code: r.STAT_CODE,
      name: r.STAT_NAME,
    }));
  } catch (error) {
    if (error instanceof Error && error.message.includes("403")) {
      throw new Error("ECOS search may not be available from overseas servers");
    }
    throw error;
  }
}
