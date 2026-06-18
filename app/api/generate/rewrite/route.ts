import { NextRequest, NextResponse } from "next/server";
import { rewriteText, RewriteInput } from "@/lib/audit/generators";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as RewriteInput;
    if (!body.kind || !body.current) {
      return NextResponse.json(
        { error: "kind and current are required" },
        { status: 400 }
      );
    }
    const result = await rewriteText(body);
    return NextResponse.json(result);
  } catch (e) {
    return NextResponse.json(
      { error: (e as Error).message },
      { status: 500 }
    );
  }
}
