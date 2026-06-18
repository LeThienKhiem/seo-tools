/** Deterministic generators — no LLM needed. */

export interface RobotsConfig {
  userAgents?: Array<{
    name: string;
    allow?: string[];
    disallow?: string[];
    crawlDelay?: number;
  }>;
  sitemaps?: string[];
  host?: string;
  blockAiCrawlers?: boolean;
  allowAiCrawlers?: boolean;
}

const AI_BOTS = [
  "GPTBot",
  "ChatGPT-User",
  "OAI-SearchBot",
  "PerplexityBot",
  "Perplexity-User",
  "ClaudeBot",
  "anthropic-ai",
  "Claude-Web",
  "Google-Extended",
  "CCBot",
  "Amazonbot",
  "Bytespider",
  "FacebookBot",
];

export function generateRobotsTxt(cfg: RobotsConfig): string {
  const lines: string[] = [];

  const defaultUa = cfg.userAgents?.find((u) => u.name === "*") || {
    name: "*",
    allow: ["/"],
    disallow: ["/api/"],
  };

  lines.push(`User-Agent: ${defaultUa.name}`);
  for (const a of defaultUa.allow || []) lines.push(`Allow: ${a}`);
  for (const d of defaultUa.disallow || []) lines.push(`Disallow: ${d}`);
  if (defaultUa.crawlDelay) lines.push(`Crawl-Delay: ${defaultUa.crawlDelay}`);

  for (const ua of cfg.userAgents || []) {
    if (ua.name === "*") continue;
    lines.push("");
    lines.push(`User-Agent: ${ua.name}`);
    for (const a of ua.allow || []) lines.push(`Allow: ${a}`);
    for (const d of ua.disallow || []) lines.push(`Disallow: ${d}`);
    if (ua.crawlDelay) lines.push(`Crawl-Delay: ${ua.crawlDelay}`);
  }

  if (cfg.blockAiCrawlers) {
    lines.push("");
    lines.push("# Block AI training crawlers");
    for (const bot of AI_BOTS) {
      lines.push(`User-Agent: ${bot}`);
      lines.push("Disallow: /");
      lines.push("");
    }
  } else if (cfg.allowAiCrawlers) {
    lines.push("");
    lines.push("# Allow AI crawlers (default)");
    for (const bot of AI_BOTS) {
      lines.push(`User-Agent: ${bot}`);
      lines.push("Allow: /");
      lines.push("");
    }
  }

  if (cfg.host) {
    lines.push("");
    lines.push(`Host: ${cfg.host}`);
  }
  for (const s of cfg.sitemaps || []) {
    lines.push("");
    lines.push(`Sitemap: ${s}`);
  }

  return lines.join("\n").trim() + "\n";
}

export interface SitemapUrl {
  loc: string;
  lastmod?: string;
  changefreq?: "always" | "hourly" | "daily" | "weekly" | "monthly" | "yearly" | "never";
  priority?: number;
}

export function generateSitemapXml(urls: SitemapUrl[]): string {
  const lines = [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
  ];
  for (const u of urls) {
    lines.push("  <url>");
    lines.push(`    <loc>${escapeXml(u.loc)}</loc>`);
    if (u.lastmod) lines.push(`    <lastmod>${u.lastmod}</lastmod>`);
    if (u.changefreq) lines.push(`    <changefreq>${u.changefreq}</changefreq>`);
    if (u.priority != null) lines.push(`    <priority>${u.priority}</priority>`);
    lines.push("  </url>");
  }
  lines.push("</urlset>");
  return lines.join("\n");
}

export function generateSitemapIndex(sitemapUrls: string[]): string {
  const lines = [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
  ];
  for (const s of sitemapUrls) {
    lines.push("  <sitemap>");
    lines.push(`    <loc>${escapeXml(s)}</loc>`);
    lines.push("  </sitemap>");
  }
  lines.push("</sitemapindex>");
  return lines.join("\n");
}

function escapeXml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

/* ── IndexNow ─────────────────────────────────────────────── */

export async function submitIndexNow(input: {
  host: string;
  key: string;
  urlList: string[];
  engine?: "bing" | "yandex" | "indexnow";
}): Promise<{ status: number; statusText: string }> {
  const endpoints = {
    bing: "https://api.indexnow.org/IndexNow",
    yandex: "https://yandex.com/indexnow",
    indexnow: "https://api.indexnow.org/indexnow",
  };
  const endpoint = endpoints[input.engine || "bing"];

  const res = await fetch(endpoint, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      host: input.host,
      key: input.key,
      keyLocation: `https://${input.host}/${input.key}.txt`,
      urlList: input.urlList,
    }),
  });
  return { status: res.status, statusText: res.statusText };
}
