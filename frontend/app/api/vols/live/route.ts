import { NextResponse } from "next/server";
import { fetchFr24Live, isTargetAirline, type Fr24QuerySource, type Fr24LiveFlight } from "@/lib/fr24";
import { estimateLiveDelay } from "@/lib/vols-delay";
import { saveVolsSnapshot } from "@/lib/vols-json-store";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

/* ── Types ─────────────────────────────────────────────────── */
type AdsbAircraft = {
  hex?: string; flight?: string; r?: string; t?: string;
  desc?: string; route?: string; depAirport?: string; arrAirport?: string;
  routeDataSource?: string; routeSourceUpdatedAt?: number;
  dataSource?: string; sourceArea?: string; sourceUpdatedAt?: number; capturedAt?: number;
  alt_baro?: number | string; alt_geom?: number; gs?: number; track?: number;
  baro_rate?: number; squawk?: string; lat?: number; lon?: number;
  seen?: number; seen_pos?: number; messages?: number;
  [key: string]: unknown;
};

type AdsbResponse = { ac?: AdsbAircraft[]; aircraft?: AdsbAircraft[]; now?: number; total?: number; resultCount?: number };
type SourceStat = { name: string; area: string; total: number; matched: number; updatedAt?: number; ok: boolean; status?: number; message?: string };
type FetchResult = { aircraft: AdsbAircraft[]; sources: SourceStat[] };
type SearchArea = { label: string; lat: number; lon: number; dist: number };

const AIRLINES = ["TAR", "LBT"] as const;

/* ── FR24 query sources ─────────────────────────────────────── */
const TUNISIA_AIRPORT_FILTERS = [
  "inbound:TUN", "outbound:TUN", "inbound:DJE", "outbound:DJE",
  "inbound:MIR", "outbound:MIR", "inbound:SFA", "outbound:SFA",
].join(",");

const FR24_SOURCES: Fr24QuerySource[] = [
  { name: "FR24", label: "Tunisia airports",    endpoint: "/live/flight-positions/full",  params: { airports: TUNISIA_AIRPORT_FILTERS, limit: 300 } },
  { name: "FR24", label: "Tunisair operator",   endpoint: "/live/flight-positions/full",  params: { operating_as: "TAR", limit: 300 } },
  { name: "FR24", label: "Nouvelair operator",  endpoint: "/live/flight-positions/full",  params: { operating_as: "LBT", limit: 300 } },
  { name: "FR24", label: "Mediterranean bounds", endpoint: "/live/flight-positions/light", params: { bounds: "47.5,24.0,-12.5,42.5", limit: 1000 } },
];

/* ── ADS-B area sources ─────────────────────────────────────── */
const ADSB_LOL_AREAS: SearchArea[] = [
  { label: "tunisia-med-wide",     lat: 36.8065, lon: 10.1815, dist: 1000 },
  { label: "west-europe-wide",     lat: 48.2,    lon: 3.2,     dist: 650  },
  { label: "east-med-wide",        lat: 39.4,    lon: 25.5,    dist: 650  },
  { label: "northwest-africa-wide",lat: 33.7,    lon: -3.5,    dist: 650  },
  { label: "middle-east-wide",     lat: 26.5,    lon: 43.5,    dist: 650  },
];

const ADSB_FI_AREAS: SearchArea[] = [
  { label: "tunis",    lat: 36.8065, lon: 10.1815, dist: 250 },
  { label: "paris",    lat: 48.8566, lon: 2.3522,  dist: 240 },
  { label: "istanbul", lat: 41.0082, lon: 28.9784, dist: 240 },
];

const AIRPLANES_LIVE_AREAS: SearchArea[] = [
  { label: "airplanes-tunis",   lat: 36.8065, lon: 10.1815, dist: 250 },
  { label: "airplanes-paris",   lat: 48.8566, lon: 2.3522,  dist: 250 },
  { label: "airplanes-rome",    lat: 41.9028, lon: 12.4964, dist: 250 },
  { label: "airplanes-istanbul",lat: 41.0082, lon: 28.9784, dist: 250 },
];

