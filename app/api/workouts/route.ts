import { get, put } from "@vercel/blob";
import { NextRequest, NextResponse } from "next/server";
import { LoggedWorkout } from "../../../lib/types";

// The entire workout log lives as one private JSON blob, since this is a
// single-user app with a handful of writes a day.
const LOG_PATH = "workout-log.json";

// No token/oidcToken/storeId passed here on purpose: @vercel/blob resolves
// them itself from BLOB_READ_WRITE_TOKEN, or falls back to
// VERCEL_OIDC_TOKEN + BLOB_STORE_ID when the store uses OIDC auth instead.
async function readLog(): Promise<LoggedWorkout[]> {
  const result = await get(LOG_PATH, { access: "private" });
  if (!result || result.statusCode !== 200) return [];
  try {
    const parsed = JSON.parse(await new Response(result.stream).text());
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(
      (w) => w && typeof w.id === "string" && typeof w.minutes === "number"
    );
  } catch {
    return [];
  }
}

async function writeLog(log: LoggedWorkout[]) {
  await put(LOG_PATH, JSON.stringify(log), {
    access: "private",
    allowOverwrite: true,
    contentType: "application/json",
  });
}

export async function GET() {
  return NextResponse.json(await readLog());
}

export async function POST(req: NextRequest) {
  const entry = await req.json();
  if (!entry || typeof entry.id !== "string" || typeof entry.minutes !== "number") {
    return NextResponse.json({ error: "Invalid workout" }, { status: 400 });
  }
  const next = [...(await readLog()), entry as LoggedWorkout];
  await writeLog(next);
  return NextResponse.json(next);
}

export async function DELETE(req: NextRequest) {
  const id = req.nextUrl.searchParams.get("id");
  const log = await readLog();
  const next = id ? log.filter((w) => w.id !== id) : [];
  await writeLog(next);
  return NextResponse.json(next);
}
