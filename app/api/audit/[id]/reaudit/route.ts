import { NextRequest, NextResponse } from "next/server";
import { getAudit, createAudit, setParent } from "@/lib/db";
import { runAudit } from "@/lib/audit/orchestrator";
import { randomUUID } from "node:crypto";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const parent = getAudit(id);
  if (!parent) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const newId = randomUUID();
  createAudit(newId, parent.url);
  setParent(newId, parent.id);
  void runAudit(newId, parent.url);
  return NextResponse.json({ id: newId, url: parent.url, parent: parent.id });
}
