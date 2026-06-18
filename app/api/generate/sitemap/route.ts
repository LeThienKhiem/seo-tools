import { NextRequest, NextResponse } from "next/server";
import { generateSitemapXml, generateSitemapIndex } from "@/lib/tools/robots-sitemap";
import { crawlSite } from "@/lib/tools/crawler";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 300;

export async function POST(req: NextRequest) {
  try {
    const { mode, urls, indexUrls, crawlUrl, limit } = await req.json();

    if (mode === "manual" && Array.isArray(urls)) {
      return NextResponse.json({ xml: generateSitemapXml(urls) });
    }
    if (mode === "index" && Array.isArray(indexUrls)) {
      return NextResponse.json({ xml: generateSitemapIndex(indexUrls) });
    }
    if (mode === "crawl" && crawlUrl) {
      const result = await crawlSite(crawlUrl, Math.min(Number(limit) || 50, 200));
      const sm = result.pages
        .filter((p) => p.parsed)
        .map((p) => ({
          loc: p.url,
          lastmod: new Date().toISOString().slice(0, 10),
          changefreq: "weekly" as const,
          priority: 0.8,
        }));
      return NextResponse.json({ xml: generateSitemapXml(sm), count: sm.length });
    }
    return NextResponse.json({ error: "invalid mode" }, { status: 400 });
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 500 });
  }
}
