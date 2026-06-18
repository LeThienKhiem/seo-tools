import { NextRequest, NextResponse } from "next/server";
import { planCluster } from "@/lib/audit/skills";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 120;

export async function POST(req: NextRequest) {
  try {
    const { seedKeyword, businessContext } = await req.json();
    if (!seedKeyword) return NextResponse.json({ error: "seedKeyword required" }, { status: 400 });
    const cluster = await planCluster({ seedKeyword, businessContext: businessContext || "" });
    return NextResponse.json({ cluster });
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 500 });
  }
}
