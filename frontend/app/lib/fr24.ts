const FR24_BASE_URL = "https://fr24api.flightradar24.com/api";

export type Fr24QuerySource = {
  name: string;
  label: string;
  endpoint: string;
  params: Record<string, string | number | undefined>;
};

export type Fr24SourceStat = {
  name: string;
  area: string;
  total: number;
  matched: number;
  updatedAt?: number;
  ok: boolean;
  status?: number;
  message?: string;
};

export type Fr24LiveFlight = {
  hex: string;
  fr24Id?: string;
  flight?: string;
  r?: string;
  t?: string;
  desc?: string;
  route?: string;
  depAirport?: string;
  arrAirport?: string;
  dataSource?: string;
  sourceArea?: string;
  sourceUpdatedAt?: number;
  capturedAt?: number;
  alt_baro?: number | string;
  alt_geom?: number;
  gs?: number;
  track?: number;
  true_heading?: number;
  baro_rate?: number;
  squawk?: string;
  lat?: number;
  lon?: number;
  seen?: number;
  eta?: string;
  delayMin?: number;
  delayBasis?: string;
  plannedDeparture?: number;
  plannedArrival?: number;
  estimatedArrival?: number;
};

export type Fr24HistoryFlight = {
  callsign: string;
  icao24: string;
  estDepartureAirport: string | null;
  estArrivalAirport: string | null;
  firstSeen: number;
  lastSeen: number;
  aircraftType?: string;
  status?: string;
  flightEnded?: boolean;
  flightTimeSec?: number;
  delayMin?: number;
  delayBasis?: string;
  plannedDeparture?: number;
  plannedArrival?: number;
  actualDeparture?: number;
  actualArrival?: number;
};

type UnknownRecord = Record<string, unknown>;

function token() {
  return process.env.FR24_API_TOKEN || process.env.FLIGHTRADAR_API_KEY || "";
}

export function hasFr24Token() {
  return Boolean(token());
}

function value(record: UnknownRecord, keys: string[]) {
  for (const key of keys) {
    const current = record[key];
    if (current !== undefined && current !== null && current !== "") return current;
  }
  return undefined;
}

function stringValue(record: UnknownRecord, keys: string[]) {
  const current = value(record, keys);
  return typeof current === "string" || typeof current === "number" ? String(current).trim() : undefined;
}

function numberValue(record: UnknownRecord, keys: string[]) {
  const current = value(record, keys);
  if (typeof current === "number" && Number.isFinite(current)) return current;
  if (typeof current === "string" && current.trim() !== "") {
    const parsed = Number(current);
    if (Number.isFinite(parsed)) return parsed;
  }
  return undefined;
}

function upper(value?: string) {
  return value?.trim().toUpperCase() || undefined;
}

function timestampMs(value: unknown, fallback = Date.now()) {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value < 10_000_000_000 ? value * 1000 : value;
  }

  if (typeof value === "string" && value.trim()) {
    const parsed = Date.parse(value);
    if (Number.isFinite(parsed)) return parsed;
  }

  return fallback;
}

function timestampSec(value: unknown) {
  return Math.floor(timestampMs(value) / 1000);
}

function optionalTimestampSec(value: unknown) {
  if (value === undefined || value === null || value === "") return undefined;
  return timestampSec(value);
}

function extractArray(payload: unknown): UnknownRecord[] {
  if (Array.isArray(payload)) return payload.filter(isRecord);
  if (!isRecord(payload)) return [];

  for (const key of ["data", "flights", "result", "items"]) {
    const current = payload[key];
    if (Array.isArray(current)) return current.filter(isRecord);
  }

  return [];
}

