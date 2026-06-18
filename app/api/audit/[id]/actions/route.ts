import { NextRequest, NextResponse } from "next/server";
import {
  getAudit,
  listActionsByAudit,
  createAction,
  updateActionStatus,
} from "@/lib/db";
import { randomUUID } from "node:crypto";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const audit = getAudit(id);
  if (!audit?.report) return NextResponse.json({ error: "No audit" }, { status: 404 });
  const report = JSON.parse(audit.report);
  let actions = listActionsByAudit(id);

  // Seed actions from issues on first call
  if (actions.length === 0 && Array.isArray(report.topIssues)) {
    report.topIssues.forEach((iss: any, idx: number) => {
      createAction(randomUUID(), id, idx, iss);
    });
    actions = listActionsByAudit(id);
  }

  return NextResponse.json({
    audit: { id: audit.id, url: audit.url, status: audit.status },
    actions: actions.map((a) => ({
      id: a.id,
      issue_idx: a.issue_idx,
      status: a.status,
      notes: a.notes,
      completed_at: a.completed_at,
      payload: JSON.parse(a.payload),
    })),
  });
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  await params;
  const { actionId, status, notes } = await req.json();
  if (!actionId || !status)
    return NextResponse.json(
      { error: "actionId, status required" },
      { status: 400 }
    );
  updateActionStatus(actionId, status, notes);
  return NextResponse.json({ ok: true });
}
