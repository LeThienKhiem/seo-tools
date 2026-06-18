import { NextRequest, NextResponse } from "next/server";
import { generateOgImageCode, OgImageInput, generateMetadataExport } from "@/lib/audit/generators";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as OgImageInput & { url?: string; description?: string };
    if (!body.brand || !body.title) {
      return NextResponse.json(
        { error: "brand and title are required" },
        { status: 400 }
      );
    }
    const ogImageCode = generateOgImageCode(body);
    const metadataCode = body.url
      ? generateMetadataExport({
          title: body.title,
          description: body.description || body.subtitle || "",
          url: body.url,
          brand: body.brand,
        })
      : null;
    return NextResponse.json({ ogImageCode, metadataCode });
  } catch (e) {
    return NextResponse.json(
      { error: (e as Error).message },
      { status: 500 }
    );
  }
}
