import Anthropic from "@anthropic-ai/sdk";
import { NextRequest } from "next/server";
import { getFredSeries, searchFredSeries } from "@/lib/fred";
import { getIndicator, compareCountries } from "@/lib/worldbank";
import { getEcosSeries, searchEcos } from "@/lib/ecos";
import { getEstatData, searchEstat } from "@/lib/estat";
import { verifyToken, TOKEN_COOKIE } from "@/lib/auth";

export const maxDuration = 60;

const BASE_SYSTEM_PROMPT = `You are CountryCompare AI, a comprehensive economic analyst. You MUST always produce a full, data-rich report — never a brief summary.

## MANDATORY DATA COLLECTION RULE
For ANY question about countries or economies, you MUST call compare_countries with ALL of these indicators at once:
["NY.GDP.MKTP.CD", "NY.GDP.MKTP.KD.ZG", "NY.GDP.PCAP.CD", "FP.CPI.TOTL.ZG", "SL.UEM.TOTL.ZS", "SP.POP.TOTL", "SP.DYN.LE00.IN", "NE.EXP.GNFS.ZS", "NE.IMP.GNFS.ZS", "GC.DOD.TOTL.GD.ZS", "SL.TLF.CACT.ZS", "SP.DYN.TFRT.IN"]

This is a SINGLE tool call. Do it FIRST before writing anything.

## MANDATORY REPORT STRUCTURE
After fetching data, write a comprehensive report with EXACTLY these 10+ sections. Each section MUST include:
1. A text analysis paragraph (3-5 sentences with specific numbers)
2. A chart block showing the time-series data

Sections to include:
1. Executive Summary (overview, no chart)
2. GDP Total (line chart — both countries)
3. GDP Growth Rate (line chart)
4. GDP per Capita (line chart)
5. Inflation Rate (line chart)
6. Unemployment Rate (line chart)
7. Population (line chart)
8. Life Expectancy (line chart)
9. Exports % of GDP (line chart)
10. Imports % of GDP (line chart)
11. Government Debt % of GDP (line chart)
12. Labor Force Participation (line chart)
13. Comparative Snapshot (bar chart — latest values all indicators)
14. Key Takeaways & Outlook

## CHART FORMAT — use EXACTLY this format for every chart:
\`\`\`chart
{
  "type": "line",
  "title": "GDP Growth Rate (%)",
  "labels": ["2015","2016","2017","2018","2019","2020","2021","2022","2023"],
  "datasets": [
    { "label": "South Korea", "data": [2.8, 2.9, 3.2, 2.9, 2.2, -0.7, 4.6, 2.7, 1.6] },
    { "label": "Japan", "data": [1.3, 0.8, 1.7, 0.6, -0.4, -4.2, 2.7, 0.9, 1.5] }
  ]
}
\`\`\`

Rules:
- "line" for time series, "bar" for category comparisons
- Use years as labels (2015–2023)
- Round to 2 decimal places
- ALWAYS place chart immediately after the section's text analysis
- NEVER skip a chart — every section must have one

## TONE
- Be specific: "$485 billion", not "large"
- Use bold for key numbers
- Be analytical, not just descriptive`;

const PRO_DATA_SOURCES = `

You also have access to:
- ECOS (Bank of Korea): South Korea economic data including base rate, GDP, CPI, exchange rates, household credit
- e-Stat (Japan): Japan statistics including CPI, industrial production, labor force, population, trade

When users ask about Korea or Japan economics, use the appropriate tools (get_korea_data, get_japan_data).
For Korea data, common stat codes: 722Y001 (base rate), 901Y009 (GDP growth), 021Y125 (CPI), 731Y003 (USD/KRW).
For Japan data, common table IDs: 0003143513 (CPI), 0003143514 (industrial production), 0003006803 (labor).`;

const FREE_DATA_NOTICE = `

You have access to World Bank data only. For FRED, Korea, and Japan data, users need Pro access.`;

