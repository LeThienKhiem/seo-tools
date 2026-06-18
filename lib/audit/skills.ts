import Anthropic from "@anthropic-ai/sdk";
import { getSetting } from "@/lib/db";

function getClient() {
  const key = process.env.ANTHROPIC_API_KEY || getSetting("anthropic_api_key") || "";
  if (!key) throw new Error("Chưa cấu hình Anthropic API key. Vào /setup trước.");
  return new Anthropic({ apiKey: key });
}
function getModel() {
  return process.env.ANTHROPIC_MODEL || getSetting("anthropic_model") || "claude-sonnet-4-6";
}

function extractJson(text: string): any {
  const s = text.indexOf("{");
  const e = text.lastIndexOf("}");
  if (s === -1 || e === -1) {
    const as = text.indexOf("[");
    const ae = text.lastIndexOf("]");
    if (as === -1 || ae === -1) throw new Error("Model không trả về JSON");
    return JSON.parse(text.slice(as, ae + 1));
  }
  return JSON.parse(text.slice(s, e + 1));
}

async function callJson(system: string, user: string, max = 6000): Promise<any> {
  const res = await getClient().messages.create({
    model: getModel(),
    max_tokens: max,
    system,
    messages: [{ role: "user", content: user }],
  });
  const text = res.content.filter((b) => b.type === "text").map((b: any) => b.text).join("\n");
  return extractJson(text);
}

const VI_RULE = `**NGÔN NGỮ**: TẤT CẢ giá trị text trong JSON PHẢI bằng TIẾNG VIỆT. JSON keys giữ tiếng Anh. Tên kỹ thuật (URL, slug, schema types, code, file path) giữ nguyên không dịch.`;

/* ── CONTENT BRIEF ──────────────────────────────────────── */
export async function generateContentBrief(input: {
  topic: string;
  targetKeyword: string;
  audience: string;
  intent: "informational" | "transactional" | "navigational" | "commercial";
  competitorUrls?: string[];
}): Promise<any> {
  const sys = `Bạn tạo SEO content brief cho blog/landing page.

${VI_RULE}

Trả về JSON shape:
{
  "title": "<gợi ý H1 + title tag, ≤60 ký tự, tiếng Việt>",
  "metaDescription": "<≤160 ký tự, tiếng Việt>",
  "urlSlug": "<kebab-case, có thể tiếng Anh hoặc tiếng Việt không dấu>",
  "targetKeyword": "...",
  "secondaryKeywords": ["...", "..."],
  "searchIntent": "<mô tả intent bằng tiếng Việt>",
  "wordCountTarget": <số>,
  "outline": [
    { "heading": "H2 ...", "wordCount": 200, "keywords": [...], "notes": "viết gì ở đây, tiếng Việt" },
    { "heading": "H2 ...", "subsections": [{"heading": "H3 ...", "wordCount": 150, "notes": "..."}] }
  ],
  "faqs": [{ "q": "câu hỏi tiếng Việt", "a_outline": "outline trả lời, tiếng Việt" }],
  "internalLinks": [{ "anchor": "anchor text tiếng Việt", "target": "URL pattern" }],
  "externalLinks": [{ "anchor": "...", "url": "<nguồn uy tín>" }],
  "schemaTypes": ["Article", "FAQPage"],
  "successMetrics": ["..."]
}

Cụ thể, không sáo rỗng.`;

  const user = `Chủ đề: ${input.topic}
Từ khóa chính: ${input.targetKeyword}
Đối tượng: ${input.audience}
Intent: ${input.intent}
${input.competitorUrls?.length ? `Đối thủ:\n${input.competitorUrls.join("\n")}` : ""}

Generate brief.`;
  return callJson(sys, user, 8000);
}

