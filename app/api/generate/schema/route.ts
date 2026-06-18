import { NextRequest, NextResponse } from "next/server";
import { generateSchema, SchemaInput } from "@/lib/audit/generators";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as SchemaInput;
    if (!body.type || !body.context) {
      return NextResponse.json(
        { error: "type and context are required" },
        { status: 400 }
      );
    }
    const schema = await generateSchema(body);
    return NextResponse.json({ schema });
  } catch (e) {
    return NextResponse.json(
      { error: (e as Error).message },
      { status: 500 }
    );
  }
}
