import { NextRequest, NextResponse } from "next/server";
import fs from "node:fs/promises";
import path from "node:path";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Apply a code patch to a file in a local project folder.
 * Safety: only allows writing under paths the user explicitly configures.
 */
const ALLOWED_ROOTS = (process.env.PATCH_ALLOWED_ROOTS || "")
  .split(",")
  .map((p) => p.trim())
  .filter(Boolean);

function isPathAllowed(absPath: string): boolean {
  if (ALLOWED_ROOTS.length === 0) return false;
  return ALLOWED_ROOTS.some((root) => {
    const r = path.resolve(root);
    return absPath === r || absPath.startsWith(r + path.sep);
  });
}

export async function POST(req: NextRequest) {
  try {
    const { projectRoot, filePath, content, mode } = await req.json();
    if (!projectRoot || !filePath || typeof content !== "string") {
      return NextResponse.json(
        { error: "projectRoot, filePath, content are required" },
        { status: 400 }
      );
    }
    const absRoot = path.resolve(projectRoot);
    const absFile = path.resolve(absRoot, filePath);

    if (!isPathAllowed(absFile)) {
      return NextResponse.json(
        {
          error: `Path not allowed. Add the project root to PATCH_ALLOWED_ROOTS in .env.local. Current allowed: ${ALLOWED_ROOTS.join(", ") || "(none)"}`,
        },
        { status: 403 }
      );
    }

    if (!absFile.startsWith(absRoot + path.sep) && absFile !== absRoot) {
      return NextResponse.json(
        { error: "filePath escapes projectRoot" },
        { status: 400 }
      );
    }

    // mode: 'create' = fail if exists, 'overwrite' = replace, 'append' = append
    const exists = await fs
      .access(absFile)
      .then(() => true)
      .catch(() => false);

    let backupPath: string | null = null;
    if (exists && mode === "overwrite") {
      backupPath = `${absFile}.backup.${Date.now()}`;
      await fs.copyFile(absFile, backupPath);
    }
    if (exists && mode === "create") {
      return NextResponse.json(
        { error: "File exists. Use mode=overwrite to replace." },
        { status: 409 }
      );
    }

    await fs.mkdir(path.dirname(absFile), { recursive: true });

    if (mode === "append" && exists) {
      const current = await fs.readFile(absFile, "utf8");
      await fs.writeFile(absFile, current + "\n" + content);
    } else {
      await fs.writeFile(absFile, content);
    }

    return NextResponse.json({
      success: true,
      absPath: absFile,
      backup: backupPath,
      bytesWritten: Buffer.byteLength(content, "utf8"),
    });
  } catch (e) {
    return NextResponse.json(
      { error: (e as Error).message },
      { status: 500 }
    );
  }
}