/* ── CLUSTER PLANNER ────────────────────────────────────── */
export async function planCluster(input: { seedKeyword: string; businessContext: string }): Promise<any> {
  const sys = `Bạn thiết kế topic cluster hub-and-spoke cho SEO.

${VI_RULE}

Trả về JSON:
{
  "pillarPage": {
    "title": "<tiếng Việt>",
    "url": "/...",
    "targetKeyword": "...",
    "searchVolumeEstimate": "high|medium|low",
    "wordCountTarget": 3000
  },
  "spokes": [
    {
      "title": "<tiếng Việt>",
      "url": "/...",
      "targetKeyword": "...",
      "intent": "informational|transactional|commercial",
      "wordCountTarget": 1500,
      "linksTo": ["/pillar-url", "/other-spoke-1"]
    }
  ],
  "internalLinkMatrix": [
    { "from": "/url-a", "to": "/url-b", "anchor": "anchor text tiếng Việt" }
  ],
  "buildOrder": ["url1", "url2", ...]
}

1 pillar + 8-12 spokes. Anchor tự nhiên, không over-optimize.`;

  const user = `Seed keyword: ${input.seedKeyword}
Bối cảnh business: ${input.businessContext}

Thiết kế cluster.`;
  return callJson(sys, user, 8000);
}

/* ── PROGRAMMATIC PLANNER ───────────────────────────────── */
export async function planProgrammatic(input: {
  existingUrls: string[];
  businessContext: string;
}): Promise<any> {
  const sys = `Bạn phân tích pattern programmatic SEO và đề xuất mở rộng quy mô.

${VI_RULE}

Trả về JSON:
{
  "detectedPatterns": [
    { "pattern": "/tools/bank/{name}", "count": 12, "examples": ["/tools/bank/chase"] }
  ],
  "expansionPlan": [
    {
      "patternId": "...",
      "newSegments": ["..."],
      "estimatedNewPages": <số>,
      "rationale": "<lý do, tiếng Việt>",
      "dataSource": "<nguồn data, tiếng Việt>",
      "templateFields": ["title", "h1", "intro", "table", "faq"],
      "thinContentGuards": ["min word count 400", "unique stats per page"]
    }
  ],
  "indexBloatRisk": "low|medium|high",
  "recommendedRollout": ["batch 1: 20 trang", "batch 2: ..."]
}`;

  const user = `URL hiện có (mẫu):
${input.existingUrls.slice(0, 50).join("\n")}

Business: ${input.businessContext}

Phân tích pattern và đề xuất mở rộng.`;
  return callJson(sys, user, 8000);
}

/* ── COMPETITOR /vs PAGE ────────────────────────────────── */
export async function generateVsPage(input: {
  product: string;
  competitor: string;
  productContext: string;
}): Promise<any> {
  const sys = `Bạn tạo nội dung trang "Product vs Competitor" tối ưu SEO + conversion.

${VI_RULE}

Trả về JSON:
{
  "title": "<≤60 ký tự, kèm tên cả 2 sản phẩm + năm, tiếng Việt>",
  "metaDescription": "<≤160 ký tự, tiếng Việt>",
  "urlSlug": "kebab",
  "h1": "<tiếng Việt>",
  "intro": "<tiếng Việt>",
  "featureMatrix": [
    { "feature": "<tên tính năng tiếng Việt>", "product": "yes/value", "competitor": "yes/value", "winner": "product|competitor|tie" }
  ],
  "pricingComparison": { "product": "...", "competitor": "..." },
  "whoShouldChoose": {
    "product": "<chân dung user phù hợp với product, tiếng Việt>",
    "competitor": "<chân dung user phù hợp với competitor, tiếng Việt>"
  },
  "verdict": "<kết luận, tiếng Việt>",
  "schemaJsonLd": { "@context": "https://schema.org", "@type": "Article", ... },
  "ctaCopy": "<CTA tiếng Việt>"
}

CÔNG BẰNG. Không bash competitor. Highlight điểm mạnh thật của cả 2.`;

  const user = `Sản phẩm: ${input.product}
Đối thủ: ${input.competitor}
Bối cảnh: ${input.productContext}

Tạo trang vs.`;
  return callJson(sys, user, 8000);
}

