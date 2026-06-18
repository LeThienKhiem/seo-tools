import { NextRequest, NextResponse } from "next/server";
import { fetchUrl, parseHtml } from "@/lib/tools/fetch";
import { validateHreflang } from "@/lib/audit/skills";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

export async function POST(req: NextRequest) {
  try {
    const { url } = await req.json();
    if (!url) return NextResponse.json({ error: "url required" }, { status: 400 });
    const res = await fetchUrl(url);
    const parsed = parseHtml(res.html, res.finalUrl);
    const result = await validateHreflang({
      url: res.finalUrl,
      tags: parsed.hreflang,
      detectedLang: parsed.lang || "unknown",
    });
    return NextResponse.json({ ...result, _crawled: { lang: parsed.lang, tags: parsed.hreflang } });
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 500 });
  }
}
