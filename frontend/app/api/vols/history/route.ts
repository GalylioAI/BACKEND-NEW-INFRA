import { NextResponse } from "next/server";
import { buildTrackedFlights, expectedMinutes, type TrackedFlight } from "@/lib/flight-tracker";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

function isoDate(d: Date) { return d.toISOString().slice(0, 10); }

function clampDateRange(sp: URLSearchParams) {
  const now = new Date();
  const defaultTo = new Date(now); defaultTo.setUTCHours(23, 59, 59, 999);
  const defaultFrom = new Date(defaultTo);
  defaultFrom.setUTCDate(defaultTo.getUTCDate() - 30);
  defaultFrom.setUTCHours(0, 0, 0, 0);

  const parseDate = (v: string | null, fallback: Date) => {
    const d = v ? new Date(`${v.slice(0, 10)}T00:00:00.000Z`) : fallback;
    return isNaN(d.getTime()) ? fallback : d;
  };

  const from = parseDate(sp.get("dateFrom"), defaultFrom);
  const to = parseDate(sp.get("dateTo"), defaultTo);
  to.setUTCHours(23, 59, 59, 999);
  return { from, to };
}

function pageNumber(v: string | null) {
  const n = Number(v); return Number.isFinite(n) ? Math.max(1, Math.floor(n)) : 1;
}
function pageSizeNumber(v: string | null) {
  const n = Number(v); if (!Number.isFinite(n)) return 25; return Math.min(100, Math.max(10, Math.floor(n)));
}
function airlineFilter(v: string | null): "all" | "TAR" | "LBT" {
  const a = v?.toUpperCase(); return (a === "TAR" || a === "LBT") ? a : "all";
}

export async function GET(request: Request) {
  const sp = new URL(request.url).searchParams;
  const { from, to } = clampDateRange(sp);
  const page = pageNumber(sp.get("page"));
  const pageSize = pageSizeNumber(sp.get("pageSize"));
  const airline = airlineFilter(sp.get("airline"));

  const allFlights = await buildTrackedFlights(from, to, airline);
  const total = allFlights.length;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const safePage = Math.min(page, totalPages);
  const flights = allFlights.slice((safePage - 1) * pageSize, safePage * pageSize);

  return NextResponse.json(
    {
      flights,
      source: "adsb-snapshots",
      timestamp: Date.now(),
      dateFrom: isoDate(from),
      dateTo: isoDate(to),
      page: safePage,
      pageSize,
      total,
      totalPages,
    },
    { headers: { "Cache-Control": "no-store, max-age=0" } },
  );
}
