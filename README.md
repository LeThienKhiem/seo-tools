# Internal SEO Tool

Web app nội bộ chạy local. Nhập URL → Claude phân tích → trả về report có điểm số và code fix paste được vào Next.js.

## Stack

- Next.js 15 (App Router) + TypeScript
- Anthropic SDK (Claude Sonnet 4.6 mặc định)
- SQLite (better-sqlite3) lưu lịch sử audit
- Tailwind CSS
- Cheerio parse HTML

## Cài đặt (1 lần)

```bash
cd /Users/lethienkhiem/Documents/CodeProject/seo-tool
npm install
cp .env.local.example .env.local
```

Mở `.env.local` và dán **Anthropic API key** vào:
```
ANTHROPIC_API_KEY=sk-ant-xxxxx
```
Lấy key tại https://console.anthropic.com/settings/keys

## Chạy

```bash
npm run dev
```

Mở http://localhost:3000

## Sử dụng

1. Dán URL bất kỳ (vd: `https://www.invoicetodata.com/`)
2. Bấm **Audit**
3. Trang chuyển sang `/audit/{id}` — thấy live log (~30–60 giây)
4. Khi xong, xem:
   - **Overall score** (0–100)
   - **Top issues** với code fix sẵn để paste
   - **10 categories** với điểm riêng từng mục
   - **Quick wins** + **Long-term plan**
5. Lịch sử audit lưu ở `/`

## Cấu trúc

```
seo-tool/
├── app/
│   ├── page.tsx              # Form input + lịch sử
│   ├── audit/[id]/page.tsx   # Report viewer
│   ├── api/audit/route.ts    # POST start audit / GET list
│   └── api/audit/[id]/route.ts # GET status
├── lib/
│   ├── db.ts                 # SQLite layer
│   ├── tools/fetch.ts        # Fetch + parse HTML + robots + sitemap
│   └── audit/
│       ├── prompt.ts         # System prompt cho Claude
│       └── orchestrator.ts   # Logic chính: crawl → call Claude → save
└── data/audits.db            # Tự tạo, lưu lịch sử
```

## Cost

- Mỗi audit dùng Sonnet 4.6: **~$0.05–0.15/audit** (tùy site lớn nhỏ)
- Với Opus 4.7: ~$0.30–1/audit (chính xác hơn, dùng cho audit quan trọng)

Đổi model: sửa `ANTHROPIC_MODEL` trong `.env.local`:
- `claude-sonnet-4-6` — mặc định, rẻ + nhanh
- `claude-opus-4-7` — chậm + đắt, chất lượng cao nhất
- `claude-haiku-4-5-20251001` — cực rẻ, dùng cho test

## Toàn bộ 15 tool

### Analyzers
| Tool | URL | Để làm gì |
|---|---|---|
| **Full SEO Audit** | `/` | Score + 10 category + top issues |
| **Multi-page Crawler** | `/tools/crawl` | Crawl 100 trang, dupes, missing meta |
| **GEO / AI Search Checker** | `/tools/geo` | AI Overviews, ChatGPT, Perplexity readiness |
| **Hreflang Validator** | `/tools/hreflang` | i18n validation |

### Generators
| Tool | URL | Để làm gì |
|---|---|---|
| **Schema Builder** | `/tools/schema` | JSON-LD 8 type |
| **Title/Meta Rewriter** | `/tools/rewrite` | 5 alternatives |
| **OG Image Kit** | `/tools/og-image` | Next.js opengraph-image.tsx |
| **Content Brief** | `/tools/content-brief` | Outline blog/landing |
| **Topic Cluster** | `/tools/cluster` | Pillar + spokes architecture |
| **Programmatic SEO** | `/tools/programmatic` | Phát hiện pattern, mở rộng scale |
| **/vs Page** | `/tools/vs-page` | Comparison page generator |
| **Robots.txt** | `/tools/robots` | Robots generator (option block AI bots) |
| **Sitemap** | `/tools/sitemap` | XML sitemap từ crawl |

### Workflows
| Tool | URL | Để làm gì |
|---|---|---|
| **Drift Monitor** | `/tools/drift` | Snapshot trước/sau deploy, diff regressions |
| **IndexNow Submitter** | `/tools/indexnow` | Push URL lên Bing/Yandex tức thì |

### Infrastructure
| Tool | URL | Để làm gì |
|---|---|---|
| **File Patcher** | `/tools/patch` | Ghi code vào project Next.js |

## Action Center — biến findings thành action

Sau khi audit xong, mỗi issue có nút mở Action Center để giải quyết ngay:

| Tool | URL | Để làm gì |
|---|---|---|
| **Schema Builder** | `/tools/schema` | Generate JSON-LD (HowTo, FAQPage, BreadcrumbList, Product, Article, Organization, LocalBusiness, SoftwareApplication) |
| **Title / Meta Rewriter** | `/tools/rewrite` | Paste title 80c → ra 5 phương án ≤60c với rationale |
| **OG Image Kit** | `/tools/og-image` | Generate `opengraph-image.tsx` cho Next.js — không cần Figma |
| **File Patcher** | `/tools/patch` | Ghi code generated trực tiếp vào file trong dự án Next.js (an toàn: chỉ paths trong `PATCH_ALLOWED_ROOTS`) |

### Setup File Patcher

Trong `.env.local`, thêm:
```
PATCH_ALLOWED_ROOTS=/Users/lethienkhiem/Documents/CodeProject/pdf-converter
```
Comma-separate nếu nhiều project. Restart `npm run dev`.

Patcher tự backup file gốc ra `*.backup.<timestamp>` trước khi overwrite.

### Workflow điển hình

1. `/` → nhập URL → audit
2. Mở report → đọc Top Issues
3. Click "→ Schema Builder" trên issue "thiếu HowTo schema" → fill form → copy JSON-LD
4. Click "→ Apply to project" → File Patcher mở sẵn với file path đề xuất → paste code → write
5. `git diff` trong dự án → review → commit → deploy Vercel
6. Quay lại `/` → re-audit → so điểm số

## Mở rộng tương lai

Đã có hạ tầng, dễ thêm:
- **Crawl đa trang:** thêm subagent loop trong `orchestrator.ts`
- **PageSpeed Insights:** thêm tool gọi PSI API
- **Backlinks (Moz/Bing free):** import scripts Python từ `claude-seo/scripts/`
- **PDF export:** dùng Puppeteer hoặc react-pdf
- **Cron audit tự động:** thêm route `/api/cron` + Vercel Cron
- **Diff/drift:** so 2 audit của cùng URL theo thời gian
- **Slack webhook:** notify khi audit xong

## Lưu ý

- App **không có auth** — chạy local thôi. Đừng deploy public.
- DB `data/audits.db` là SQLite file. Backup bằng cách copy file.
- Audit chạy ở background (fire-and-forget) trong Node.js process. Nếu kill `npm run dev` giữa chừng, audit đó sẽ stuck ở `running` — có thể clear bằng cách xóa file `data/audits.db` (mất hết history).
