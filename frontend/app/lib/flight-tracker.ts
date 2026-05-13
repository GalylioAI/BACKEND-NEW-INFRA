/**
 * Builds completed-flight records from accumulated live ADS-B snapshots.
 *
 * Logic:
 * - Group snapshot sightings by callsign + calendar date (UTC).
 * - A "flight" spans from the first sighting where the aircraft is airborne
 *   to the last sighting where it is still tracked.
 * - If the last sighting shows altitude < 3000 ft or "ground" the flight is
 *   considered landed; otherwise it's still in progress.
 * - Delay = (actual flight duration) - (expected flight duration).
 *   Expected duration is computed from great-circle distance at 820 km/h cruise
 *   plus a fixed 30-minute block for taxi/climb/descent.
 * - A flight is only included in history when it has been tracked for at least
 *   MIN_TRACKED_MINUTES and the route (dep+arr) is known.
 */

import { readFile } from "node:fs/promises";
import path from "node:path";

const STORE_PATH = path.join(process.cwd(), "data", "vols-data.json");

/* ── Airport coordinates (ICAO) ─────────────────────────────── */
const AIRPORT_COORDS: Record<string, [number, number]> = {
  DTTA: [36.851, 10.227], DTTJ: [33.875, 10.776], DTMB: [35.758, 10.755],
  DTTX: [34.718, 10.691], DTNH: [36.075, 10.438],
  LFPG: [49.010, 2.548],  LFPO: [48.723, 2.379],  LFLL: [45.726, 5.081],
  LFML: [43.437, 5.215],  LFMN: [43.658, 7.215],  LFBO: [43.629, 1.363],
  LFST: [48.538, 7.628],  LFRS: [47.153, -1.610], LFBD: [44.828, -0.715],
  LFLY: [45.727, 5.091],
  EGLL: [51.470, -0.454], EGKK: [51.148, -0.190], EGCC: [53.354, -2.275],
  EGGW: [51.874, -0.368],
  LTFM: [41.275, 28.752], LTBA: [40.977, 28.815],
  LIRF: [41.800, 12.239], LIMC: [45.631, 8.728],  LIPZ: [45.505, 12.352],
  EDDF: [50.038, 8.562],  EDDM: [48.354, 11.786], EDDL: [51.289, 6.767],
  EDDB: [52.366, 13.503], EDDH: [53.630, 9.988],
  EHAM: [52.311, 4.768],  LSZH: [47.458, 8.556],  EBBR: [50.901, 4.484],
  LOWW: [48.110, 16.570], LKPR: [50.100, 14.260], EPKT: [50.474, 19.080],
  EYVI: [54.634, 25.286], EVRA: [56.924, 23.971],
  OERK: [24.958, 46.699], OMDB: [25.253, 55.365], OTHH: [25.274, 51.608],
  HECA: [30.122, 31.406], GMMN: [33.367, -7.590], DAAG: [36.691, 3.215],
  CYUL: [45.470, -73.741], KJFK: [40.641, -73.779],
};

/* ── Haversine great-circle distance (km) ───────────────────── */
function haversineKm(a: [number, number], b: [number, number]): number {
  const toRad = (d: number) => (d * Math.PI) / 180;
  const [lat1, lon1] = a.map(toRad);
  const [lat2, lon2] = b.map(toRad);
  const dlat = lat2 - lat1;
  const dlon = lon2 - lon1;
  const h = Math.sin(dlat / 2) ** 2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dlon / 2) ** 2;
  return 2 * Math.asin(Math.sqrt(h)) * 6371;
}

/**
 * Expected flight duration in minutes from great-circle distance.
 * 820 km/h average groundspeed + 30 min fixed for taxi/climb/descent.
 */
export function expectedMinutes(dep: string | null, arr: string | null): number | null {
  if (!dep || !arr) return null;
  const a = AIRPORT_COORDS[dep];
  const b = AIRPORT_COORDS[arr];
  if (!a || !b) return null;
  const distKm = haversineKm(a, b);
  return Math.round(distKm / 820 * 60 + 30);
}

/* ── Types ──────────────────────────────────────────────────── */
export interface TrackedFlight {
  callsign: string;
  icao24: string;
  registration: string;
  aircraftType: string;
  estDepartureAirport: string | null;
  estArrivalAirport: string | null;
  firstSeen: number;       // unix seconds — first ADS-B ping airborne
  lastSeen: number;        // unix seconds — last ADS-B ping
  actualDurationMin: number;
  expectedDurationMin: number | null;
  delayMin: number | null; // null = cannot determine (route unknown)
  status: "landed" | "in_flight" | "unknown";
  distanceKm: number | null;
  dataPoints: number;      // how many snapshots tracked this flight
}

type RawAircraft = {
  flight?: string; r?: string; t?: string; hex?: string;
  alt_baro?: number | string; gs?: number;
  depAirport?: string; arrAirport?: string;
  sourceUpdatedAt?: number; capturedAt?: number;
};

type Sighting = {
  ts: number;           // unix seconds
  altFt: number | null; // null = ground
  dep: string | null;
  arr: string | null;
  reg: string;
  type: string;
  icao24: string;
};

function isGrounded(alt: number | string | undefined): boolean {
  return alt === "ground" || alt === 0 || alt === undefined || alt === null;
}

function altFeet(alt: number | string | undefined): number | null {
  if (isGrounded(alt)) return null;
  const n = Number(alt);
  return Number.isFinite(n) ? n : null;
}

/** A flight is "complete" if the last sighting is either on the ground or the
 *  aircraft disappeared more than GAP_MINUTES ago (assumed landed out of range). */
