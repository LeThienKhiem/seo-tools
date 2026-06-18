import { NextRequest, NextResponse } from "next/server";
import { getAudit } from "@/lib/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const fmt = req.nextUrl.searchParams.get("format") || "json";
  const row = getAudit(id);
  if (!row || !row.report)
    return NextResponse.json({ error: "Not found" }, { status: 404 });

  const report = JSON.parse(row.report);

  if (fmt === "json") {
    return new NextResponse(JSON.stringify(report, null, 2), {
      headers: {
        "Content-Type": "application/json",
        "Content-Disposition": `attachment; filename="audit-${id.slice(0, 8)}.json"`,
      },
    });
  }
  if (fmt === "md" || fmt === "markdown") {
    const md = renderMarkdown(row.url, report);
    return new NextResponse(md, {
      headers: {
        "Content-Type": "text/markdown",
        "Content-Disposition": `attachment; filename="audit-${id.slice(0, 8)}.md"`,
      },
    });
  }
  return NextResponse.json({ error: "Unsupported format" }, { status: 400 });
}

function renderMarkdown(url: string, r: any): string {
  const lines: string[] = [];
  lines.push(`# Báo cáo Audit SEO`);
  lines.push(``);
  lines.push(`**URL:** ${url}`);
  lines.push(`**Điểm tổng:** ${r.overallScore}/100`);
  lines.push(`**Loại hình:** ${r.businessType}`);
  lines.push(`**Ngày tạo:** ${new Date().toLocaleString("vi-VN")}`);
  lines.push(``);
  lines.push(`## Tóm tắt điều hành`);
  lines.push(``);
  lines.push(r.summary || "");
  lines.push(``);
  if (r.topIssues?.length) {
    lines.push(`## Các vấn đề quan trọng (${r.topIssues.length})`);
    lines.push(``);
    for (const iss of r.topIssues) {
      const pri = iss.priority === "high" ? "CAO" : iss.priority === "medium" ? "VỪA" : "THẤP";
      lines.push(`### [${pri}] ${iss.title}`);
      lines.push(``);
      lines.push(`- **Category:** ${iss.category}`);
      lines.push(`- **Tác động:** ${iss.impact}`);
      lines.push(`- **Cách sửa:** ${iss.fix}`);
      if (iss.filePath) lines.push(`- **File:** \`${iss.filePath}\``);
      if (iss.code) {
        lines.push(``);
        lines.push("```");
        lines.push(iss.code);
        lines.push("```");
      }
      lines.push(``);
    }
  }
  if (r.categories) {
    lines.push(`## Điểm theo Category`);
    lines.push(``);
    for (const [cat, val] of Object.entries(r.categories) as any) {
      lines.push(`### ${cat} — ${val.score}/100`);
      if (val.findings?.length) {
        lines.push(`**Phát hiện:**`);
        for (const f of val.findings) lines.push(`- ${f}`);
      }
      if (val.recommendations?.length) {
        lines.push(``);
        lines.push(`**Khuyến nghị:**`);
        for (const rec of val.recommendations) lines.push(`- ${rec}`);
      }
      lines.push(``);
    }
  }
  if (r.quickWins?.length) {
    lines.push(`## Quick wins (làm ngay)`);
    for (const q of r.quickWins) lines.push(`- ${q}`);
    lines.push(``);
  }
  if (r.longTermPlan?.length) {
    lines.push(`## Kế hoạch dài hạn (30-90 ngày)`);
    for (const p of r.longTermPlan) lines.push(`- ${p}`);
    lines.push(``);
  }
  lines.push(`---`);
  lines.push(`*Tạo bởi Sentry SEO Workbench · Model: ${r._model || "n/a"}*`);
  return lines.join("\n");
}
