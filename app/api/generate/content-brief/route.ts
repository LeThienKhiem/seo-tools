import { NextRequest, NextResponse } from "next/server";
import { generateContentBrief } from "@/lib/audit/skills";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 120;

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    if (!body.topic || !body.targetKeyword)
      return NextResponse.json({ error: "topic and targetKeyword required" }, { status: 400 });
    const brief = await generateContentBrief(body);
    return NextResponse.json({ brief });
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 500 });
  }
}