const tools: Anthropic.Tool[] = [
  {
    name: "get_fred_data",
    description:
      "Get US economic data from FRED. Use for US-specific indicators like federal funds rate, CPI, unemployment, GDP, S&P 500, gold price, mortgage rates.",
    input_schema: {
      type: "object" as const,
      properties: {
        series_id: { type: "string", description: "FRED series ID. Common: FEDFUNDS, CPIAUCSL, UNRATE, GDP, SP500, GOLDAMGBD228NLBM, MORTGAGE30US, T10Y2Y" },
        start_date: { type: "string", description: "Start date YYYY-MM-DD" },
        end_date: { type: "string", description: "End date YYYY-MM-DD" },
      },
      required: ["series_id"],
    },
  },
  {
    name: "get_worldbank_data",
    description:
      "Get country-level economic data from the World Bank for 200+ countries.",
    input_schema: {
      type: "object" as const,
      properties: {
        country_codes: { type: "array", items: { type: "string" }, description: "ISO country codes e.g. ['US', 'CN', 'KR']" },
        indicator_id: { type: "string", description: "World Bank indicator ID. Common: NY.GDP.MKTP.CD, NY.GDP.MKTP.KD.ZG, NY.GDP.PCAP.CD, FP.CPI.TOTL.ZG, SL.UEM.TOTL.ZS, SP.POP.TOTL" },
        start_year: { type: "number" },
        end_year: { type: "number" },
      },
      required: ["country_codes", "indicator_id"],
    },
  },
  {
    name: "compare_countries",
    description: "Compare multiple countries across several economic indicators at once.",
    input_schema: {
      type: "object" as const,
      properties: {
        country_codes: { type: "array", items: { type: "string" } },
        indicators: { type: "array", items: { type: "string" }, description: "World Bank indicator IDs" },
      },
      required: ["country_codes", "indicators"],
    },
  },
  {
    name: "search_fred",
    description: "Search FRED for economic data series by keyword.",
    input_schema: {
      type: "object" as const,
      properties: { query: { type: "string" } },
      required: ["query"],
    },
  },
  {
    name: "get_korea_data",
    description: "Get South Korea economic data from Bank of Korea ECOS. Pro only.",
    input_schema: {
      type: "object" as const,
      properties: {
        stat_code: { type: "string" },
        period: { type: "string", description: "A(annual), Q(quarterly), M(monthly), D(daily)" },
        start_date: { type: "string" },
        end_date: { type: "string" },
      },
      required: ["stat_code", "period", "start_date", "end_date"],
    },
  },
  {
    name: "search_korea_data",
    description: "Search for available Korea (ECOS) economic data series.",
    input_schema: {
      type: "object" as const,
      properties: { query: { type: "string" } },
      required: ["query"],
    },
  },
  {
    name: "get_japan_data",
    description: "Get Japan economic data from e-Stat. Pro only.",
    input_schema: {
      type: "object" as const,
      properties: {
        stats_data_id: { type: "string" },
        start_year: { type: "number" },
        end_year: { type: "number" },
      },
      required: ["stats_data_id"],
    },
  },
  {
    name: "search_japan_data",
    description: "Search for available Japan (e-Stat) statistical tables.",
    input_schema: {
      type: "object" as const,
      properties: { query: { type: "string" } },
      required: ["query"],
    },
  },
];

const FREE_TOOL_NAMES = new Set(["get_worldbank_data", "compare_countries"]);

