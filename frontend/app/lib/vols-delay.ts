import type { Fr24HistoryFlight, Fr24LiveFlight } from "@/lib/fr24";
import { getStaticFlights } from "@/lib/vols-data";

type ScheduleCandidate = {
  callsign: string;
  dep: string | null;
  arr: string | null;
  depHour: number;
  depMin: number;
  arrHour: number;
  arrMin: number;
  durationSec: number;
};

const schedule = getStaticFlights().map((flight): ScheduleCandidate => {
  const departure = new Date(flight.firstSeen * 1000);
  const arrival = new Date(flight.lastSeen * 1000);

  return {
    callsign: flight.callsign.toUpperCase(),
    dep: flight.estDepartureAirport,
    arr: flight.estArrivalAirport,
    depHour: departure.getUTCHours(),
    depMin: departure.getUTCMinutes(),
    arrHour: arrival.getUTCHours(),
    arrMin: arrival.getUTCMinutes(),
    durationSec: Math.max(0, flight.lastSeen - flight.firstSeen),
  };
});

function sameRoute(candidate: ScheduleCandidate, dep?: string | null, arr?: string | null) {
  return (!dep || candidate.dep === dep) && (!arr || candidate.arr === arr);
}

function airlinePrefix(callsign?: string) {
  const cs = callsign?.toUpperCase() || "";
  if (cs.startsWith("TAR")) return "TAR";
  if (cs.startsWith("LBT")) return "LBT";
  return null;
}

function candidatesFor(callsign?: string, dep?: string | null, arr?: string | null) {
  const normalized = callsign?.toUpperCase();
  if (!normalized) return [];

  // 1. Exact callsign + route
  const exact = schedule.filter((c) => c.callsign === normalized && sameRoute(c, dep, arr));
  if (exact.length > 0) return exact;

  // 2. Exact callsign (any route)
  const byCallsign = schedule.filter((c) => c.callsign === normalized);
  if (byCallsign.length > 0) return byCallsign;

  // 3. Same airline prefix + same route (real FR24 callsign doesn't match static schedule)
  const prefix = airlinePrefix(normalized);
  if (prefix && dep && arr) {
    const byRoute = schedule.filter((c) => c.callsign.startsWith(prefix) && c.dep === dep && c.arr === arr);
    if (byRoute.length > 0) return byRoute;
  }

  // 4. Same airline prefix + departure airport only
  if (prefix && dep) {
    const byDep = schedule.filter((c) => c.callsign.startsWith(prefix) && c.dep === dep);
    if (byDep.length > 0) return byDep;
  }

  return [];
}

function plannedTime(anchorSec: number, hour: number, minute: number, preferPast: boolean) {
  const anchor = new Date(anchorSec * 1000);
  const base = Date.UTC(anchor.getUTCFullYear(), anchor.getUTCMonth(), anchor.getUTCDate(), hour, minute, 0);
  const options = [base - 86400_000, base, base + 86400_000].map((value) => Math.floor(value / 1000));

  return options.sort((a, b) => {
    const aDistance = Math.abs(anchorSec - a);
    const bDistance = Math.abs(anchorSec - b);
    if (aDistance !== bDistance) return aDistance - bDistance;
    if (preferPast) return b - a;
    return a - b;
  })[0];
}

function bestByDelay(anchorSec: number, candidates: ScheduleCandidate[], mode: "departure" | "arrival") {
  if (candidates.length === 0) return undefined;

  return candidates
    .map((candidate) => {
      const planned = mode === "departure"
        ? plannedTime(anchorSec, candidate.depHour, candidate.depMin, true)
        : plannedTime(anchorSec, candidate.arrHour, candidate.arrMin, false);
      return { candidate, planned, distance: Math.abs(anchorSec - planned) };
    })
    .sort((a, b) => a.distance - b.distance)[0];
}

// Max gap between actual and scheduled departure to consider it a delay (not a different rotation)
const MAX_DELAY_MATCH_SEC = 90 * 60;

export function estimateHistoryDelay(flight: Fr24HistoryFlight): Fr24HistoryFlight {
  if (flight.delayMin !== undefined) return flight;

  const candidates = candidatesFor(flight.callsign, flight.estDepartureAirport, flight.estArrivalAirport);
  const best = bestByDelay(flight.firstSeen, candidates, "departure");
  if (!best || best.distance > MAX_DELAY_MATCH_SEC) return flight;

  const plannedDeparture = best.planned;
  const plannedArrival = plannedDeparture + best.candidate.durationSec;

  return {
    ...flight,
    delayMin: Math.max(0, Math.round((flight.firstSeen - plannedDeparture) / 60)),
    delayBasis: "schedule-baseline-vs-fr24-takeoff",
    plannedDeparture,
    plannedArrival,
    actualDeparture: flight.firstSeen,
    actualArrival: flight.lastSeen,
  };
}

export function estimateLiveDelay(flight: Fr24LiveFlight): Fr24LiveFlight {
  if (!flight.eta) return flight;

  const estimatedArrival = Math.floor(Date.parse(flight.eta) / 1000);
  if (!Number.isFinite(estimatedArrival)) return flight;

  const candidates = candidatesFor(flight.flight, flight.depAirport, flight.arrAirport);
  const best = bestByDelay(estimatedArrival, candidates, "arrival");
  if (!best || best.distance > MAX_DELAY_MATCH_SEC) return { ...flight, estimatedArrival };

  return {
    ...flight,
    delayMin: Math.max(0, Math.round((estimatedArrival - best.planned) / 60)),
    delayBasis: "schedule-baseline-vs-fr24-live-eta",
    plannedDeparture: best.planned - best.candidate.durationSec,
    plannedArrival: best.planned,
    estimatedArrival,
  };
}