const EZZ_AREAS: SearchArea[] = [
  { label: "ezz-tunis",   lat: 36.8065, lon: 10.1815, dist: 250 },
  { label: "ezz-paris",   lat: 48.8566, lon: 2.3522,  dist: 250 },
  { label: "ezz-rome",    lat: 41.9028, lon: 12.4964, dist: 250 },
  { label: "ezz-istanbul",lat: 41.0082, lon: 28.9784, dist: 250 },
];

/* ── Helpers ────────────────────────────────────────────────── */
function aircraftFrom(data: AdsbResponse): AdsbAircraft[] {
  return Array.isArray(data.ac) ? data.ac : Array.isArray(data.aircraft) ? data.aircraft : [];
}

function normalizeSourceTime(value: unknown, fallback: number) {
  if (typeof value !== "number" || !Number.isFinite(value)) return fallback;
  return value < 10_000_000_000 ? value * 1000 : value;
}

function sleep(ms: number) { return new Promise((r) => setTimeout(r, ms)); }

function callsignOf(a: AdsbAircraft) { return (a.flight ?? "").trim().toUpperCase(); }
function airlineOf(a: AdsbAircraft) { return AIRLINES.find((al) => callsignOf(a).startsWith(al)) ?? null; }

/* ── Route enrichment (adsbdb) ──────────────────────────────── */
type RouteInfo = { route?: string; depAirport?: string; arrAirport?: string; routeDataSource?: string; routeSourceUpdatedAt?: number; expires: number };
const routeCache = new Map<string, RouteInfo>();

async function fetchAdsbDbRoute(callsign: string): Promise<RouteInfo | undefined> {
  try {
    const res = await fetch(`https://api.adsbdb.com/v0/callsign/${callsign}`, {
      cache: "no-store", headers: { Accept: "application/json", "User-Agent": "1111.tn/vols-live" },
      signal: AbortSignal.timeout(5000),
    });
    if (!res.ok) return undefined;
    const data: { response?: { flightroute?: { origin?: { icao_code?: string }; destination?: { icao_code?: string } } } } = await res.json();
    const dep = data.response?.flightroute?.origin?.icao_code?.toUpperCase();
    const arr = data.response?.flightroute?.destination?.icao_code?.toUpperCase();
    if (!dep || !arr) return undefined;
    return { route: `${dep}-${arr}`, depAirport: dep, arrAirport: arr, routeDataSource: "adsbdb", routeSourceUpdatedAt: Date.now(), expires: Date.now() + 3600_000 };
  } catch { return undefined; }
}

async function enrichRoutes(aircraft: AdsbAircraft[]): Promise<AdsbAircraft[]> {
  const targets = aircraft.filter((a) => isTargetAirline(callsignOf(a)) && !a.route);
  const unique = [...new Set(targets.map((a) => callsignOf(a)))].slice(0, 12);

  await Promise.all(unique.map(async (cs) => {
    const cached = routeCache.get(cs);
    if (cached && cached.expires > Date.now()) return;
    await sleep(Math.random() * 200);
    const info = await fetchAdsbDbRoute(cs);
    if (info) routeCache.set(cs, info);
  }));

  return aircraft.map((item) => {
    const route = routeCache.get(callsignOf(item));
    return route ? { ...item, route: route.route, depAirport: route.depAirport, arrAirport: route.arrAirport, routeDataSource: route.routeDataSource, routeSourceUpdatedAt: route.routeSourceUpdatedAt } : item;
  });
}

