/** Parse Google Search Console CSV exports (Queries.csv, Pages.csv). */

export interface GscQuery {
  query: string;
  clicks: number;
  impressions: number;
  ctr: number;
  position: number;
}

export interface GscPage {
  page: string;
  clicks: number;
  impressions: number;
  ctr: number;
  position: number;
}

export interface GscSummary {
  type: "queries" | "pages" | "unknown";
  rows: GscQuery[] | GscPage[];
  totals: {
    clicks: number;
    impressions: number;
    avgCtr: number;
    avgPosition: number;
    count: number;
  };
  topOpportunities: Array<{
    query?: string;
    page?: string;
    position: number;
    impressions: number;
    clicks: number;
    ctr: number;
    reason: string;
  }>;
}

function parseCsvLine(line: string): string[] {
  // Simple CSV parse: handle quoted fields with commas inside
  const out: string[] = [];
  let cur = "";
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const c = line[i];
    if (c === '"') {
      if (inQuotes && line[i + 1] === '"') {
        cur += '"';
        i++;
      } else inQuotes = !inQuotes;
    } else if (c === "," && !inQuotes) {
      out.push(cur);
      cur = "";
    } else cur += c;
  }
  out.push(cur);
  return out;
}

function parsePct(s: string): number {
  // "12.34%" → 0.1234
  const n = parseFloat(s.replace("%", "").trim());
  return isNaN(n) ? 0 : n / 100;
}
function num(s: string): number {
  const n = parseFloat(s.replace(/[, ]/g, ""));
  return isNaN(n) ? 0 : n;
}

export function parseGscCsv(csvText: string): GscSummary {
  const lines = csvText.trim().split(/\r?\n/);
  if (lines.length < 2) {
    return {
      type: "unknown",
      rows: [],
      totals: { clicks: 0, impressions: 0, avgCtr: 0, avgPosition: 0, count: 0 },
      topOpportunities: [],
    };
  }
  const headers = parseCsvLine(lines[0]).map((h) =>
    h.trim().toLowerCase().replace(/\s/g, "_")
  );

  // detect type
  let type: "queries" | "pages" | "unknown" = "unknown";
  if (headers.includes("top_queries") || headers.includes("query")) type = "queries";
  else if (headers.includes("top_pages") || headers.includes("page")) type = "pages";

  const rows: any[] = [];
  let totalClicks = 0;
  let totalImpressions = 0;
  let posSum = 0;

  for (let i = 1; i < lines.length; i++) {
    if (!lines[i].trim()) continue;
    const cells = parseCsvLine(lines[i]);
    const get = (key: string) => {
      const idx = headers.findIndex((h) => h.includes(key));
      return idx >= 0 ? cells[idx] : "";
    };
    const clicks = num(get("click"));
    const impressions = num(get("impression"));
    const ctr = get("ctr").includes("%") ? parsePct(get("ctr")) : num(get("ctr"));
    const position = num(get("position"));

    const row: any = { clicks, impressions, ctr, position };
    if (type === "queries") {
      row.query = get("query") || cells[0];
    } else if (type === "pages") {
      row.page = get("page") || cells[0];
    }
    rows.push(row);
    totalClicks += clicks;
    totalImpressions += impressions;
    posSum += position;
  }

  const avgCtr = totalImpressions ? totalClicks / totalImpressions : 0;
  const avgPosition = rows.length ? posSum / rows.length : 0;

  // Top opportunities: positions 11-30 (just outside top 10) with high impressions
  const opportunities = rows
    .filter((r) => r.position >= 6 && r.position <= 30 && r.impressions >= 50)
    .sort((a, b) => b.impressions * (1 / a.position) - a.impressions * (1 / b.position))
    .slice(0, 10)
    .map((r) => ({
      query: r.query,
      page: r.page,
      position: r.position,
      impressions: r.impressions,
      clicks: r.clicks,
      ctr: r.ctr,
      reason:
        r.position <= 10
          ? "Top 10 — boost CTR with title/meta rewrite"
          : r.position <= 20
          ? "Page 2 — content depth + internal links could push to page 1"
          : "Long tail — opportunity if intent matches",
    }));

  return {
    type,
    rows,
    totals: {
      clicks: totalClicks,
      impressions: totalImpressions,
      avgCtr,
      avgPosition,
      count: rows.length,
    },
    topOpportunities: opportunities,
  };
}
