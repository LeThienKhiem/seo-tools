import { fetchUrl, parseHtml, fetchSitemap, type ParsedPage } from "./fetch";

export interface CrawledPage {
  url: string;
  status: number;
  parsed?: ParsedPage;
  error?: string;
}

export interface CrawlResult {
  startUrl: string;
  origin: string;
  pages: CrawledPage[];
  summary: {
    total: number;
    ok: number;
    failed: number;
    missingTitle: number;
    missingDescription: number;
    missingH1: number;
    duplicateTitles: number;
    duplicateDescriptions: number;
    avgWordCount: number;
    pagesWithSchema: number;
    pagesWithoutCanonical: number;
  };
}

/** Crawl up to `limit` pages, starting from sitemap if available, else BFS from start URL. */
export async function crawlSite(
  startUrl: string,
  limit = 20,
  concurrency = 4
): Promise<CrawlResult> {
  const origin = new URL(startUrl).origin;
  const seen = new Set<string>();
  const queue: string[] = [];

  // Try sitemap first
  const sitemap = await fetchSitemap(origin);
  if (sitemap.found && sitemap.sampleUrls.length > 0) {
    for (const u of sitemap.sampleUrls.slice(0, limit)) {
      queue.push(u);
      seen.add(u);
    }
  } else {
    queue.push(startUrl);
    seen.add(startUrl);
  }

  const results: CrawledPage[] = [];
  const inFlight: Promise<void>[] = [];

  const processOne = async (url: string): Promise<void> => {
    try {
      const res = await fetchUrl(url, 15000);
      if (res.status >= 200 && res.status < 400 && res.html) {
        const parsed = parseHtml(res.html, res.finalUrl);
        results.push({ url, status: res.status, parsed });
      } else {
        results.push({ url, status: res.status });
      }
    } catch (e) {
      results.push({ url, status: 0, error: (e as Error).message });
    }
  };

  while ((queue.length > 0 || inFlight.length > 0) && results.length < limit) {
    while (inFlight.length < concurrency && queue.length > 0 && results.length + inFlight.length < limit) {
      const url = queue.shift()!;
      const p = processOne(url).finally(() => {
        const i = inFlight.indexOf(p);
        if (i >= 0) inFlight.splice(i, 1);
      });
      inFlight.push(p);
    }
    if (inFlight.length > 0) await Promise.race(inFlight);
  }
  await Promise.all(inFlight);

  // Summary
  const ok = results.filter((r) => r.parsed);
  const titles = new Map<string, number>();
  const descs = new Map<string, number>();
  for (const r of ok) {
    const t = r.parsed!.title;
    const d = r.parsed!.metaDescription;
    if (t) titles.set(t, (titles.get(t) || 0) + 1);
    if (d) descs.set(d, (descs.get(d) || 0) + 1);
  }
  const dupTitles = [...titles.values()].filter((c) => c > 1).reduce((a, b) => a + b, 0);
  const dupDescs = [...descs.values()].filter((c) => c > 1).reduce((a, b) => a + b, 0);

  const summary = {
    total: results.length,
    ok: ok.length,
    failed: results.filter((r) => !r.parsed).length,
    missingTitle: ok.filter((r) => !r.parsed!.title).length,
    missingDescription: ok.filter((r) => !r.parsed!.metaDescription).length,
    missingH1: ok.filter((r) => r.parsed!.h1.length === 0).length,
    duplicateTitles: dupTitles,
    duplicateDescriptions: dupDescs,
    avgWordCount: ok.length
      ? Math.round(ok.reduce((s, r) => s + r.parsed!.wordCount, 0) / ok.length)
      : 0,
    pagesWithSchema: ok.filter((r) => r.parsed!.jsonLd.length > 0).length,
    pagesWithoutCanonical: ok.filter((r) => !r.parsed!.canonical).length,
  };

  return { startUrl, origin, pages: results, summary };
}