/* ── ADS-B area fetch ───────────────────────────────────────── */
async function fetchJson(name: string, area: SearchArea, url: string): Promise<FetchResult> {
  const capturedAt = Date.now();
  try {
    const res = await fetch(url, {
      cache: "no-store", headers: { Accept: "application/json", "User-Agent": "1111.tn/vols-live" },
      signal: AbortSignal.timeout(8000),
    });
    if (!res.ok) return { aircraft: [], sources: [{ name, area: area.label, total: 0, matched: 0, ok: false, status: res.status }] };

    const data: AdsbResponse = await res.json();
    const sourceUpdatedAt = normalizeSourceTime(data.now, capturedAt);
    const all = aircraftFrom(data).map((item) => ({ ...item, dataSource: name, sourceArea: area.label, sourceUpdatedAt, capturedAt }));
    const matched = all.filter((item) => airlineOf(item) !== null);

    return {
      aircraft: matched,
      sources: [{ name, area: area.label, total: data.total ?? data.resultCount ?? all.length, matched: matched.length, updatedAt: sourceUpdatedAt, ok: true }],
    };
  } catch {
    return { aircraft: [], sources: [{ name, area: area.label, total: 0, matched: 0, ok: false }] };
  }
}

async function fetchByAreas(): Promise<FetchResult> {
  const [adsbLolResults, adsbFiResults, ezzResults] = await Promise.all([
    Promise.all(ADSB_LOL_AREAS.map((a) => fetchJson("ADSB.LOL", a, `https://api.adsb.lol/v2/lat/${a.lat}/lon/${a.lon}/dist/${a.dist}`))),
    Promise.all(ADSB_FI_AREAS.map((a) => fetchJson("ADSB.FI", a, `https://opendata.adsb.fi/api/v2/lat/${a.lat}/lon/${a.lon}/dist/${a.dist}`))),
    Promise.all(EZZ_AREAS.map((a) => fetchJson("EZZ456CH", a, `https://api.adsb.ezz456ch.com/v2/circle/${a.lat}/${a.lon}/${a.dist}`))),
  ]);

  // airplanes.live requires staggered requests
  const airplanesResults: FetchResult[] = [];
  for (const a of AIRPLANES_LIVE_AREAS) {
    airplanesResults.push(await fetchJson("AIRPLANES.LIVE", a, `https://api.airplanes.live/v2/point/${a.lat}/${a.lon}/${a.dist}`));
    await sleep(1100);
  }

  const all = [...adsbLolResults, ...adsbFiResults, ...ezzResults, ...airplanesResults];
  return { aircraft: all.flatMap((r) => r.aircraft), sources: all.flatMap((r) => r.sources) };
}

/* ── OpenSky ────────────────────────────────────────────────── */
async function fetchOpenSky(): Promise<FetchResult> {
  const capturedAt = Date.now();
  try {
    const res = await fetch("https://opensky-network.org/api/states/all?lamin=15&lamax=58&lomin=-20&lomax=55", {
      cache: "no-store", headers: { Accept: "application/json" }, signal: AbortSignal.timeout(12000),
    });
    if (!res.ok) return { aircraft: [], sources: [{ name: "OPENSKY", area: "north-africa-europe", total: 0, matched: 0, ok: false, status: res.status }] };

    const data: { states?: unknown[]; time?: number } = await res.json();
    const states = (data.states ?? []) as unknown[][];
    const sourceUpdatedAt = data.time ? data.time * 1000 : capturedAt;

    const aircraft = states
      .filter((s) => typeof s[1] === "string" && AIRLINES.some((al) => (s[1] as string).trim().toUpperCase().startsWith(al)))
      .map((s) => ({
        hex: String(s[0] ?? ""),
        flight: String(s[1] ?? "").trim(),
        lat: typeof s[6] === "number" ? s[6] : undefined,
        lon: typeof s[5] === "number" ? s[5] : undefined,
        alt_baro: (s[8] === true || s[7] === null) ? "ground" : typeof s[7] === "number" ? Math.round((s[7] as number) * 3.28084) : undefined,
        gs: typeof s[9] === "number" ? Math.round((s[9] as number) * 1.94384) : undefined,
        track: typeof s[10] === "number" ? s[10] : undefined,
        baro_rate: typeof s[11] === "number" ? Math.round((s[11] as number) * 196.85) : undefined,
        squawk: typeof s[14] === "string" ? s[14] : undefined,
        seen: 0,
        dataSource: "OPENSKY",
        sourceArea: "north-africa-europe",
        sourceUpdatedAt,
        capturedAt,
      }));

    return {
      aircraft,
      sources: [{ name: "OPENSKY", area: "north-africa-europe", total: states.length, matched: aircraft.length, updatedAt: sourceUpdatedAt, ok: true }],
    };
  } catch {
    return { aircraft: [], sources: [{ name: "OPENSKY", area: "north-africa-europe", total: 0, matched: 0, ok: false }] };
  }
}