async function executeTool(name: string, input: Record<string, unknown>): Promise<string> {
  try {
    switch (name) {
      case "get_fred_data": {
        const data = await getFredSeries(input.series_id as string, input.start_date as string | undefined, input.end_date as string | undefined);
        return JSON.stringify({ series_id: input.series_id, recent_data: data.slice(-20) });
      }
      case "get_worldbank_data": {
        const results = await compareCountries(input.country_codes as string[], input.indicator_id as string, input.start_year as number | undefined, input.end_year as number | undefined);
        return JSON.stringify(results);
      }
      case "compare_countries": {
        const indicators = input.indicators as string[];
        const entries = await Promise.all(
          indicators.map(async (ind) => [ind, await compareCountries(input.country_codes as string[], ind)])
        );
        return JSON.stringify(Object.fromEntries(entries));
      }
      case "search_fred":
        return JSON.stringify(await searchFredSeries(input.query as string));
      case "get_korea_data":
        return JSON.stringify(await getEcosSeries(input.stat_code as string, input.period as string, input.start_date as string, input.end_date as string));
      case "search_korea_data":
        return JSON.stringify(await searchEcos(input.query as string));
      case "get_japan_data":
        return JSON.stringify(await getEstatData(input.stats_data_id as string, input.start_year as number | undefined, input.end_year as number | undefined));
      case "search_japan_data":
        return JSON.stringify(await searchEstat(input.query as string));
      default:
        return JSON.stringify({ error: `Unknown tool: ${name}` });
    }
  } catch (error) {
    return JSON.stringify({ error: error instanceof Error ? error.message : "Tool execution failed" });
  }
}

export async function POST(req: NextRequest) {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return new Response(JSON.stringify({ error: "ANTHROPIC_API_KEY not configured" }), { status: 500 });
  }

  const { messages } = await req.json();

  // country-compare JWT cookie로 Pro 판단
  const token = req.cookies.get(TOKEN_COOKIE)?.value;
  const isPro = token ? !!verifyToken(token) : false;

  const client = new Anthropic({ apiKey });
  const systemPrompt = isPro ? BASE_SYSTEM_PROMPT + PRO_DATA_SOURCES : BASE_SYSTEM_PROMPT + FREE_DATA_NOTICE;
  const availableTools = isPro ? tools : tools.filter((t) => FREE_TOOL_NAMES.has(t.name));

  const claudeMessages: Anthropic.MessageParam[] = messages.map(
    (m: { role: string; content: string }) => ({ role: m.role as "user" | "assistant", content: m.content })
  );

  const collectedData: Record<string, unknown> = {};
  const extractedCountries: string[] = [];

  try {
    let response = await client.messages.create({
      model: "claude-sonnet-4-5",
      max_tokens: 8192,
      system: systemPrompt,
      tools: availableTools,
      messages: claudeMessages,
    });

    while (response.stop_reason === "tool_use") {
      const toolUseBlocks = response.content.filter(
        (block): block is Anthropic.ContentBlock & { type: "tool_use" } => block.type === "tool_use"
      );

      const toolResults: Anthropic.ToolResultBlockParam[] = [];
      for (const toolUse of toolUseBlocks) {
        const result = await executeTool(toolUse.name, toolUse.input as Record<string, unknown>);
        toolResults.push({ type: "tool_result", tool_use_id: toolUse.id, content: result });

        try {
          const parsed = JSON.parse(result);
          const toolInput = toolUse.input as Record<string, unknown>;
          const key = (toolInput.indicator_id as string) || (toolInput.series_id as string) || toolUse.name;
          collectedData[key] = parsed;
          if (Array.isArray(toolInput.country_codes)) {
            for (const cc of toolInput.country_codes as string[]) {
              if (!extractedCountries.includes(cc)) extractedCountries.push(cc);
            }
          }
        } catch { /* ignore */ }
      }

      claudeMessages.push({ role: "assistant", content: response.content });
      claudeMessages.push({ role: "user", content: toolResults });

      response = await client.messages.create({
        model: "claude-sonnet-4-5",
        max_tokens: 8192,
        system: systemPrompt,
        tools: availableTools,
        messages: claudeMessages,
      });
    }

    const fullText = response.content
      .filter((block): block is Anthropic.TextBlock => block.type === "text")
      .map((block) => block.text)
      .join("");

    const chatText = fullText.replace(/<report_analysis>[\s\S]*?<\/report_analysis>/, "").trim();

    return new Response(chatText, { headers: { "Content-Type": "text/plain; charset=utf-8" } });
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Unknown error";
    return new Response(JSON.stringify({ error: msg }), { status: 500 });
  }
}
