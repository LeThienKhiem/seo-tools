import { NextRequest, NextResponse } from "next/server";
import { createAudit, listAudits } from "@/lib/db";
import { runAudit } from "@/lib/audit/orchestrator";
import { randomUUID } from "node:crypto";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const url: string = (body?.url || "").trim();
    if (!url || !/^https?:\/\//.test(url)) {
      return NextResponse.json({ error: "Invalid URL" }, { status: 400 });
    }
    const id = randomUUID();
    createAudit(id, url);

    // fire-and-forget: run audit in background, do not await
    void runAudit(id, url);

    return NextResponse.json({ id, url, status: "pending" });
  } catch (e) {
    return NextResponse.json(
      { error: (e as Error).message },
      { status: 500 }
    );
  }
}

export async function GET() {
  const audits = listAudits(50).map((a) => ({
    id: a.id,
    url: a.url,
    status: a.status,
    created_at: a.created_at,
    updated_at: a.updated_at,
    has_error: !!a.error,
  }));
  return NextResponse.json({ audits });
}
