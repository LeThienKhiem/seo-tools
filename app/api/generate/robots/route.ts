import { NextRequest, NextResponse } from "next/server";
import { generateRobotsTxt } from "@/lib/tools/robots-sitemap";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  try {
    const cfg = await req.json();
    const txt = generateRobotsTxt(cfg);
    return NextResponse.json({ robots: txt });
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 500 });
  }
}
