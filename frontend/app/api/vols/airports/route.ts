import { NextResponse } from "next/server";
import { fetchTunisiaAirports } from "@/lib/fr24";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET() {
  const airports = await fetchTunisiaAirports();

  return NextResponse.json(airports, {
    headers: {
      "Cache-Control": "no-store, max-age=0",
    },
  });
}
