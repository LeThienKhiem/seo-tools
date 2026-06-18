import { NextRequest, NextResponse } from "next/server";
import { crawlSite } from "@/lib/tools/crawler";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 300;

export async function POST(req: NextRequest) {
  try {
    const { url, limit = 20 } = await req.json();
    if (!url) return NextResponse.json({ error: "url required" }, { status: 400 });
    const result = await crawlSite(url, Math.min(Number(limit) || 20, 100));
    return NextResponse.json(result);
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 500 });
  }
}