function isRecord(value: unknown): value is UnknownRecord {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function buildUrl(endpoint: string, params: Record<string, string | number | undefined>) {
  const url = new URL(`${FR24_BASE_URL}${endpoint}`);

  for (const [key, current] of Object.entries(params)) {
    if (current !== undefined && current !== "") {
      url.searchParams.set(key, String(current));
    }
  }

  return url;
}

async function fr24Fetch(endpoint: string, params: Record<string, string | number | undefined>) {
  const apiToken = token();
  if (!apiToken) {
    return {
      ok: false,
      status: 401,
      payload: { message: "Missing FR24_API_TOKEN" },
    };
  }

  const response = await fetch(buildUrl(endpoint, params), {
    cache: "no-store",
    headers: {
      Accept: "application/json",
      "Accept-Version": "v1",
      Authorization: `Bearer ${apiToken}`,
    },
    signal: AbortSignal.timeout(10000),
  });

  const text = await response.text();
  let payload: unknown = {};

  try {
    payload = text ? JSON.parse(text) : {};
  } catch {
    payload = { raw: text };
  }

  return { ok: response.ok, status: response.status, payload };
}

export function isTargetAirline(flight?: string) {
  const callsign = flight?.trim().toUpperCase() || "";
  return callsign.startsWith("TAR") || callsign.startsWith("LBT");
}

export function normalizeLiveFlight(row: UnknownRecord, source: Fr24QuerySource, capturedAt = Date.now()): Fr24LiveFlight | null {
  const callsign = upper(stringValue(row, ["callsign", "flight", "flight_number", "number"]));
  const hex = upper(stringValue(row, ["hex", "icao24", "mode_s", "icao_address"])) || callsign;

  if (!hex && !callsign) return null;

  const departure = upper(stringValue(row, ["orig_icao", "origin_icao", "from_icao", "dep_icao", "orig_iata", "origin_iata", "from_iata"]));
  const arrival = upper(stringValue(row, ["dest_icao", "destination_icao", "to_icao", "arr_icao", "dest_iata", "destination_iata", "to_iata"]));
  const sourceUpdatedAt = timestampMs(value(row, ["timestamp", "last_update", "updated_at"]), capturedAt);
  const registration = upper(stringValue(row, ["reg", "registration", "aircraft_registration"]));
  const aircraftType = upper(stringValue(row, ["type", "typecode", "aircraft_type", "aircraft_icao", "equipment"]));

  return {
    hex: hex || "UNKNOWN",
    fr24Id: stringValue(row, ["fr24_id", "flight_id", "id"]),
    flight: callsign,
    r: registration,
    t: aircraftType,
    desc: stringValue(row, ["aircraft_model", "aircraft", "model"]),
    route: departure && arrival ? `${departure}-${arrival}` : undefined,
    depAirport: departure,
    arrAirport: arrival,
    dataSource: "fr24",
    sourceArea: source.label,
    sourceUpdatedAt,
    capturedAt,
    alt_baro: numberValue(row, ["alt", "altitude", "alt_baro"]) ?? (row.ground ? "ground" : undefined),
    alt_geom: numberValue(row, ["alt_geom", "altitude_geom"]),
    gs: numberValue(row, ["gspeed", "ground_speed", "gs"]),
    track: numberValue(row, ["track", "heading"]),
    true_heading: numberValue(row, ["true_heading"]),
    baro_rate: numberValue(row, ["vspeed", "vertical_speed", "baro_rate"]),
    squawk: stringValue(row, ["squawk"]),
    lat: numberValue(row, ["lat", "latitude"]),
    lon: numberValue(row, ["lon", "lng", "longitude"]),
    seen: numberValue(row, ["seen"]),
    eta: stringValue(row, ["eta"]),
  };
}

export async function fetchFr24Live(sources: Fr24QuerySource[]) {
  const capturedAt = Date.now();
  const responses = await Promise.all(
    sources.map(async (source) => {
      try {
        const response = await fr24Fetch(source.endpoint, source.params);
        const rows = extractArray(response.payload);
        const flights = rows
          .map((row) => normalizeLiveFlight(row, source, capturedAt))
          .filter((flight): flight is Fr24LiveFlight => Boolean(flight));
        const matched = flights.filter((flight) => isTargetAirline(flight.flight)).length;

        return {
          flights,
          source: {
            name: source.name,
            area: source.label,
            total: rows.length,
            matched,
            updatedAt: capturedAt,
            ok: response.ok,
            status: response.status,
            message: isRecord(response.payload) ? stringValue(response.payload, ["message", "details"]) : undefined,
          } satisfies Fr24SourceStat,
        };
      } catch (error) {
        return {
          flights: [],
          source: {
            name: source.name,
            area: source.label,
            total: 0,
            matched: 0,
            updatedAt: capturedAt,
            ok: false,
            message: error instanceof Error ? error.message : "FR24 request failed",
          } satisfies Fr24SourceStat,
        };
      }
    }),
  );

  const byKey = new Map<string, Fr24LiveFlight>();

  for (const flight of responses.flatMap((response) => response.flights)) {
    const key = `${flight.fr24Id || ""}:${flight.hex || ""}:${flight.flight || ""}`;
    const current = byKey.get(key);
    if (!current || (flight.sourceUpdatedAt || 0) > (current.sourceUpdatedAt || 0)) {
      byKey.set(key, flight);
    }
  }

  return {
    flights: [...byKey.values()].sort((a, b) => (a.flight || a.hex).localeCompare(b.flight || b.hex)),
    sources: responses.map((response) => response.source),
  };
}

function normalizeSummaryFlight(row: UnknownRecord): Fr24HistoryFlight | null {
  const callsign = upper(stringValue(row, ["callsign", "flight", "flight_number"]));
  if (!callsign) return null;

  const flightEnded = row["flight_ended"] === true;
  const flightTimeSec = numberValue(row, ["flight_time"]) ?? undefined;

  // Only use actual times when flight has ended — otherwise they are null or unreliable last-ping times
  const actualDeparture = optionalTimestampSec(value(row, ["datetime_takeoff"]));
  const actualArrival = flightEnded ? optionalTimestampSec(value(row, ["datetime_landed"])) : undefined;

  const scheduledDeparture = optionalTimestampSec(value(row, ["scheduled_departure", "STD"]));
  const scheduledArrival = optionalTimestampSec(value(row, ["scheduled_arrival", "STA"]));

  // firstSeen = actual takeoff if known, else first radar contact
  const firstSeen = actualDeparture
    ?? optionalTimestampSec(value(row, ["first_seen"]))
    ?? Math.floor(Date.now() / 1000);

  // lastSeen = actual landing if flight ended + landed, else estimate from flight_time, else firstSeen only
  let lastSeen = firstSeen;
  if (flightEnded && actualArrival !== undefined) {
    lastSeen = actualArrival;
  } else if (actualDeparture !== undefined && flightTimeSec !== undefined && flightTimeSec > 0) {
    lastSeen = actualDeparture + flightTimeSec;
  }

  let delayMin: number | undefined;
  if (actualDeparture !== undefined && scheduledDeparture !== undefined) {
    delayMin = Math.max(0, Math.round((actualDeparture - scheduledDeparture) / 60));
  } else if (flightEnded && actualArrival !== undefined && scheduledArrival !== undefined) {
    delayMin = Math.max(0, Math.round((actualArrival - scheduledArrival) / 60));
  }

  const dep = upper(stringValue(row, ["orig_icao", "orig_iata"])) || null;
  const arr = upper(stringValue(row, ["dest_icao_actual", "dest_icao", "dest_iata_actual", "dest_iata"])) || null;

  return {
    callsign,
    icao24: upper(stringValue(row, ["reg", "hex"])) || "-",
    estDepartureAirport: dep,
    estArrivalAirport: arr,
    firstSeen,
    lastSeen: Math.max(lastSeen, firstSeen),
    aircraftType: upper(stringValue(row, ["type"])),
    status: flightEnded ? "landed" : "en_vol",
    flightEnded,
    flightTimeSec,
    delayMin,
    delayBasis: delayMin !== undefined ? "fr24-summary-scheduled-vs-actual" : undefined,
    plannedDeparture: scheduledDeparture,
    plannedArrival: scheduledArrival,
    actualDeparture,
    actualArrival,
  };
}

export async function fetchFr24Summary(params: Record<string, string | number | undefined>) {
  const response = await fr24Fetch("/flight-summary/full", params);
  const rows = extractArray(response.payload);

  return {
    ok: response.ok,
    status: response.status,
    message: isRecord(response.payload) ? stringValue(response.payload, ["message", "details"]) : undefined,
    flights: rows
      .map(normalizeSummaryFlight)
      .filter((flight): flight is Fr24HistoryFlight => Boolean(flight))
      .filter((flight) => isTargetAirline(flight.callsign)),
  };
}

export async function fetchFr24Reference() {
  const queries = [
    { key: "airport:TUN", endpoint: "/static/airports/TUN/full" },
    { key: "airport:DJE", endpoint: "/static/airports/DJE/full" },
    { key: "airport:MIR", endpoint: "/static/airports/MIR/full" },
    { key: "airport:SFA", endpoint: "/static/airports/SFA/full" },
    { key: "airline:TAR", endpoint: "/static/airlines/TAR/light" },
    { key: "airline:LBT", endpoint: "/static/airlines/LBT/light" },
  ];

  const entries = await Promise.all(
    queries.map(async (query) => {
      const response = await fr24Fetch(query.endpoint, {});
      return {
        key: query.key,
        ok: response.ok,
        status: response.status,
        data: response.payload,
      };
    }),
  );

  return { entries, timestamp: Date.now() };
}

type TunisiaAirportSeed = {
  iata: string;
  icao: string;
  label: string;
};

const TUNISIA_AIRPORT_SEEDS: TunisiaAirportSeed[] = [
  { iata: "TUN", icao: "DTTA", label: "Tunis-Carthage" },
  { iata: "DJE", icao: "DTTJ", label: "Djerba-Zarzis" },
  { iata: "MIR", icao: "DTMB", label: "Monastir Habib Bourguiba" },
  { iata: "SFA", icao: "DTTX", label: "Sfax-Thyna" },
  { iata: "NBE", icao: "DTNH", label: "Enfidha-Hammamet" },
  { iata: "TOE", icao: "DTTZ", label: "Tozeur-Nefta" },
  { iata: "TBJ", icao: "DTKA", label: "Tabarka-Ain Draham" },
  { iata: "GAF", icao: "DTTF", label: "Gafsa-Ksar" },
];

export async function fetchTunisiaAirports() {
  const entries = await Promise.all(
    TUNISIA_AIRPORT_SEEDS.map(async (airport) => {
      const response = await fr24Fetch(`/static/airports/${airport.iata}/full`, {});
      return {
        ...airport,
        ok: response.ok,
        status: response.status,
        data: response.payload,
      };
    }),
  );

  return {
    country: "TN",
    entries,
    total: entries.length,
    loaded: entries.filter((entry) => entry.ok).length,
    timestamp: Date.now(),
  };
}
