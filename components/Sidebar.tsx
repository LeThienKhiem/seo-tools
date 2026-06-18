"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Search,
  Globe,
  Sparkles,
  FileText,
  Network,
  Layers,
  Swords,
  Image as ImageIcon,
  FileCode,
  Code2,
  Map,
  Bot,
  Activity,
  Zap,
  Wrench,
  Languages,
  Settings,
} from "lucide-react";

const sections = [
  {
    label: "Workspace",
    items: [
      { href: "/", label: "Audits", icon: LayoutDashboard },
      { href: "/setup", label: "Setup", icon: Settings },
      { href: "/tools", label: "All tools", icon: Sparkles },
    ],
  },
  {
    label: "Analyze",
    items: [
      { href: "/tools/crawl", label: "Multi-page crawl", icon: Search },
      { href: "/tools/geo", label: "GEO / AI search", icon: Bot },
      { href: "/tools/hreflang", label: "Hreflang", icon: Languages },
    ],
  },
  {
    label: "Generate",
    items: [
      { href: "/tools/schema", label: "Schema", icon: FileCode },
      { href: "/tools/rewrite", label: "Rewriter", icon: Sparkles },
      { href: "/tools/og-image", label: "OG image", icon: ImageIcon },
      { href: "/tools/content-brief", label: "Content brief", icon: FileText },
      { href: "/tools/cluster", label: "Topic cluster", icon: Network },
      { href: "/tools/programmatic", label: "Programmatic", icon: Layers },
      { href: "/tools/vs-page", label: "/vs page", icon: Swords },
      { href: "/tools/robots", label: "Robots.txt", icon: Code2 },
      { href: "/tools/sitemap", label: "Sitemap", icon: Map },
    ],
  },
  {
    label: "Workflows",
    items: [
      { href: "/tools/drift", label: "Drift monitor", icon: Activity },
      { href: "/tools/indexnow", label: "IndexNow", icon: Zap },
    ],
  },
  {
    label: "Infrastructure",
    items: [
      { href: "/tools/patch", label: "File patcher", icon: Wrench },
    ],
  },
];

export function Sidebar() {
  const pathname = usePathname();
  return (
    <aside className="w-60 border-r border-border bg-surface/60 backdrop-blur-sm h-screen sticky top-0 hidden md:flex flex-col">
      <div className="px-5 py-5 border-b border-border">
        <Link href="/" className="flex items-center gap-2.5 group">
          <div className="w-7 h-7 rounded-md bg-ink flex items-center justify-center text-bg font-serif text-base leading-none">
            S
          </div>
          <div>
            <div className="font-serif text-base leading-tight">Sentry</div>
            <div className="text-[10px] text-muted leading-tight">SEO Workbench</div>
          </div>
        </Link>
      </div>
      <nav className="flex-1 overflow-y-auto px-3 py-3 space-y-5">
        {sections.map((sec) => (
          <div key={sec.label}>
            <div className="px-3 mb-1.5 text-[10px] font-medium tracking-wider uppercase text-subtle">
              {sec.label}
            </div>
            <div className="space-y-0.5">
              {sec.items.map((item) => {
                const active =
                  item.href === "/"
                    ? pathname === "/"
                    : pathname.startsWith(item.href);
                const Icon = item.icon;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={
                      active
                        ? "relative flex items-center gap-2.5 px-3 py-1.5 rounded-md text-sm bg-bg text-ink font-medium"
                        : "flex items-center gap-2.5 px-3 py-1.5 rounded-md text-sm text-muted hover:text-ink hover:bg-bg transition-colors"
                    }
                  >
                    <Icon size={15} strokeWidth={1.75} />
                    {item.label}
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </nav>
      <div className="border-t border-border px-5 py-3 text-[10px] text-subtle">
        Powered by Claude
      </div>
    </aside>
  );
}