/* ── GEO / AI SEARCH CHECKER ────────────────────────────── */
export async function checkGeo(input: {
  url: string;
  pageContent: string;
  schemaTypes: string[];
}): Promise<any> {
  const sys = `Bạn đánh giá khả năng xuất hiện trong AI-powered search (Google AI Overviews, ChatGPT web search, Perplexity, Bing Copilot).

${VI_RULE}

Trả về JSON:
{
  "overallGeoScore": <0-100>,
  "dimensions": {
    "citability": { "score": <0-100>, "notes": "<facts có thân thiện cho trích dẫn không, tiếng Việt>" },
    "structuredAnswers": { "score": <0-100>, "notes": "<FAQ schema, definition blocks, list?, tiếng Việt>" },
    "claimDensity": { "score": <0-100>, "notes": "<có stats/quotes/numbers cụ thể không, tiếng Việt>" },
    "freshness": { "score": <0-100>, "notes": "<có publish/updated date, data hiện tại?, tiếng Việt>" },
    "authorAuthority": { "score": <0-100>, "notes": "<có author byline, credentials?, tiếng Việt>" },
    "aiCrawlerAccess": { "score": <0-100>, "notes": "<OAI-SearchBot, PerplexityBot, GPTBot trong robots.txt?, tiếng Việt>" }
  },
  "topActions": [
    { "priority": "high|medium|low", "action": "<hành động tiếng Việt>", "estimatedImpact": "<tác động tiếng Việt>" }
  ],
  "citableSnippets": [
    "<đoạn văn cụ thể trên trang mà AI có khả năng trích, có thể tiếng Anh hoặc tiếng Việt theo nội dung trang>"
  ]
}`;

  const user = `URL: ${input.url}
Schema types: ${input.schemaTypes.join(", ") || "không có"}

Nội dung trang (8000 ký tự đầu):
${input.pageContent.slice(0, 8000)}

Chấm điểm.`;
  return callJson(sys, user, 6000);
}

/* ── HREFLANG VALIDATOR ─────────────────────────────────── */
export async function validateHreflang(input: {
  url: string;
  tags: Array<{ lang: string; href: string }>;
  detectedLang: string;
}): Promise<any> {
  const sys = `Bạn audit hreflang implementation cho international SEO.

${VI_RULE}

Trả về JSON:
{
  "valid": true|false,
  "issues": [
    { "severity": "error|warning|info", "code": "...", "message": "<tiếng Việt>", "fix": "<tiếng Việt>" }
  ],
  "recommendations": ["<tiếng Việt>"],
  "suggestedAddition": [
    { "lang": "es", "href": "https://...", "reasoning": "<tiếng Việt>" }
  ]
}

Lỗi thường gặp:
- Thiếu x-default
- Không reciprocal (lang A trỏ B nhưng B không trỏ A)
- Code ngôn ngữ sai (phải ISO 639-1)
- Code vùng sai (phải ISO 3166-1 alpha-2)
- Thiếu self-referencing
- URL phải absolute`;

  const user = `URL: ${input.url}
Lang phát hiện: ${input.detectedLang}
Hreflang tags trên trang:
${JSON.stringify(input.tags, null, 2)}

Audit và trả JSON.`;
  return callJson(sys, user, 4000);
}

/* ── DRIFT COMPARE ──────────────────────────────────────── */
export async function compareDrift(input: { before: any; after: any }): Promise<any> {
  const sys = `Bạn so sánh 2 snapshot SEO và báo cáo regression/improvement.

${VI_RULE}

Trả về JSON:
{
  "overallDelta": "improved|degraded|mixed|unchanged",
  "changes": [
    {
      "field": "title|meta_description|h1|canonical|schema|...",
      "severity": "critical|major|minor|info",
      "before": "<giá trị cũ, không dịch>",
      "after": "<giá trị mới, không dịch>",
      "impact": "<tác động, tiếng Việt>",
      "recommendation": "<đề xuất, tiếng Việt>"
    }
  ],
  "regressionCount": <số>,
  "improvementCount": <số>,
  "summary": "<tóm tắt, tiếng Việt>"
}

Critical = canonical thay đổi ngoài ý muốn, schema bị xóa, robots block
Major = title/desc bị rút ngắn hoặc generic
Minor = heading text rephrased
Info = whitespace/cosmetic`;

  const user = `BEFORE (baseline):
${JSON.stringify(input.before, null, 2)}

AFTER (hiện tại):
${JSON.stringify(input.after, null, 2)}

So sánh.`;
  return callJson(sys, user, 6000);
}
