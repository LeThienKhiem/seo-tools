import { NextRequest, NextResponse } from "next/server";
import { generateVsPage } from "@/lib/audit/skills";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 120;

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    if (!body.product || !body.competitor)
      return NextResponse.json({ error: "product and competitor required" }, { status: 400 });
    const page = await generateVsPage(body);
    return NextResponse.json({ page });
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 500 });
  }
}
