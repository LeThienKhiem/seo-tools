import Anthropic from "@anthropic-ai/sdk";
import { fetchUrl, parseHtml, fetchRobots, fetchSitemap } from "@/lib/tools/fetch";
import { SYSTEM_PROMPT } from "./prompt";
import { appendLog, saveReport, saveError, updateAuditStatus, getSetting } from "@/lib/db";

function getApiKey(): string {
  return process.env.ANTHROPIC_API_KEY || getSetting("anthropic_api_key") || "";
}
function getModel(): string {
  return process.env.ANTHROPIC_MODEL || getSetting("anthropic_model") || "claude-sonnet-4-6";
}
const MAX_TOKENS = Number(process.env.MAX_TOKENS || 16000);

export async function runAudit(id: string, url: string): Promise<void> {
  try {
    updateAuditStatus(id, "running");
    appendLog(id, `Starting audit for ${url}`);

    // Step 1: gather crawl data deterministically (faster + cheaper than LLM tool-use loop)
    appendLog(id, "Fetching homepage...");
    const home = await fetchUrl(url);
    if (home.status >= 400) {
      throw new Error(`Homepage returned HTTP ${home.status}`);
    }
    const parsed = parseHtml(home.html, home.finalUrl);
    appendLog(id, `Parsed: title=${parsed.titleLength}c, ${parsed.jsonLd.length} JSON-LD blocks, ${parsed.h1.length} H1`);

    const origin = new URL(home.finalUrl).origin;
    appendLog(id, "Fetching robots.txt...");
    const robots = await fetchRobots(origin);
    appendLog(id, "Fetching sitemap...");
    const sitemap = await fetchSitemap(origin);
    appendLog(id, `Sitemap: ${sitemap.found ? `${sitemap.urlCount} URLs` : "not found"}`);

    // Step 2: build crawl payload for the model
    const crawlData = {
      target_url: home.finalUrl,
      http_status: home.status,
      cache_headers: {
        cache_control: home.headers["cache-control"] || "",
        server: home.headers["server"] || "",
        x_powered_by: home.headers["x-powered-by"] || "",
        cdn: home.headers["x-vercel-id"] ? "Vercel" : home.headers["cf-ray"] ? "Cloudflare" : "unknown",
      },
      page: {
        title: parsed.title,
        title_length: parsed.titleLength,
        meta_description: parsed.metaDescription,
        meta_description_length: parsed.metaDescLength,
        meta_keywords: parsed.metaKeywords,
        canonical: parsed.canonical,
        robots_meta: parsed.robots,
        lang: parsed.lang,
        hreflang: parsed.hreflang,
        og_tags: parsed.ogTags,
        twitter_tags: parsed.twitterTags,
        heading_count: parsed.headingCount,
        h1_text: parsed.h1,
        h2_text: parsed.h2.slice(0, 20),
        h3_text: parsed.h3.slice(0, 30),
        jsonld_types: parsed.jsonLd.map((j: any) => j?.["@type"] || "unknown"),
        jsonld_full: parsed.jsonLd,
        images: {
          total: parsed.imgTotal,
          with_alt: parsed.imgWithAlt,
          without_alt: parsed.imgWithoutAlt,
          lazy_loading: parsed.imgLazy,
        },
        links: {
          internal: parsed.internalLinks,
          external: parsed.externalLinks,
        },
        word_count: parsed.wordCount,
        has_faq_section: parsed.hasFaqSection,
      },
      robots_txt: robots.slice(0, 2000),
      sitemap: {
        found: sitemap.found,
        url: sitemap.url,
        url_count: sitemap.urlCount,
        sample_urls: sitemap.sampleUrls,
      },
    };

    const apiKey = getApiKey();
    if (!apiKey) throw new Error("Anthropic API key not configured. Go to /setup.");
    const client = new Anthropic({ apiKey });
    const model = getModel();
    appendLog(id, `Sending data to Claude (${model})...`);

    // Step 3: call Claude with the crawl payload
    const response = await client.messages.create({
      model,
      max_tokens: MAX_TOKENS,
      system: SYSTEM_PROMPT,
      messages: [
        {
          role: "user",
          content: `Audit this site. Crawl data:\n\n\`\`\`json\n${JSON.stringify(crawlData, null, 2)}\n\`\`\`\n\nReturn the JSON report now.`,
        },
      ],
    });

    appendLog(id, `Received response from Claude (stop_reason=${response.stop_reason})`);

    // Step 4: extract JSON from the response
    const text = response.content
      .filter((b) => b.type === "text")
      .map((b: any) => b.text)
      .join("\n")
      .trim();

    const jsonStart = text.indexOf("{");
    const jsonEnd = text.lastIndexOf("}");
    if (jsonStart === -1 || jsonEnd === -1) {
      throw new Error("Model did not return JSON. Raw output:\n" + text.slice(0, 500));
    }

    const jsonText = text.slice(jsonStart, jsonEnd + 1);
    let report;
    try {
      report = JSON.parse(jsonText);
    } catch (e) {
      throw new Error(`Invalid JSON from model: ${(e as Error).message}`);
    }

    // attach raw crawl data for transparency
    report._crawl = crawlData;
    report._model = model;
    report._tokens = {
      input: response.usage.input_tokens,
      output: response.usage.output_tokens,
    };

    saveReport(id, report);
    appendLog(id, `Audit completed. Overall score: ${report.overallScore || "n/a"}`);
  } catch (err) {
    const msg = (err as Error).message || String(err);
    appendLog(id, `ERROR: ${msg}`);
    saveError(id, msg);
  }
}
