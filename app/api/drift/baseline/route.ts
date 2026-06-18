import { NextRequest, NextResponse } from "next/server";
import { fetchUrl, parseHtml } from "@/lib/tools/fetch";
import { saveBaseline, listBaselines } from "@/lib/db";
import { randomUUID } from "node:crypto";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const { url, label } = await req.json();
    if (!url) return NextResponse.json({ error: "url required" }, { status: 400 });
    const res = await fetchUrl(url);
    const parsed = parseHtml(res.html, res.finalUrl);
    const snapshot = {
      url: res.finalUrl,
      capturedAt: new Date().toISOString(),
      title: parsed.title,
      meta_description: parsed.metaDescription,
      canonical: parsed.canonical,
      robots_meta: parsed.robots,
      lang: parsed.lang,
      h1: parsed.h1,
      h2: parsed.h2,
      og_tags: parsed.ogTags,
      twitter_tags: parsed.twitterTags,
      hreflang: parsed.hreflang,
      jsonld_types: parsed.jsonLd.map((j: any) => j?.["@type"]).filter(Boolean),
      jsonld: parsed.jsonLd,
      word_count: parsed.wordCount,
      internal_links: parsed.internalLinks,
      external_links: parsed.externalLinks,
      image_count: parsed.imgTotal,
    };
    const id = randomUUID();
    saveBaseline(id, res.finalUrl, label || "auto", snapshot);
    return NextResponse.json({ id, snapshot });
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  const u = req.nextUrl.searchParams.get("url") || undefined;
  return NextResponse.json({ baselines: listBaselines(u) });
}