const GAP_MINUTES = 45;
const MIN_TRACKED_MINUTES = 20;

/**
 * Load and reconstruct completed flights from saved live snapshots.
 * Each unique callsign is tracked per calendar day (UTC).
 * A same aircraft operating multiple rotations per day will be split when
 * there is a gap ≥ GAP_MINUTES between sightings.
 */
export async function buildTrackedFlights(
  fromDate: Date,
  toDate: Date,
  airline: "all" | "TAR" | "LBT" = "all",
): Promise<TrackedFlight[]> {
  let store: { live?: Array<{ capturedAt: string; data: { tunisair?: RawAircraft[]; nouvelair?: RawAircraft[] } }> };
  try {
    const text = await readFile(STORE_PATH, "utf8");
    store = JSON.parse(text);
  } catch {
    return [];
  }

  const snapshots = Array.isArray(store.live) ? store.live : [];
  const fromMs = fromDate.getTime();
  const toMs = toDate.getTime();

  /* ── Collect sightings per callsign ─────────────────────── */
  const sightingsByCs = new Map<string, Sighting[]>();

  for (const snap of snapshots) {
    const capMs = new Date(snap.capturedAt).getTime();
    if (capMs < fromMs || capMs > toMs) continue;

    const capSec = Math.floor(capMs / 1000);
    const all: RawAircraft[] = [
      ...(Array.isArray(snap.data?.tunisair) ? snap.data.tunisair : []),
      ...(Array.isArray(snap.data?.nouvelair) ? snap.data.nouvelair : []),
    ];

    for (const ac of all) {
      const cs = (ac.flight || "").trim().toUpperCase();
      if (!cs.startsWith("TAR") && !cs.startsWith("LBT")) continue;
      if (airline !== "all" && !cs.startsWith(airline)) continue;

      const ts = ac.sourceUpdatedAt ? Math.floor(ac.sourceUpdatedAt / 1000) : capSec;

      const sighting: Sighting = {
        ts,
        altFt: altFeet(ac.alt_baro),
        dep: ac.depAirport || null,
        arr: ac.arrAirport || null,
        reg: (ac.r || ac.hex || "").toUpperCase(),
        type: ac.t || "",
        icao24: (ac.hex || "").toLowerCase(),
      };

      const list = sightingsByCs.get(cs) || [];
      list.push(sighting);
      sightingsByCs.set(cs, list);
    }
  }

  /* ── Split sightings into individual flight legs ──────────── */
  const tracked: TrackedFlight[] = [];

  for (const [cs, rawSightings] of sightingsByCs) {
    // Sort by time, deduplicate near-identical timestamps
    const sightings = rawSightings
      .sort((a, b) => a.ts - b.ts)
      .filter((s, i, arr) => i === 0 || s.ts - arr[i - 1].ts > 5);

    // Split into legs whenever there is a gap ≥ GAP_MINUTES
    const legs: Sighting[][] = [];
    let current: Sighting[] = [];

    for (const s of sightings) {
      if (current.length > 0 && s.ts - current[current.length - 1].ts > GAP_MINUTES * 60) {
        if (current.length > 0) legs.push(current);
        current = [];
      }
      current.push(s);
    }
    if (current.length > 0) legs.push(current);

    for (const leg of legs) {
      if (leg.length < 2) continue;

      const first = leg[0];
      const last = leg[leg.length - 1];
      const durationMin = Math.round((last.ts - first.ts) / 60);

      if (durationMin < MIN_TRACKED_MINUTES) continue;

      // Find first airborne sighting (alt > 0) as actual departure point
      const firstAirborne = leg.find((s) => s.altFt !== null && s.altFt > 500) || first;
      // Last sighting
      const isLanded = last.altFt === null || last.altFt < 2000;
      // The gap-ended legs: if last ping was >GAP_MINUTES ago → assume landed
      const nowSec = Math.floor(Date.now() / 1000);
      const staleSec = nowSec - last.ts;
      const isStale = staleSec > GAP_MINUTES * 60;
      const status: TrackedFlight["status"] = isLanded || isStale ? "landed" : "in_flight";

      // Resolve dep/arr: prefer values from sightings that have them
      const dep = leg.find((s) => s.dep)?.dep || null;
      const arr = leg.find((s) => s.arr)?.arr || null;

      const reg = leg.find((s) => s.reg)?.reg || cs;
      const type = leg.find((s) => s.type)?.type || "";
      const icao24 = leg.find((s) => s.icao24)?.icao24 || "";

      const actualDurationMin = durationMin;
      const expectedDurationMin = expectedMinutes(dep, arr);
      const distanceKm = dep && arr && AIRPORT_COORDS[dep] && AIRPORT_COORDS[arr]
        ? Math.round(haversineKm(AIRPORT_COORDS[dep], AIRPORT_COORDS[arr]))
        : null;

      let delayMin: number | null = null;
      if (expectedDurationMin !== null && status === "landed") {
        delayMin = Math.max(0, actualDurationMin - expectedDurationMin);
        // Cap at 3h — anything above is likely a data artifact (mid-flight start)
        if (delayMin > 180) delayMin = null;
      }

      tracked.push({
        callsign: cs,
        icao24,
        registration: reg,
        aircraftType: type,
        estDepartureAirport: dep,
        estArrivalAirport: arr,
        firstSeen: firstAirborne.ts,
        lastSeen: last.ts,
        actualDurationMin,
        expectedDurationMin,
        delayMin,
        status,
        distanceKm,
        dataPoints: leg.length,
      });
    }
  }

  return tracked.sort((a, b) => b.firstSeen - a.firstSeen);
}
