import { NextRequest, NextResponse } from "next/server";
import { submitIndexNow } from "@/lib/tools/robots-sitemap";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const { host, key, urlList, engine } = await req.json();
    if (!host || !key || !Array.isArray(urlList) || urlList.length === 0) {
      return NextResponse.json(
        { error: "host, key, urlList[] required" },
        { status: 400 }
      );
    }
    const result = await submitIndexNow({ host, key, urlList, engine });
    return NextResponse.json(result);
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 500 });
  }
}
