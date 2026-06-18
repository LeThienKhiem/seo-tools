import { NextRequest, NextResponse } from "next/server";
import { parseGscCsv } from "@/lib/gsc";
import { attachGscData } from "@/lib/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get("file") as File | null;
    const auditId = formData.get("auditId") as string | null;
    if (!file) return NextResponse.json({ error: "No file" }, { status: 400 });
    const text = await file.text();
    const data = parseGscCsv(text);
    if (auditId) attachGscData(auditId, data);
    return NextResponse.json(data);
  } catch (e) {
    return NextResponse.json(
      { error: (e as Error).message },
      { status: 500 }
    );
  }
}
