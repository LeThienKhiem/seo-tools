import { DatabaseSync } from "node:sqlite";
import path from "node:path";
import fs from "node:fs";

// Lazy initialization — only create DB connection on first call.
// This avoids "database is locked" errors during Next.js build phase
// when multiple route modules are loaded in parallel.
let _db: DatabaseSync | null = null;

function getDb(): DatabaseSync {
  if (_db) return _db;

  const DATA_DIR = path.join(process.cwd(), "data");
  if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });

  const db = new DatabaseSync(path.join(DATA_DIR, "audits.db"));
  db.exec(`PRAGMA journal_mode = WAL;`);
  db.exec(`PRAGMA busy_timeout = 5000;`);

  db.exec(`
    CREATE TABLE IF NOT EXISTS audits (
      id TEXT PRIMARY KEY,
      url TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'pending',
      created_at INTEGER NOT NULL,
      updated_at INTEGER NOT NULL,
      report TEXT,
      logs TEXT,
      error TEXT,
      gsc_data TEXT,
      parent_audit_id TEXT
    );
    CREATE INDEX IF NOT EXISTS idx_audits_created ON audits(created_at DESC);
    CREATE INDEX IF NOT EXISTS idx_audits_url ON audits(url, created_at DESC);

    CREATE TABLE IF NOT EXISTS baselines (
      id TEXT PRIMARY KEY,
      url TEXT NOT NULL,
      label TEXT,
      snapshot TEXT NOT NULL,
      created_at INTEGER NOT NULL
    );
    CREATE INDEX IF NOT EXISTS idx_baselines_url ON baselines(url, created_at DESC);

    CREATE TABLE IF NOT EXISTS settings (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL,
      updated_at INTEGER NOT NULL
    );

    CREATE TABLE IF NOT EXISTS actions (
      id TEXT PRIMARY KEY,
      audit_id TEXT NOT NULL,
      issue_idx INTEGER NOT NULL,
      status TEXT NOT NULL DEFAULT 'pending',
      payload TEXT NOT NULL,
      notes TEXT,
      completed_at INTEGER,
      created_at INTEGER NOT NULL
    );
    CREATE INDEX IF NOT EXISTS idx_actions_audit ON actions(audit_id);
  `);

  // Idempotent migrations
  try { db.exec(`ALTER TABLE audits ADD COLUMN gsc_data TEXT`); } catch {}
  try { db.exec(`ALTER TABLE audits ADD COLUMN parent_audit_id TEXT`); } catch {}

  _db = db;
  return db;
}

export type AuditStatus = "pending" | "running" | "completed" | "failed";

export interface AuditRow {
  id: string;
  url: string;
  status: AuditStatus;
  created_at: number;
  updated_at: number;
  report: string | null;
  logs: string | null;
  error: string | null;
  gsc_data?: string | null;
  parent_audit_id?: string | null;
}

const cast = <T>(v: unknown): T => v as T;

/* ── Audits ─────────────────────────────────────── */

export function createAudit(id: string, url: string) {
  const now = Date.now();
  getDb()
    .prepare(`INSERT INTO audits (id, url, status, created_at, updated_at, logs) VALUES (?, ?, 'pending', ?, ?, '[]')`)
    .run(id, url, now, now);
}

export function updateAuditStatus(id: string, status: AuditStatus) {
  getDb()
    .prepare(`UPDATE audits SET status = ?, updated_at = ? WHERE id = ?`)
    .run(status, Date.now(), id);
}

export function appendLog(id: string, line: string) {
  const db = getDb();
  const row = cast<{ logs: string } | undefined>(
    db.prepare(`SELECT logs FROM audits WHERE id = ?`).get(id)
  );
  const logs: string[] = row?.logs ? JSON.parse(row.logs) : [];
  logs.push(`[${new Date().toISOString()}] ${line}`);
  db.prepare(`UPDATE audits SET logs = ?, updated_at = ? WHERE id = ?`).run(
    JSON.stringify(logs), Date.now(), id
  );
}

export function saveReport(id: string, report: unknown) {
  getDb()
    .prepare(`UPDATE audits SET report = ?, status = 'completed', updated_at = ? WHERE id = ?`)
    .run(JSON.stringify(report), Date.now(), id);
}

export function saveError(id: string, error: string) {
  getDb()
    .prepare(`UPDATE audits SET error = ?, status = 'failed', updated_at = ? WHERE id = ?`)
    .run(error, Date.now(), id);
}