/* ── Deduplicate (freshest source wins) ─────────────────────── */
function dedupe(aircraft: AdsbAircraft[]): AdsbAircraft[] {
  const byHex = new Map<string, AdsbAircraft>();
  for (const item of aircraft) {
    const cs = callsignOf(item);
    const key = (item.hex || cs).toLowerCase();
    if (!key || !cs) continue;
    const existing = byHex.get(key);
    const existingTime = existing?.sourceUpdatedAt ?? 0;
    const itemTime = item.sourceUpdatedAt ?? 0;
    if (!existing || (existing.lat == null && item.lat != null) || itemTime > existingTime) byHex.set(key, item);
  }
  return [...byHex.values()].sort((a, b) => callsignOf(a).localeCompare(callsignOf(b)));
}

/* ── Merge FR24 (richer) over ADS-B ────────────────────────── */
function mergeFr24(adsb: AdsbAircraft[], fr24Flights: Fr24LiveFlight[]): AdsbAircraft[] {
  const byHex = new Map<string, AdsbAircraft>(adsb.map((a) => [(a.hex || callsignOf(a)).toLowerCase(), a]));
  for (const f of fr24Flights) {
    if (!isTargetAirline(f.flight)) continue;
    const key = (f.hex || f.flight || "").toLowerCase();
    byHex.set(key, {
      hex: f.hex, flight: f.flight, r: f.r, t: f.t, desc: f.desc,
      route: f.route, depAirport: f.depAirport, arrAirport: f.arrAirport,
      dataSource: f.dataSource, sourceArea: f.sourceArea,
      sourceUpdatedAt: f.sourceUpdatedAt, capturedAt: f.capturedAt,
      alt_baro: f.alt_baro, gs: f.gs, track: f.track, baro_rate: f.baro_rate,
      squawk: f.squawk, lat: f.lat, lon: f.lon, seen: f.seen,
    } as AdsbAircraft);
  }
  return [...byHex.values()].sort((a, b) => callsignOf(a).localeCompare(callsignOf(b)));
}

/* ── Main handler ───────────────────────────────────────────── */
export async function GET() {
  const [areaResult, openSkyResult, fr24Result] = await Promise.all([
    fetchByAreas(),
    fetchOpenSky(),
    fetchFr24Live(FR24_SOURCES),
  ]);

  const adsbAircraft = dedupe([...areaResult.aircraft, ...openSkyResult.aircraft]);
  const fr24Target = fr24Result.flights.filter((f) => isTargetAirline(f.flight));

  let aircraft = mergeFr24(adsbAircraft, fr24Target);
  aircraft = await enrichRoutes(aircraft);

  const tunisair = aircraft.filter((a) => airlineOf(a) === "TAR").map((a) => estimateLiveDelay(a as unknown as Fr24LiveFlight));
  const nouvelair = aircraft.filter((a) => airlineOf(a) === "LBT").map((a) => estimateLiveDelay(a as unknown as Fr24LiveFlight));

  const sources: SourceStat[] = [
    ...areaResult.sources,
    ...openSkyResult.sources,
    ...fr24Result.sources.map((s) => ({ ...s, name: s.name.toUpperCase() })),
  ];

  const liveDelayed = [...tunisair, ...nouvelair].filter((f) => (f as unknown as { delayMin?: number }).delayMin ?? 0 > 0);

  const payload = { tunisair, nouvelair, total: aircraft.length, timestamp: Date.now(), sources };

  await saveVolsSnapshot("live", payload);
  if (liveDelayed.length > 0) {
    await saveVolsSnapshot("delays", { source: "live-estimated", flights: liveDelayed, timestamp: payload.timestamp });
  }

  return NextResponse.json(payload, { headers: { "Cache-Control": "no-store, max-age=0" } });
}
