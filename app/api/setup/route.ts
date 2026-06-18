import { NextRequest, NextResponse } from "next/server";
import { setSetting, listSettings, getSetting } from "@/lib/db";
import Anthropic from "@anthropic-ai/sdk";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const s = listSettings();
  return NextResponse.json({
    hasApiKey:
      !!process.env.ANTHROPIC_API_KEY || !!s.anthropic_api_key,
    model: s.anthropic_model || process.env.ANTHROPIC_MODEL || "claude-sonnet-4-6",
    apiKeySource: process.env.ANTHROPIC_API_KEY
      ? "env"
      : s.anthropic_api_key
      ? "db"
      : "none",
    gscEmail: s.gsc_email || null,
    projectRoot: s.project_root || "",
    patchAllowed: !!process.env.PATCH_ALLOWED_ROOTS,
  });
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const updates: Record<string, string> = {};
    if (body.apiKey !== undefined) updates.anthropic_api_key = body.apiKey;
    if (body.model) updates.anthropic_model = body.model;
    if (body.gscEmail !== undefined) updates.gsc_email = body.gscEmail;
    if (body.projectRoot !== undefined) updates.project_root = body.projectRoot;

    // Optionally test the API key by listing models
    if (body.apiKey && body.testKey) {
      try {
        const client = new Anthropic({ apiKey: body.apiKey });
        await client.messages.create({
          model: updates.anthropic_model || "claude-sonnet-4-6",
          max_tokens: 8,
          messages: [{ role: "user", content: "ping" }],
        });
      } catch (e) {
        return NextResponse.json(
          { error: `API key test failed: ${(e as Error).message}` },
          { status: 400 }
        );
      }
    }

    for (const [k, v] of Object.entries(updates)) setSetting(k, v);
    return NextResponse.json({ ok: true, updated: Object.keys(updates) });
  } catch (e) {
    return NextResponse.json(
      { error: (e as Error).message },
      { status: 500 }
    );
  }
}
