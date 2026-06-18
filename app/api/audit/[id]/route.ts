import { NextRequest, NextResponse } from "next/server";
import { getAudit } from "@/lib/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const row = getAudit(id);
  if (!row) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json({
    id: row.id,
    url: row.url,
    status: row.status,
    created_at: row.created_at,
    updated_at: row.updated_at,
    logs: row.logs ? JSON.parse(row.logs) : [],
    report: row.report ? JSON.parse(row.report) : null,
    error: row.error,
  });
}