export function getAudit(id: string): AuditRow | undefined {
  return cast<AuditRow | undefined>(
    getDb().prepare(`SELECT * FROM audits WHERE id = ?`).get(id)
  );
}

export function listAudits(limit = 50): AuditRow[] {
  return cast<AuditRow[]>(
    getDb().prepare(`SELECT * FROM audits ORDER BY created_at DESC LIMIT ?`).all(limit)
  );
}

/* ── Baselines ──────────────────────────────────── */

export function saveBaseline(id: string, url: string, label: string, snapshot: unknown) {
  getDb()
    .prepare(`INSERT INTO baselines (id, url, label, snapshot, created_at) VALUES (?, ?, ?, ?, ?)`)
    .run(id, url, label, JSON.stringify(snapshot), Date.now());
}

export function listBaselines(url?: string) {
  type Row = { id: string; url: string; label: string; created_at: number };
  const db = getDb();
  if (url) {
    return cast<Row[]>(
      db.prepare(`SELECT id, url, label, created_at FROM baselines WHERE url = ? ORDER BY created_at DESC`).all(url)
    );
  }
  return cast<Row[]>(
    db.prepare(`SELECT id, url, label, created_at FROM baselines ORDER BY created_at DESC LIMIT 100`).all()
  );
}

export function getBaseline(id: string) {
  type Row = { id: string; url: string; label: string; snapshot: string; created_at: number };
  const row = cast<Row | undefined>(getDb().prepare(`SELECT * FROM baselines WHERE id = ?`).get(id));
  if (!row) return null;
  return { ...row, snapshot: JSON.parse(row.snapshot) };
}

/* ── Settings ───────────────────────────────────── */

export function setSetting(key: string, value: string) {
  getDb()
    .prepare(`INSERT INTO settings (key, value, updated_at) VALUES (?, ?, ?)
              ON CONFLICT(key) DO UPDATE SET value=excluded.value, updated_at=excluded.updated_at`)
    .run(key, value, Date.now());
}

export function getSetting(key: string): string | null {
  const row = cast<{ value: string } | undefined>(
    getDb().prepare(`SELECT value FROM settings WHERE key = ?`).get(key)
  );
  return row?.value || null;
}

export function listSettings(): Record<string, string> {
  const rows = cast<Array<{ key: string; value: string }>>(
    getDb().prepare(`SELECT key, value FROM settings`).all()
  );
  const map: Record<string, string> = {};
  for (const r of rows) map[r.key] = r.value;
  return map;
}

/* ── Actions ────────────────────────────────────── */

export function createAction(id: string, auditId: string, issueIdx: number, payload: unknown) {
  getDb()
    .prepare(`INSERT INTO actions (id, audit_id, issue_idx, status, payload, created_at) VALUES (?, ?, ?, 'pending', ?, ?)`)
    .run(id, auditId, issueIdx, JSON.stringify(payload), Date.now());
}

export function updateActionStatus(id: string, status: string, notes?: string) {
  getDb()
    .prepare(`UPDATE actions SET status = ?, notes = ?, completed_at = ? WHERE id = ?`)
    .run(status, notes || null, status === "completed" ? Date.now() : null, id);
}

export function listActionsByAudit(auditId: string) {
  type Row = {
    id: string; audit_id: string; issue_idx: number; status: string;
    payload: string; notes: string | null; completed_at: number | null; created_at: number;
  };
  return cast<Row[]>(
    getDb().prepare(`SELECT * FROM actions WHERE audit_id = ? ORDER BY issue_idx ASC`).all(auditId)
  );
}

/* ── GSC ────────────────────────────────────────── */

export function attachGscData(auditId: string, data: unknown) {
  getDb()
    .prepare(`UPDATE audits SET gsc_data = ?, updated_at = ? WHERE id = ?`)
    .run(JSON.stringify(data), Date.now(), auditId);
}

/* ── Audit lineage ──────────────────────────────── */

export function listAuditsForUrl(url: string): AuditRow[] {
  return cast<AuditRow[]>(
    getDb().prepare(`SELECT * FROM audits WHERE url = ? ORDER BY created_at DESC`).all(url)
  );
}

export function setParent(childId: string, parentId: string) {
  getDb().prepare(`UPDATE audits SET parent_audit_id = ? WHERE id = ?`).run(parentId, childId);
}
