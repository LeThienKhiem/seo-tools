import { NextRequest, NextResponse } from "next/server";
import { planProgrammatic } from "@/lib/audit/skills";
import { fetchSitemap } from "@/lib/tools/fetch";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 120;

export async function POST(req: NextRequest) {
  try {
    const { siteUrl, businessContext, manualUrls } = await req.json();
    let urls: string[] = manualUrls || [];
    if (siteUrl && urls.length === 0) {
      const sm = await fetchSitemap(siteUrl);
      urls = sm.sampleUrls;
    }
    if (urls.length === 0)
      return NextResponse.json({ error: "Provide siteUrl or manualUrls" }, { status: 400 });
    const plan = await planProgrammatic({ existingUrls: urls, businessContext: businessContext || "" });
    return NextResponse.json({ plan, sourceUrls: urls.length });
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 500 });
  }
}
