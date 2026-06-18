import Anthropic from "@anthropic-ai/sdk";
import { getSetting } from "@/lib/db";

function getClient() {
  const key = process.env.ANTHROPIC_API_KEY || getSetting("anthropic_api_key") || "";
  if (!key) throw new Error("Anthropic API key not configured. Visit /setup first.");
  return new Anthropic({ apiKey: key });
}
function getModel() {
  return process.env.ANTHROPIC_MODEL || getSetting("anthropic_model") || "claude-sonnet-4-6";
}
const client = new Proxy({} as Anthropic, {
  get(_, prop) {
    const c = getClient();
    return (c as any)[prop];
  },
});
const MODEL_GETTER = () => getModel();

function extractJson(text: string): unknown {
  const start = text.indexOf("{");
  const end = text.lastIndexOf("}");
  if (start === -1 || end === -1) {
    const arrStart = text.indexOf("[");
    const arrEnd = text.lastIndexOf("]");
    if (arrStart === -1 || arrEnd === -1) {
      throw new Error("No JSON found in model output");
    }
    return JSON.parse(text.slice(arrStart, arrEnd + 1));
  }
  return JSON.parse(text.slice(start, end + 1));
}

/* ── SCHEMA GENERATOR ──────────────────────────────────────── */

export interface SchemaInput {
  type: "HowTo" | "FAQPage" | "BreadcrumbList" | "Product" | "Article" | "Organization" | "LocalBusiness" | "SoftwareApplication";
  context: string;
  data?: Record<string, unknown>;
}

export async function generateSchema(input: SchemaInput): Promise<unknown> {
  const sys = `Bạn generate Schema.org JSON-LD markup hợp lệ.

Quy tắc:
- Chỉ trả về JSON object có @context và @type. Không có chữ trước/sau, không code fence.
- Dùng https://schema.org làm @context.
- Bao gồm đầy đủ property bắt buộc của type theo Schema.org spec.
- Giá trị text trong schema CÓ THỂ dùng tiếng Việt nếu phù hợp với nội dung trang (ví dụ: name, description, text).
- Field đặc biệt như priceCurrency, ratingValue, language code giữ format chuẩn (USD, VND, vi, en, etc.).
- Chỉ điền placeholder khi user không cung cấp data cụ thể — đánh dấu rõ "TODO".
- HowTo: bao gồm name, totalTime, supply, tool, step[] (mỗi step có name + text)
- FAQPage: mainEntity array Question với acceptedAnswer
- BreadcrumbList: itemListElement với position, name, item
- Product: name, image, description, brand, offers (price, priceCurrency, availability)`;

  const user = `Generate ${input.type} JSON-LD cho context sau:

${input.context}

${input.data ? `Data cụ thể:\n${JSON.stringify(input.data, null, 2)}` : ""}

Trả JSON object.`;

  const res = await client.messages.create({
    model: MODEL_GETTER(),
    max_tokens: 4000,
    system: sys,
    messages: [{ role: "user", content: user }],
  });

  const text = res.content
    .filter((b) => b.type === "text")
    .map((b: any) => b.text)
    .join("\n");

  return extractJson(text);
}

/* ── TITLE / META REWRITER ─────────────────────────────────── */

export interface RewriteInput {
  kind: "title" | "meta_description";
  current: string;
  context: string;
  maxLength?: number;
}

