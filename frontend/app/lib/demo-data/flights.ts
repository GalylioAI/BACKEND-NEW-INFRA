import { getStaticFlights } from "../vols-data";
import { demoAsync } from "./async";

export interface DemoLiveFlight {
  hex: string;
  flight?: string;
  r?: string;
  t?: string;
  lat?: number;
  lon?: number;
  alt_baro?: number | string;
  gs?: number;
  track?: number;
  baro_rate?: number;
  squawk?: string;
  depAirport?: string;
  arrAirport?: string;
  routeDataSource?: string;
  routeSourceUpdatedAt?: number;
  dataSource?: string;
  sourceArea?: string;
  sourceUpdatedAt?: number;
  capturedAt?: number;
  seen?: number;
  messages?: number;
}

export interface DemoHistoryFlight {
  callsign: string;
  icao24: string;
  registration: string;
  aircraftType: string;
  estDepartureAirport: string | null;
  estArrivalAirport: string | null;
  firstSeen: number;
  lastSeen: number;
  actualDurationMin: number;
  expectedDurationMin: number | null;
  delayMin: number | null;
  status: "landed" | "in_flight" | "unknown";
  distanceKm: number | null;
  dataPoints: number;
}

const AIRPORT_COORDS: Record<string, [number, number]> = {
  DTTA: [36.851, 10.227],
  DTTJ: [33.875, 10.776],
  DTMB: [35.758, 10.755],
  DTTX: [34.718, 10.691],
  LFPG: [49.01, 2.548],
  LFPO: [48.723, 2.379],
  LFLL: [45.726, 5.081],
  LFML: [43.437, 5.215],
  EDDF: [50.038, 8.562],
  EGLL: [51.47, -0.454],
  LTFM: [41.275, 28.752],
  LIRF: [41.8, 12.239],
  LIMC: [45.631, 8.728],
  EHAM: [52.311, 4.768],
  LSZH: [47.458, 8.556],
  EBBR: [50.901, 4.484],
};

function interpolate(dep: string | null, arr: string | null, progress: number) {
  const a = dep ? AIRPORT_COORDS[dep] : undefined;
  const b = arr ? AIRPORT_COORDS[arr] : undefined;
  if (!a || !b) return { lat: 36.85, lon: 10.22 };
  return {
    lat: a[0] + (b[0] - a[0]) * progress,
    lon: a[1] + (b[1] - a[1]) * progress,
  };
}

function expectedMinutes(dep: string | null, arr: string | null) {
  if (!dep || !arr) return null;
  const a = AIRPORT_COORDS[dep];
  const b = AIRPORT_COORDS[arr];
  if (!a || !b) return null;
  const dx = a[0] - b[0];
  const dy = a[1] - b[1];
  return Math.round(Math.sqrt(dx * dx + dy * dy) * 60 + 60);
}

export function getDemoLiveFlights() {
  const now = Date.now();
  const flights = getStaticFlights()
    .slice(0, 14)
    .map((flight, index): DemoLiveFlight => {
      const progress = Math.min(
        0.92,
        Math.max(0.08, ((Date.now() / 60_000 + index * 11) % 100) / 100),
      );
      const point = interpolate(
        flight.estDepartureAirport,
        flight.estArrivalAirport,
        progress,
      );
      const inAir = index % 5 !== 0;
      return {
        hex: flight.icao24 || `demo${index}`,
        flight: flight.callsign,
        r: flight.icao24.toUpperCase(),
        t: flight.aircraftType,
        lat: point.lat,
        lon: point.lon,
        alt_baro: inAir ? 17_000 + index * 900 : "ground",
        gs: inAir ? 390 + index * 6 : 0,
        track: (35 + index * 27) % 360,
        baro_rate: inAir ? (index % 2 === 0 ? 640 : -420) : 0,
        squawk: `20${index.toString().padStart(2, "0")}`,
        depAirport: flight.estDepartureAirport || undefined,
        arrAirport: flight.estArrivalAirport || undefined,
        routeDataSource: "Demo schedule",
        routeSourceUpdatedAt: now,
        dataSource: "Local demo data",
        sourceArea: "Tunisia and Europe",
        sourceUpdatedAt: now - index * 20_000,
        capturedAt: now,
        seen: index * 2,
        messages: 1200 + index * 74,
      };
    });

  return demoAsync({
    tunisair: flights.filter((flight) => flight.flight?.startsWith("TAR")),
    nouvelair: flights.filter((flight) => flight.flight?.startsWith("LBT")),
    total: flights.length,
    timestamp: now,
    sources: [
      {
        name: "Local demo data",
        area: "Tunisia schedule",
        total: flights.length,
        matched: flights.length,
        ok: true,
        updatedAt: now,
      },
    ],
  });
}

export function getDemoHistoryFlights() {
  const flights: DemoHistoryFlight[] = getStaticFlights()
    .slice(0, 34)
    .map((flight, index) => {
      const expected = expectedMinutes(
        flight.estDepartureAirport,
        flight.estArrivalAirport,
      );
      const actual = expected ? expected + flight.delayMin : 90 + index;
      return {
        callsign: flight.callsign,
        icao24: flight.icao24,
        registration: flight.icao24.toUpperCase(),
        aircraftType: flight.aircraftType,
        estDepartureAirport: flight.estDepartureAirport,
        estArrivalAirport: flight.estArrivalAirport,
        firstSeen: flight.firstSeen,
        lastSeen: flight.lastSeen,
        actualDurationMin: actual,
        expectedDurationMin: expected,
        delayMin: flight.delayMin,
        status: "landed",
        distanceKm: expected ? Math.round((expected - 30) * 13.5) : null,
        dataPoints: 18 + index,
      };
    });

  return demoAsync({
    flights,
    source: "local-demo",
    timestamp: Date.now(),
    total: flights.length,
    page: 1,
    totalPages: 1,
  });
}
