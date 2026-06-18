import { NextRequest, NextResponse } from "next/server";
import { fetchUrl, parseHtml } from "@/lib/tools/fetch";
import { getBaseline } from "@/lib/db";
import { compareDrift } from "@/lib/audit/skills";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 120;

export async function POST(req: NextRequest) {
  try {
    const { baselineId } = await req.json();
    if (!baselineId) return NextResponse.json({ error: "baselineId required" }, { status: 400 });
    const baseline = getBaseline(baselineId);
    if (!baseline) return NextResponse.json({ error: "baseline not found" }, { status: 404 });

    const res = await fetchUrl(baseline.url);
    const parsed = parseHtml(res.html, res.finalUrl);
    const after = {
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
      word_count: parsed.wordCount,
      internal_links: parsed.internalLinks,
      external_links: parsed.externalLinks,
      image_count: parsed.imgTotal,
    };
    const diff = await compareDrift({ before: baseline.snapshot, after });
    return NextResponse.json({ baseline: baseline.snapshot, after, diff });
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 500 });
  }
}
