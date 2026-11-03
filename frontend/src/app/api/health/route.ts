import { NextResponse } from "next/server";

import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

/**
 * GET /api/health — health check deploy (Gate 4).
 * Mengembalikan 200 saat app berjalan dan konektivitas basis data
 * terverifikasi; 503 saat DB tidak terjangkau (mis. migration belum
 * terpasang atau project Supabase mati). Tidak membocorkan info internal.
 */
export async function GET() {
  const started = Date.now();
  let db: "ok" | "unreachable" = "ok";

  try {
    const supabase = await createClient();
    const { error } = await supabase
      .from("master_options")
      .select("id")
      .limit(1);
    if (error) {
      db = "unreachable";
    }
  } catch {
    db = "unreachable";
  }

  return NextResponse.json(
    {
      status: db === "ok" ? "ok" : "degraded",
      db,
      uptime_ms: Date.now() - started,
      timestamp: new Date().toISOString(),
    },
    { status: db === "ok" ? 200 : 503 }
  );
}