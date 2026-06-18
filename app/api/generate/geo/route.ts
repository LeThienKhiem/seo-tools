import { NextRequest, NextResponse } from "next/server";
import { fetchUrl, parseHtml } from "@/lib/tools/fetch";
import { checkGeo } from "@/lib/audit/skills";
import * as cheerio from "cheerio";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 120;

export async function POST(req: NextRequest) {
  try {
    const { url } = await req.json();
    if (!url) return NextResponse.json({ error: "url required" }, { status: 400 });
    const res = await fetchUrl(url);
    const parsed = parseHtml(res.html, res.finalUrl);
    const $ = cheerio.load(res.html);
    $("script, style, nav, footer").remove();
    const text = $("body").text().replace(/\s+/g, " ").trim();
    const result = await checkGeo({
      url: res.finalUrl,
      pageContent: text,
      schemaTypes: parsed.jsonLd.map((j: any) => j?.["@type"]).filter(Boolean),
    });
    return NextResponse.json(result);
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 500 });
  }
}