export async function rewriteText(input: RewriteInput): Promise<{
  alternatives: Array<{ text: string; length: number; rationale: string }>;
}> {
  const max =
    input.maxLength || (input.kind === "title" ? 60 : 160);

  const sys = `Bạn rewrite SEO ${input.kind === "title" ? "title tag" : "meta description"} để CTR cao nhất, trong giới hạn độ dài.

Quy tắc:
- Mỗi alternative PHẢI <= ${max} ký tự
- Đặt từ khóa chính lên đầu
- Giọng văn chủ động, hướng lợi ích, không sáo rỗng
- Tránh clickbait nhưng dùng power word (Miễn phí, Nhanh, AI, Tốt nhất, Free, Fast, AI-powered, Best…)
- **text** (chuỗi rewrite) viết theo ngôn ngữ phù hợp với trang hiện tại (nếu trang gốc tiếng Anh → giữ tiếng Anh, nếu tiếng Việt → tiếng Việt)
- **rationale** (giải thích lý do) LUÔN viết bằng TIẾNG VIỆT
- Trả JSON: { "alternatives": [ { "text": "...", "length": N, "rationale": "..." } ] }
- Đúng 5 alternative, sắp tốt-nhất-trước.`;

  const user = `${input.kind} hiện tại: "${input.current}" (độ dài: ${input.current.length})
Max cho phép: ${max} ký tự

Context về trang/business:
${input.context}

Generate 5 alternative tốt hơn. Chỉ trả JSON.`;

  const res = await client.messages.create({
    model: MODEL_GETTER(),
    max_tokens: 2000,
    system: sys,
    messages: [{ role: "user", content: user }],
  });

  const text = res.content
    .filter((b) => b.type === "text")
    .map((b: any) => b.text)
    .join("\n");

  return extractJson(text) as any;
}

/* ── OG IMAGE TEMPLATE GENERATOR ───────────────────────────── */

export interface OgImageInput {
  brand: string;
  title: string;
  subtitle?: string;
  accent?: string;
  style?: "minimal" | "bold" | "gradient" | "product";
}

export function generateOgImageCode(input: OgImageInput): string {
  const accent = input.accent || "#1e3a5f";
  const sub = input.subtitle || "";
  const style = input.style || "gradient";

  const bg =
    style === "gradient"
      ? `linear-gradient(135deg, ${accent} 0%, #000 100%)`
      : style === "bold"
      ? accent
      : style === "minimal"
      ? "#ffffff"
      : `linear-gradient(135deg, #f5f5f5 0%, #e5e5e5 100%)`;

  const fg = style === "minimal" ? "#1a1a1a" : "#ffffff";

  return `// Next.js auto-generates this as /opengraph-image at build time
// Reference: https://nextjs.org/docs/app/api-reference/file-conventions/metadata/opengraph-image

import { ImageResponse } from 'next/og'

export const runtime = 'edge'
export const alt = '${input.brand} — ${input.title}'
export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'

export default async function OpengraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'flex-start',
          padding: '80px',
          background: '${bg}',
          color: '${fg}',
          fontFamily: 'system-ui, -apple-system, sans-serif',
        }}
      >
        <div style={{ fontSize: 32, opacity: 0.7, marginBottom: 24 }}>
          ${input.brand}
        </div>
        <div
          style={{
            fontSize: 72,
            fontWeight: 800,
            lineHeight: 1.1,
            letterSpacing: '-0.02em',
            marginBottom: 24,
          }}
        >
          ${input.title}
        </div>
        ${
          sub
            ? `<div style={{ fontSize: 28, opacity: 0.85, lineHeight: 1.3 }}>
          ${sub}
        </div>`
            : ""
        }
      </div>
    ),
    { ...size }
  )
}
`;
}

/* ── METADATA SUGGESTION ───────────────────────────────────── */

export function generateMetadataExport(input: {
  title: string;
  description: string;
  url: string;
  brand: string;
}): string {
  return `// app/layout.tsx or page-level metadata
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: ${JSON.stringify(input.title)},
  description: ${JSON.stringify(input.description)},
  metadataBase: new URL(${JSON.stringify(input.url)}),
  alternates: { canonical: '/' },
  openGraph: {
    type: 'website',
    url: ${JSON.stringify(input.url)},
    title: ${JSON.stringify(input.title)},
    description: ${JSON.stringify(input.description)},
    siteName: ${JSON.stringify(input.brand)},
    images: [{ url: '/opengraph-image', width: 1200, height: 630 }],
    locale: 'en_US',
  },
  twitter: {
    card: 'summary_large_image',
    title: ${JSON.stringify(input.title)},
    description: ${JSON.stringify(input.description)},
    images: ['/opengraph-image'],
  },
  robots: { index: true, follow: true },
}
`;
}
