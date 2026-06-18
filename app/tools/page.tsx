import Link from "next/link";
import {
  Search,
  Bot,
  Languages,
  FileCode,
  Sparkles,
  Image as ImageIcon,
  FileText,
  Network,
  Layers,
  Swords,
  Code2,
  Map,
  Activity,
  Zap,
  Wrench,
  ArrowUpRight,
} from "lucide-react";

const categories = [
  {
    name: "Analyze",
    description: "Quét, đo, đánh giá hiện trạng",
    tools: [
      { href: "/", title: "Full audit", icon: Search, desc: "Score + 10 categories + top issues with code-level fixes" },
      { href: "/tools/crawl", title: "Multi-page crawler", icon: Search, desc: "Crawl ≤100 pages. Detect duplicates, missing meta, schema coverage" },
      { href: "/tools/geo", title: "GEO / AI search", icon: Bot, desc: "Readiness for Google AI Overviews, ChatGPT, Perplexity, Bing Copilot" },
      { href: "/tools/hreflang", title: "Hreflang", icon: Languages, desc: "i18n validation — reciprocal, x-default, ISO codes" },
    ],
  },
  {
    name: "Generate",
    description: "Sản xuất code, content, markup",
    tools: [
      { href: "/tools/schema", title: "Schema builder", icon: FileCode, desc: "JSON-LD for HowTo, FAQ, Breadcrumb, Product, Article, more" },
      { href: "/tools/rewrite", title: "Title & meta rewriter", icon: Sparkles, desc: "5 alternatives ≤60/160c with rationale" },
      { href: "/tools/og-image", title: "OG image kit", icon: ImageIcon, desc: "Next.js opengraph-image.tsx — no Figma needed" },
      { href: "/tools/content-brief", title: "Content brief", icon: FileText, desc: "Blog/landing outline with keywords, FAQ, internal links" },
      { href: "/tools/cluster", title: "Topic cluster", icon: Network, desc: "1 pillar + 8–12 spokes + internal link matrix" },
      { href: "/tools/programmatic", title: "Programmatic SEO", icon: Layers, desc: "Detect URL patterns + propose scaled expansion" },
      { href: "/tools/vs-page", title: "/vs page", icon: Swords, desc: "Generate competitor comparison pages" },
      { href: "/tools/robots", title: "Robots.txt", icon: Code2, desc: "Generator with optional AI crawler blocking" },
      { href: "/tools/sitemap", title: "Sitemap", icon: Map, desc: "XML sitemap from crawl or URL list" },
    ],
  },
  {
    name: "Workflows",
    description: "Quy trình theo dõi và submit",
    tools: [
      { href: "/tools/drift", title: "Drift monitor", icon: Activity, desc: "Snapshot before deploy. Diff regressions with AI" },
      { href: "/tools/indexnow", title: "IndexNow", icon: Zap, desc: "Push URLs to Bing/Yandex instantly" },
    ],
  },
  {
    name: "Infrastructure",
    description: "Apply code vào dự án thật",
    tools: [
      { href: "/tools/patch", title: "File patcher", icon: Wrench, desc: "Write generated code directly into your Next.js project" },
    ],
  },
];

export default function ToolsPage() {
  const total = categories.reduce((s, c) => s + c.tools.length, 0);
  return (
    <div className="space-y-10">
      <header className="border-b border-border pb-6">
        <div className="text-eyebrow mb-2">Action Center</div>
        <h1 className="h-display mb-3">
          One workbench.<br />
          <span className="text-muted">{total} SEO skills.</span>
        </h1>
        <p className="text-muted text-base max-w-xl">
          Every skill in the claude-seo library, ported into a unified UI.
          Apply to any project, any stack.
        </p>
      </header>

      {categories.map((cat) => (
        <section key={cat.name} className="space-y-4">
          <div>
            <h2 className="font-serif text-xl">{cat.name}</h2>
            <p className="text-sm text-muted mt-0.5">{cat.description}</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {cat.tools.map((t) => {
              const Icon = t.icon;
              return (
                <Link
                  key={t.href}
                  href={t.href}
                  className="group card-hover relative"
                >
                  <div className="flex items-start gap-3 mb-3">
                    <div className="w-9 h-9 rounded-lg bg-bg flex items-center justify-center text-ink group-hover:bg-ink group-hover:text-bg transition-colors">
                      <Icon size={16} strokeWidth={1.75} />
                    </div>
                    <h3 className="font-medium text-sm leading-tight flex-1 mt-1.5">
                      {t.title}
                    </h3>
                    <ArrowUpRight
                      size={14}
                      className="text-subtle group-hover:text-ink transition-colors mt-1.5"
                    />
                  </div>
                  <p className="text-xs text-muted leading-relaxed">{t.desc}</p>
                </Link>
              );
            })}
          </div>
        </section>
      ))}
    </div>
  );
}
