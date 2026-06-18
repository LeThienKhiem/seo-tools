import * as cheerio from "cheerio";

const UA = "Mozilla/5.0 (compatible; InternalSEOBot/1.0)";

export async function fetchUrl(url: string, timeoutMs = 20000): Promise<{
  status: number;
  headers: Record<string, string>;
  html: string;
  finalUrl: string;
}> {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), timeoutMs);
  try {
    const res = await fetch(url, {
      headers: { "User-Agent": UA, Accept: "text/html,*/*" },
      redirect: "follow",
      signal: ctrl.signal,
    });
    const html = await res.text();
    const headers: Record<string, string> = {};
    res.headers.forEach((v, k) => (headers[k] = v));
    return { status: res.status, headers, html, finalUrl: res.url };
  } finally {
    clearTimeout(t);
  }
}

export interface ParsedPage {
  title: string;
  titleLength: number;
  metaDescription: string;
  metaDescLength: number;
  metaKeywords: string;
  canonical: string;
  robots: string;
  lang: string;
  hreflang: Array<{ lang: string; href: string }>;
  ogTags: Record<string, string>;
  twitterTags: Record<string, string>;
  h1: string[];
  h2: string[];
  h3: string[];
  headingCount: { h1: number; h2: number; h3: number; h4: number };
  jsonLd: unknown[];
  imgTotal: number;
  imgWithAlt: number;
  imgWithoutAlt: number;
  imgLazy: number;
  internalLinks: number;
  externalLinks: number;
  wordCount: number;
  hasFaqSection: boolean;
}

export function parseHtml(html: string, baseUrl: string): ParsedPage {
  const $ = cheerio.load(html);
  const origin = new URL(baseUrl).origin;

  const title = $("title").first().text().trim();
  const metaDesc = $('meta[name="description"]').attr("content") || "";
  const metaKey = $('meta[name="keywords"]').attr("content") || "";
  const canonical = $('link[rel="canonical"]').attr("href") || "";
  const robotsMeta = $('meta[name="robots"]').attr("content") || "";
  const lang = $("html").attr("lang") || "";

  const hreflang: Array<{ lang: string; href: string }> = [];
  $('link[rel="alternate"][hreflang]').each((_, el) => {
    hreflang.push({
      lang: $(el).attr("hreflang") || "",
      href: $(el).attr("href") || "",
    });
  });

  const ogTags: Record<string, string> = {};
  $('meta[property^="og:"]').each((_, el) => {
    const p = $(el).attr("property") || "";
    ogTags[p] = $(el).attr("content") || "";
  });
  const twitterTags: Record<string, string> = {};
  $('meta[name^="twitter:"]').each((_, el) => {
    const n = $(el).attr("name") || "";
    twitterTags[n] = $(el).attr("content") || "";
  });

  const h1 = $("h1").map((_, el) => $(el).text().trim()).get();
  const h2 = $("h2").map((_, el) => $(el).text().trim()).get();
  const h3 = $("h3").map((_, el) => $(el).text().trim()).get();

  const jsonLd: unknown[] = [];
  $('script[type="application/ld+json"]').each((_, el) => {
    try {
      jsonLd.push(JSON.parse($(el).contents().text()));
    } catch {}
  });

  const imgs = $("img");
  let withAlt = 0;
  let lazy = 0;
  imgs.each((_, el) => {
    if (($(el).attr("alt") || "").trim()) withAlt++;
    if (($(el).attr("loading") || "") === "lazy") lazy++;
  });

  let internal = 0;
  let external = 0;
  $("a[href]").each((_, el) => {
    const href = $(el).attr("href") || "";
    if (href.startsWith("/") || href.startsWith(origin)) internal++;
    else if (href.startsWith("http")) external++;
  });

  const body = $("body").text().replace(/\s+/g, " ").trim();
  const wordCount = body.split(" ").filter(Boolean).length;
  const hasFaq = /frequently asked questions|FAQ/i.test(body);

  return {
    title,
    titleLength: title.length,
    metaDescription: metaDesc,
    metaDescLength: metaDesc.length,
    metaKeywords: metaKey,
    canonical,
    robots: robotsMeta,
    lang,
    hreflang,
    ogTags,
    twitterTags,
    h1,
    h2,
    h3,
    headingCount: {
      h1: $("h1").length,
      h2: $("h2").length,
      h3: $("h3").length,
      h4: $("h4").length,
    },
    jsonLd,
    imgTotal: imgs.length,
    imgWithAlt: withAlt,
    imgWithoutAlt: imgs.length - withAlt,
    imgLazy: lazy,
    internalLinks: internal,
    externalLinks: external,
    wordCount,
    hasFaqSection: hasFaq,
  };
}

export async function fetchRobots(domain: string): Promise<string> {
  try {
    const url = new URL("/robots.txt", domain).toString();
    const res = await fetch(url, { headers: { "User-Agent": UA } });
    return res.ok ? await res.text() : "";
  } catch {
    return "";
  }
}

export async function fetchSitemap(domain: string): Promise<{
  found: boolean;
  url: string;
  urlCount: number;
  sampleUrls: string[];
}> {
  const urls = ["/sitemap.xml", "/sitemap_index.xml", "/sitemap-index.xml"];
  for (const path of urls) {
    try {
      const u = new URL(path, domain).toString();
      const res = await fetch(u, { headers: { "User-Agent": UA } });
      if (!res.ok) continue;
      const xml = await res.text();
      const locs = Array.from(xml.matchAll(/<loc>([^<]+)<\/loc>/g)).map(
        (m) => m[1]
      );
      return {
        found: true,
        url: u,
        urlCount: locs.length,
        sampleUrls: locs.slice(0, 20),
      };
    } catch {}
  }
  return { found: false, url: "", urlCount: 0, sampleUrls: [] };
}
