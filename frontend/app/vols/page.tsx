"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";

const AIRCRAFT: Record<string, string> = {
  A19N: "Airbus A319neo", A319: "Airbus A319",
  A20N: "Airbus A320neo", A320: "Airbus A320",
  A21N: "Airbus A321neo", A321: "Airbus A321",
  A332: "Airbus A330-200", A333: "Airbus A330-300",
  B736: "Boeing 737-600", B737: "Boeing 737-700",
  B738: "Boeing 737-800", B739: "Boeing 737-900",
  AT43: "ATR 42-300", AT45: "ATR 42-500", AT46: "ATR 42-600",
  AT72: "ATR 72", AT75: "ATR 72-500", AT76: "ATR 72-600",
};

const AIRPORTS: Record<string, string> = {
  DTTA: "Tunis-Carthage", DTTJ: "Djerba-Zarzis", DTMB: "Monastir",
  DTTX: "Sfax-Thyna", LFPG: "Paris CDG", LFPO: "Paris Orly",
  LFLL: "Lyon St-Exupery", LFML: "Marseille Provence",
  EGLL: "London Heathrow", LTFM: "Istanbul IST", LTBA: "Istanbul ATK",
  LIRF: "Rome Fiumicino", LIMC: "Milan Malpensa",
  EDDF: "Frankfurt", EHAM: "Amsterdam Schiphol",
  LSZH: "Geneve", EBBR: "Bruxelles", OERK: "Riyad",
};

interface LiveFlight {
  hex: string;
  flight?: string;
  r?: string;
  t?: string;
  desc?: string;
  route?: string;
  depAirport?: string;
  arrAirport?: string;
  routeDataSource?: string;
  routeSourceUpdatedAt?: number;
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
  seen_pos?: number;
  messages?: number;
  _al?: "TAR" | "LBT";
}

interface HistoryFlight {
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

interface LiveData {
  tunisair: LiveFlight[];
  nouvelair: LiveFlight[];
  total?: number;
  timestamp: number;
  sources?: SourceStat[];
}

interface HistoryData {
  flights: HistoryFlight[];
  source: string;
  timestamp: number;
  total: number;
  page: number;
  totalPages: number;
}

interface SourceStat {
  name: string;
  area: string;
  total: number;
  matched: number;
  updatedAt?: number;
  ok: boolean;
  status?: number;
  message?: string;
}

type Airline = "all" | "TAR" | "LBT";
type View = "live" | "history" | "delays" | "fleet";

const airlineOfLive = (f: LiveFlight) => {
  const cs = (f.flight || "").trim().toUpperCase();
  return cs.startsWith("TAR") ? "TAR" : cs.startsWith("LBT") ? "LBT" : "OTHER";
};

const histAirline = (cs: string): "TAR" | "LBT" =>
  cs.trim().toUpperCase().startsWith("LBT") ? "LBT" : "TAR";

const isGrounded = (alt?: number | string) =>
  alt === "ground" || alt === 0 || alt === undefined || alt === null;

const altFt = (alt?: number | string) => {
  if (isGrounded(alt)) return "Au sol";
  const n = Number(alt);
  return Number.isNaN(n) ? "Au sol" : `${n.toLocaleString("fr")} ft`;
};

const speedKmh = (gs?: number) => gs != null ? `${Math.round(gs * 1.852)} km/h` : "-";

const track2dir = (t?: number) => {
  if (t === undefined) return "";
  return ["N", "NE", "E", "SE", "S", "SO", "O", "NO"][Math.round(t / 45) % 8];
};

const csDisplay = (callsign?: string, fallback = "") => {
  const cs = (callsign || "").trim();
  if (!cs) return fallback.toUpperCase();
  const m = cs.match(/^(TAR|LBT)(\d+)$/i);
  if (m) return `${m[1].toUpperCase() === "TAR" ? "TU" : "BJ"}-${m[2]}`;
  return cs;
};

const flightStatus = (f: LiveFlight) => {
  if (isGrounded(f.alt_baro)) return { label: "Au sol", color: "#94A3B8", bg: "rgba(148,163,184,0.10)" };
  const n = Number(f.alt_baro);
  if (n < 4000) return { label: "Approche", color: "#F59E0B", bg: "rgba(245,158,11,0.10)" };
  return { label: "En vol", color: "#3BDEB9", bg: "rgba(59,222,185,0.10)" };
};

const fmtTime = (u: number) =>
  new Date(u * 1000).toLocaleTimeString("fr-TN", { hour: "2-digit", minute: "2-digit" });

const fmtDate = (u: number) =>
  new Date(u * 1000).toLocaleDateString("fr-TN", { day: "2-digit", month: "short" });

const fmtDateTime = (u: number) =>
  new Date(u * 1000).toLocaleString("fr-TN", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });

const fmtDateTimeMs = (ms?: number) =>
  ms
    ? new Date(ms).toLocaleString("fr-TN", {
        day: "2-digit",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
      })
    : "-";

const fmtMinutes = (m: number) => {
  if (!Number.isFinite(m) || m <= 0) return "0 min";
  if (m < 60) return `${Math.round(m)} min`;
  return `${Math.floor(m / 60)}h${String(Math.round(m % 60)).padStart(2, "0")}`;
};

const airportLbl = (icao: string | null) => icao ? (AIRPORTS[icao] || icao) : "-";
const acName = (t?: string, desc?: string) => desc || (t ? (AIRCRAFT[t] || t) : "-");

// suppress unused warning — kept for potential future use
void fmtTime;
void fmtDate;

function AirlinePill({ code }: { code: "TAR" | "LBT" | "OTHER" }) {
  const cfg = code === "TAR"
    ? { label: "Tunisair", bg: "#DC2626" }
    : code === "LBT"
      ? { label: "Nouvelair", bg: "#1D4ED8" }
      : { label: "-", bg: "#374151" };

  return (
    <span className="airline-pill" style={{ background: cfg.bg }}>
      {cfg.label}
    </span>
  );
}

function DelayBadge({ min }: { min?: number }) {
  if (!min || min <= 0) return <span className="delay-badge good">A l&apos;heure</span>;
  if (min > 30) return <span className="delay-badge bad">+{min} min</span>;
  return <span className="delay-badge warn">+{min} min</span>;
}

function StatCard({ n, l, c, sub }: { n: string | number; l: string; c: string; sub?: string }) {
  return (
    <div className="vstat">
      <div className="vstat-n" style={{ color: c }}>{n}</div>
      <div className="vstat-l">{l}</div>
      {sub && <div className="vstat-sub">{sub}</div>}
    </div>
  );
}

function InfoLine({ label, value, source }: { label: string; value: string | number; source?: string }) {
  return (
    <div className="info-line">
      <span>{label}</span>
      <strong>
        <span>{value}</span>
        {source && <small>Source: {source}</small>}
      </strong>
    </div>
  );
}

function FlightCard({ f, selected, onSelect }: { f: LiveFlight; selected: boolean; onSelect: () => void }) {
  const airline = airlineOfLive(f);
  const st = flightStatus(f);
  const grounded = isGrounded(f.alt_baro);

  return (
    <button className={`vc-card${selected ? " selected" : ""}`} onClick={onSelect} type="button">
      <div className="vc-top">
        <AirlinePill code={airline} />
        <span className="muted-small">{track2dir(f.track)} {f.track != null ? `${Math.round(f.track)} deg` : ""}</span>
      </div>
      <div className="vc-title">{csDisplay(f.flight, f.hex)}</div>
      <InfoLine label="Appareil" value={acName(f.t, f.desc)} />
      <InfoLine label="Immat." value={f.r || f.hex.toUpperCase()} />
      <div className="vc-metrics">
        <span>{altFt(f.alt_baro)}</span>
        <span>{speedKmh(f.gs)}</span>
      </div>
      <div className="vc-bottom">
        <span className="status-pill" style={{ color: st.color, background: st.bg }}>{st.label}</span>
        <span className="muted-small">{grounded ? "surface" : `${Math.round(f.baro_rate || 0)} ft/min`}</span>
      </div>
      <div className="data-stamp">{f.dataSource || "opensky"} - {fmtDateTimeMs(f.sourceUpdatedAt)}</div>
    </button>
  );
}

const TILE_SIZE = 256;
const DEFAULT_MAP_SIZE = { width: 1000, height: 560 };
const SATELLITE_TILE_URL = "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile";

const AIRPORT_COORDS: Record<string, { lat: number; lon: number; label: string }> = {
  DTTA: { lat: 36.8510, lon: 10.2272, label: "TUN" },
  DTTJ: { lat: 33.8750, lon: 10.7755, label: "DJE" },
  DTMB: { lat: 35.7581, lon: 10.7547, label: "MIR" },
  DTTX: { lat: 34.7179, lon: 10.6909, label: "SFA" },
  LFPG: { lat: 49.0097, lon: 2.5479, label: "CDG" },
  LFPO: { lat: 48.7233, lon: 2.3794, label: "ORY" },
  LFLL: { lat: 45.7256, lon: 5.0811, label: "LYS" },
  LFML: { lat: 43.4367, lon: 5.2150, label: "MRS" },
  EGLL: { lat: 51.4700, lon: -0.4543, label: "LHR" },
  LTFM: { lat: 41.2753, lon: 28.7519, label: "IST" },
  LTBA: { lat: 40.9769, lon: 28.8146, label: "IST" },
  LIRF: { lat: 41.8003, lon: 12.2389, label: "FCO" },
  LIMC: { lat: 45.6306, lon: 8.7281, label: "MXP" },
  EDDF: { lat: 50.0379, lon: 8.5622, label: "FRA" },
  EDDM: { lat: 48.3538, lon: 11.7861, label: "MUC" },
  EHAM: { lat: 52.3105, lon: 4.7683, label: "AMS" },
  LSZH: { lat: 47.4581, lon: 8.5555, label: "ZRH" },
  EBBR: { lat: 50.9014, lon: 4.4844, label: "BRU" },
  OERK: { lat: 24.9576, lon: 46.6988, label: "RUH" },
};

function latLonToWorld(lat: number, lon: number, zoom: number) {
  const scale = TILE_SIZE * 2 ** zoom;
  const sin = Math.sin((Math.max(-85.0511, Math.min(85.0511, lat)) * Math.PI) / 180);

  return {
    x: ((lon + 180) / 360) * scale,
    y: (0.5 - Math.log((1 + sin) / (1 - sin)) / (4 * Math.PI)) * scale,
  };
}

function mapCenter(flights: LiveFlight[], selectedHex?: string) {
  const selected = flights.find((f) => f.hex === selectedHex && f.lat != null && f.lon != null);
  if (selected?.lat != null && selected.lon != null) return { lat: selected.lat, lon: selected.lon };

  const positioned = flights.filter((f) => f.lat != null && f.lon != null);
  if (positioned.length === 0) return { lat: 38.2, lon: 10.6 };

  return {
    lat: positioned.reduce((sum, f) => sum + (f.lat || 0), 0) / positioned.length,
    lon: positioned.reduce((sum, f) => sum + (f.lon || 0), 0) / positioned.length,
  };
}

function buildTiles(center: { lat: number; lon: number }, zoom: number, mapSize: { width: number; height: number }) {
  const centerPx = latLonToWorld(center.lat, center.lon, zoom);
  const topLeft = {
    x: centerPx.x - mapSize.width / 2,
    y: centerPx.y - mapSize.height / 2,
  };
  const maxTile = 2 ** zoom;
  const tiles: Array<{ key: string; url: string; left: number; top: number }> = [];
  const startX = Math.floor(topLeft.x / TILE_SIZE);
  const endX = Math.floor((topLeft.x + mapSize.width) / TILE_SIZE);
  const startY = Math.floor(topLeft.y / TILE_SIZE);
  const endY = Math.floor((topLeft.y + mapSize.height) / TILE_SIZE);

  for (let x = startX; x <= endX; x += 1) {
    for (let y = startY; y <= endY; y += 1) {
      if (y < 0 || y >= maxTile) continue;
      const wrappedX = ((x % maxTile) + maxTile) % maxTile;
      tiles.push({
        key: `${zoom}-${wrappedX}-${y}-${x}`,
        url: `${SATELLITE_TILE_URL}/${zoom}/${y}/${wrappedX}`,
        left: x * TILE_SIZE - topLeft.x,
        top: y * TILE_SIZE - topLeft.y,
      });
    }
  }

  return { tiles, topLeft };
}

function screenPoint(lat: number, lon: number, zoom: number, topLeft: { x: number; y: number }) {
  const point = latLonToWorld(lat, lon, zoom);
  return { x: point.x - topLeft.x, y: point.y - topLeft.y };
}

function routePath(from: { x: number; y: number }, to: { x: number; y: number }) {
  const midX = (from.x + to.x) / 2;
  const midY = (from.y + to.y) / 2;
  const dx = to.x - from.x;
  const dy = to.y - from.y;
  const distance = Math.hypot(dx, dy);
  const bend = Math.min(110, Math.max(34, distance * 0.16));
  const control = {
    x: midX - (dy / Math.max(1, distance)) * bend,
    y: midY + (dx / Math.max(1, distance)) * bend,
  };

  return `M ${from.x.toFixed(1)} ${from.y.toFixed(1)} Q ${control.x.toFixed(1)} ${control.y.toFixed(1)} ${to.x.toFixed(1)} ${to.y.toFixed(1)}`;
}

function PlaneSilhouette() {
  return (
    <svg className="plane-svg" viewBox="0 0 64 64" aria-hidden="true">
      <path d="M32 3c2.3 0 4.2 1.9 4.2 4.2v14.5l22.1 13.2c1.2.7 2 2 2 3.4v4.4c0 1.2-1.2 2-2.3 1.5L36.2 36v12.7l8.1 6.1c.7.5 1.1 1.3 1.1 2.1v3.1c0 .9-.9 1.6-1.8 1.2L32 56.6 20.4 61.2c-.9.4-1.8-.3-1.8-1.2v-3.1c0-.8.4-1.6 1.1-2.1l8.1-6.1V36L6 44.2c-1.1.5-2.3-.3-2.3-1.5v-4.4c0-1.4.8-2.7 2-3.4l22.1-13.2V7.2C27.8 4.9 29.7 3 32 3Z" />
    </svg>
  );
}

function LiveMap({
  flights,
  selectedHex,
  onSelect,
}: {
  flights: LiveFlight[];
  selectedHex?: string;
  onSelect: (hex: string) => void;
}) {
  const [zoom, setZoom] = useState(5);
  const mapGridRef = useRef<HTMLDivElement | null>(null);
  const [mapSize, setMapSize] = useState(DEFAULT_MAP_SIZE);
  const plotted = flights.filter((f) => f.lat != null && f.lon != null);
  const selectedFlight = plotted.find((f) => f.hex === selectedHex) || plotted[0];
  const newestPacket = plotted.reduce((max, f) => Math.max(max, f.sourceUpdatedAt || 0), 0);
  const center = useMemo(() => mapCenter(plotted, selectedHex), [plotted, selectedHex]);
  const { tiles, topLeft } = useMemo(() => buildTiles(center, zoom, mapSize), [center, zoom, mapSize]);
  const route = selectedFlight?.depAirport && selectedFlight?.arrAirport
    ? {
        dep: AIRPORT_COORDS[selectedFlight.depAirport],
        arr: AIRPORT_COORDS[selectedFlight.arrAirport],
      }
    : null;

  useEffect(() => {
    const node = mapGridRef.current;
    if (!node) return;

    const updateSize = () => {
      const width = Math.max(320, Math.round(node.clientWidth));
      const height = Math.max(280, Math.round(node.clientHeight));
      setMapSize({ width, height });
    };

    updateSize();
    const observer = new ResizeObserver(updateSize);
    observer.observe(node);
    window.addEventListener("resize", updateSize);

    return () => {
      observer.disconnect();
      window.removeEventListener("resize", updateSize);
    };
  }, []);

  return (
    <div className="map-panel">
      <div className="map-grid" ref={mapGridRef}>
        <div className="tile-stage" style={{ width: mapSize.width, height: mapSize.height }}>
          {tiles.map((tile) => (
            <img
              alt=""
              aria-hidden="true"
              className="sat-tile"
              draggable={false}
              key={tile.key}
              src={tile.url}
              style={{ left: tile.left, top: tile.top }}
            />
          ))}
        </div>
        <div className="map-vignette" />
        <div className="map-labels">
          <span style={{ left: "51%", top: "66%" }}>TUN</span>
          <span style={{ left: "28%", top: "25%" }}>PAR</span>
          <span style={{ left: "35%", top: "44%" }}>MRS</span>
          <span style={{ left: "56%", top: "55%" }}>ROM</span>
          <span style={{ left: "91%", top: "51%" }}>IST</span>
        </div>
        <div className="map-radar" />
        {route?.dep && route.arr && selectedFlight?.lat != null && selectedFlight.lon != null && (
          <svg className="route-overlay" viewBox={`0 0 ${mapSize.width} ${mapSize.height}`} aria-hidden="true">
            {(() => {
              const dep = screenPoint(route.dep.lat, route.dep.lon, zoom, topLeft);
              const live = screenPoint(selectedFlight.lat as number, selectedFlight.lon as number, zoom, topLeft);
              const arr = screenPoint(route.arr.lat, route.arr.lon, zoom, topLeft);
              return (
                <>
                  <path className="route-path route-done" d={routePath(dep, live)} />
                  <path className="route-path route-left" d={routePath(live, arr)} />
                  <circle className="route-dot dep" cx={dep.x} cy={dep.y} r="5" />
                  <circle className="route-dot arr" cx={arr.x} cy={arr.y} r="5" />
                  <text className="route-label" x={dep.x + 9} y={dep.y - 9}>{route.dep.label}</text>
                  <text className="route-label" x={arr.x + 9} y={arr.y - 9}>{route.arr.label}</text>
                </>
              );
            })()}
          </svg>
        )}
        <div className="map-tools">
          <button type="button" onClick={() => setZoom((z) => Math.min(8, z + 1))}>+</button>
          <button type="button" onClick={() => setZoom((z) => Math.max(3, z - 1))}>-</button>
        </div>
        <div className="map-badge">Satellite live</div>
        {plotted.map((f) => {
          const point = latLonToWorld(f.lat as number, f.lon as number, zoom);
          const left = point.x - topLeft.x;
          const top = point.y - topLeft.y;
          if (left < -50 || left > mapSize.width + 50 || top < -50 || top > mapSize.height + 50) return null;
          const selected = selectedHex === f.hex;
          const airline = airlineOfLive(f);
          return (
            <button
              key={f.hex}
              className={`plane-marker ${airline.toLowerCase()}${selected ? " selected" : ""}`}
              onClick={() => onSelect(f.hex)}
              style={{ left: `${(left / mapSize.width) * 100}%`, top: `${(top / mapSize.height) * 100}%` }}
              title={csDisplay(f.flight, f.hex)}
              type="button"
            >
              <span className="plane-symbol" style={{ transform: `rotate(${(f.track || 0) - 45}deg)` }}>
                <PlaneSilhouette />
              </span>
              <span className="plane-label">{csDisplay(f.flight, f.hex)}</span>
            </button>
          );
        })}
      </div>
      <div className="map-foot">
        <span>{plotted.length} positions geolocalisees</span>
        <span>Derniere donnee: {fmtDateTimeMs(newestPacket || Date.now())}</span>
        <span>Imagery: Esri, Maxar, Earthstar Geographics, GIS User Community</span>
      </div>
    </div>
  );
}

function LiveDetails({ flight }: { flight?: LiveFlight }) {
  if (!flight) {
    return (
      <div className="detail-panel">
        <div className="panel-title">Aucun avion selectionne</div>
        <p className="soft-text">Les positions apparaissent quand les recepteurs ADS-B captent un vol cible.</p>
      </div>
    );
  }

  const airline = airlineOfLive(flight);
  const st = flightStatus(flight);
  const positionSource = `${flight.dataSource || "opensky"} / ${fmtDateTimeMs(flight.sourceUpdatedAt)}`;
  const routeSource = flight.routeDataSource
    ? `${flight.routeDataSource} / ${fmtDateTimeMs(flight.routeSourceUpdatedAt)}`
    : undefined;

  return (
    <div className="detail-panel">
      <div className="detail-head">
        <AirlinePill code={airline} />
        <span className="status-pill" style={{ color: st.color, background: st.bg }}>{st.label}</span>
      </div>
      <h2>{csDisplay(flight.flight, flight.hex)}</h2>
      <div className="detail-grid">
        <InfoLine label="Immatriculation" value={flight.r || flight.hex.toUpperCase()} source={positionSource} />
        <InfoLine label="Hex" value={flight.hex.toUpperCase()} source={positionSource} />
        <InfoLine label="Route" value={flight.route || "-"} source={routeSource} />
        <InfoLine label="Appareil" value={acName(flight.t, flight.desc)} source={positionSource} />
        <InfoLine label="Altitude" value={altFt(flight.alt_baro)} source={positionSource} />
        <InfoLine label="Vitesse" value={speedKmh(flight.gs)} source={positionSource} />
        <InfoLine label="Cap" value={`${track2dir(flight.track)} ${flight.track != null ? Math.round(flight.track) : "-"} deg`} source={positionSource} />
        <InfoLine label="Montee/descente" value={`${Math.round(flight.baro_rate || 0)} ft/min`} source={positionSource} />
        <InfoLine label="Squawk" value={flight.squawk || "-"} source={positionSource} />
        <InfoLine label="Dernier signal" value={flight.seen != null ? `${Math.round(flight.seen)} s` : "-"} source={positionSource} />
        <InfoLine label="Source" value={flight.dataSource || "opensky"} />
        <InfoLine label="Zone source" value={flight.sourceArea || "Global states"} />
        <InfoLine label="Date donnee ADS-B" value={fmtDateTimeMs(flight.sourceUpdatedAt)} />
        <InfoLine label="Capture serveur" value={fmtDateTimeMs(flight.capturedAt)} />
        <InfoLine label="Source route" value={flight.routeDataSource || "-"} />
        <InfoLine label="Messages" value={flight.messages?.toLocaleString("fr") || "-"} source={positionSource} />
        <InfoLine label="Latitude" value={flight.lat?.toFixed(4) || "-"} source={positionSource} />
        <InfoLine label="Longitude" value={flight.lon?.toFixed(4) || "-"} source={positionSource} />
      </div>
    </div>
  );
}

function SourceCoverage({ sources }: { sources?: SourceStat[] }) {
  const rollup = useMemo(() => {
    const byName = new Map<string, { name: string; areas: number; total: number; matched: number; latest?: number; failed: number; lastMsg?: string }>();

    for (const source of sources || []) {
      const current = byName.get(source.name) || {
        name: source.name,
        areas: 0,
        total: 0,
        matched: 0,
        latest: undefined,
        failed: 0,
        lastMsg: undefined,
      };
      current.areas += 1;
      current.total += source.total || 0;
      current.matched += source.matched || 0;
      current.failed += source.ok ? 0 : 1;
      current.latest = Math.max(current.latest || 0, source.updatedAt || 0) || current.latest;
      if (!source.ok && source.message) current.lastMsg = source.message;
      byName.set(source.name, current);
    }

    return [...byName.values()];
  }, [sources]);

  if (rollup.length === 0) return null;

  return (
    <div className="source-grid">
      {rollup.map((source) => (
        <div className="source-card" key={source.name}>
          <div className="source-head">
            <strong>{source.name.toUpperCase()}</strong>
            <span>{source.areas} zones</span>
          </div>
          <InfoLine label="Avions bruts lus" value={source.total.toLocaleString("fr")} />
          <InfoLine label="TAR/LBT trouves" value={source.matched} />
          <InfoLine label="Derniere source" value={fmtDateTimeMs(source.latest)} />
          {source.failed > 0 && (
            <div className="source-error">
              {source.failed} zone(s) non repondues
              {source.lastMsg && <span style={{ display: "block", marginTop: 2, color: "#ef4444", fontWeight: 700, textTransform: "none" }}>{source.lastMsg}</span>}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

function fmtDurMin(min: number) {
  if (min <= 0) return "0min";
  const h = Math.floor(min / 60);
  const m = min % 60;
  return h > 0 ? `${h}h${String(m).padStart(2, "0")}` : `${m}min`;
}

function DelayBadgeNew({ min }: { min: number | null }) {
  if (min === null) return <span className="delay-badge" style={{ color: "rgba(255,255,255,0.3)" }}>-</span>;
  if (min === 0) return <span className="delay-badge good">A l&apos;heure</span>;
  if (min > 30) return <span className="delay-badge bad">+{min} min</span>;
  return <span className="delay-badge warn">+{min} min</span>;
}

function HistoryRow({ f }: { f: HistoryFlight }) {
  const airline = histAirline(f.callsign);
  const reg = f.registration || f.icao24 || "-";
  const acType = f.aircraftType ? (AIRCRAFT[f.aircraftType] || f.aircraftType) : "-";

  return (
    <tr className="vh-row">
      <td><AirlinePill code={airline} /></td>
      <td className="strong-cell">{csDisplay(f.callsign)}</td>
      <td style={{ fontSize: 11, color: "rgba(255,255,255,0.5)" }}>{reg}</td>
      <td>{airportLbl(f.estDepartureAirport)} <span className="route-arrow">→</span> {airportLbl(f.estArrivalAirport)}</td>
      <td style={{ fontSize: 11 }}>{acType}</td>
      <td>{fmtDateTime(f.firstSeen)}</td>
      <td>{fmtDateTime(f.lastSeen)}</td>
      <td className="green-cell">{fmtDurMin(f.actualDurationMin)}</td>
      <td style={{ color: "rgba(255,255,255,0.4)", fontSize: 11 }}>
        {f.expectedDurationMin ? `~${fmtDurMin(f.expectedDurationMin)}` : "-"}
        {f.distanceKm ? <span style={{ display: "block", fontSize: 9, color: "rgba(255,255,255,0.25)" }}>{f.distanceKm} km</span> : null}
      </td>
      <td><DelayBadgeNew min={f.delayMin} /></td>
      <td><span className={`status-mini ${f.status === "landed" ? "landed" : "flying"}`}>{f.status === "landed" ? "Atterri" : f.status === "in_flight" ? "En vol" : "-"}</span></td>
    </tr>
  );
}

function buildFleetStats(flights: HistoryFlight[]) {
  const groups = new Map<string, HistoryFlight[]>();
  for (const f of flights) {
    const tail = f.registration || f.icao24 || "Inconnu";
    groups.set(tail, [...(groups.get(tail) || []), f]);
  }
  return [...groups.entries()]
    .map(([tail, list]) => {
      const sorted = [...list].sort((a, b) => a.firstSeen - b.firstSeen);
      const rests = sorted.slice(1).map((f, i) => Math.max(0, Math.round((f.firstSeen - sorted[i].lastSeen) / 60)));
      const flightMinutes = sorted.reduce((sum, f) => sum + f.actualDurationMin, 0);
      const delayMinutes = sorted.reduce((sum, f) => sum + (f.delayMin ?? 0), 0);
      const avgRest = rests.length ? Math.round(rests.reduce((a, b) => a + b, 0) / rests.length) : 0;
      const minRest = rests.length ? Math.min(...rests) : 0;
      const maxRest = rests.length ? Math.max(...rests) : 0;
      return {
        tail,
        flights: sorted,
        count: sorted.length,
        flightMinutes,
        delayMinutes,
        avgRest, minRest, maxRest,
        tightTurns: rests.filter((r) => r > 0 && r < 45).length,
        airline: histAirline(sorted[0].callsign),
        type: sorted[0].aircraftType,
      };
    })
    .sort((a, b) => b.count - a.count || b.delayMinutes - a.delayMinutes);
}

function DelayView({ flights }: { flights: HistoryFlight[] }) {
  const completed = flights.filter((f) => f.status === "landed" && f.delayMin !== null);
  const delayed = completed.filter((f) => (f.delayMin ?? 0) > 0).sort((a, b) => (b.delayMin ?? 0) - (a.delayMin ?? 0));
  const totalDelay = delayed.reduce((sum, f) => sum + (f.delayMin ?? 0), 0);
  const severe = delayed.filter((f) => (f.delayMin ?? 0) > 30).length;
  const avgDelay = delayed.length ? Math.round(totalDelay / delayed.length) : 0;

  return (
    <>
      <div className="insight-grid">
        <StatCard n={delayed.length} l="vols en retard" c="#F59E0B" sub={`${severe} > 30 min`} />
        <StatCard n={fmtDurMin(totalDelay)} l="retard cumule" c="#EF4444" />
        <StatCard n={fmtDurMin(avgDelay)} l="retard moyen" c="#CCFF9B" />
      </div>
      <div className="vols-note evidence-note">
        <span>
          Retard = duree reelle du vol (premiere detectionADS-B airborne → derniere detection) moins la duree theorique calculee depuis la distance orthodromique au sol entre aeroports (820 km/h + 30 min taxi/montee/descente). Vols termines uniquement. Pas une accusation juridique.
        </span>
      </div>
      {delayed.length === 0 ? (
        <div className="vols-empty">Aucun retard detecte sur les vols termines. Les vols en cours ne sont pas inclus.</div>
      ) : (
        <div className="vh-wrap">
          <table className="vh-table">
            <thead>
              <tr>
                <th>Rang</th><th>Compagnie</th><th>Vol</th><th>Immat.</th><th>Trajet</th><th>Distance</th><th>Duree reelle</th><th>Duree theorique</th><th>Retard</th>
              </tr>
            </thead>
            <tbody>
              {delayed.map((f, i) => (
                <tr className="vh-row" key={`${f.icao24}-${f.callsign}-${i}`}>
                  <td className="strong-cell">#{i + 1}</td>
                  <td><AirlinePill code={histAirline(f.callsign)} /></td>
                  <td className="strong-cell">{csDisplay(f.callsign)}</td>
                  <td style={{ fontSize: 11, color: "rgba(255,255,255,0.5)" }}>{f.registration || f.icao24}</td>
                  <td>{airportLbl(f.estDepartureAirport)} <span className="route-arrow">→</span> {airportLbl(f.estArrivalAirport)}</td>
                  <td style={{ color: "rgba(255,255,255,0.45)", fontSize: 11 }}>{f.distanceKm ? `${f.distanceKm} km` : "-"}</td>
                  <td className="green-cell">{fmtDurMin(f.actualDurationMin)}</td>
                  <td style={{ color: "rgba(255,255,255,0.45)", fontSize: 11 }}>{f.expectedDurationMin ? `~${fmtDurMin(f.expectedDurationMin)}` : "-"}</td>
                  <td><DelayBadgeNew min={f.delayMin} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}

function FleetView({ flights }: { flights: HistoryFlight[] }) {
  const fleet = buildFleetStats(flights);
  const busiest = fleet[0];
  const tight = fleet.reduce((sum, plane) => sum + plane.tightTurns, 0);

  return (
    <>
      <div className="insight-grid">
        <StatCard n={fleet.length} l="avions identifies" c="#3BDEB9" />
        <StatCard n={busiest ? busiest.count : 0} l="max rotations / avion" c="#CCFF9B" sub={busiest?.tail} />
        <StatCard n={tight} l="repos courts detectes" c="#F59E0B" sub="< 45 min" />
      </div>
      <div className="vols-note evidence-note">
        <span>Rotations calculees depuis les snapshots ADS-B accumules. Source: adsb-snapshots.</span>
      </div>
      <div className="fleet-grid">
        {fleet.map((plane) => (
          <div className="fleet-card" key={plane.tail}>
            <div className="fleet-head">
              <div>
                <div className="fleet-tail">{plane.tail}</div>
                <div className="soft-text">{acName(plane.type)}</div>
              </div>
              <AirlinePill code={plane.airline} />
            </div>
            <div className="fleet-metrics">
              <InfoLine label="Vols" value={plane.count} />
              <InfoLine label="Temps en vol" value={fmtMinutes(plane.flightMinutes)} />
              <InfoLine label="Retard cumule" value={fmtMinutes(plane.delayMinutes)} />
              <InfoLine label="Repos moyen" value={fmtMinutes(plane.avgRest)} />
              <InfoLine label="Repos minimum" value={fmtMinutes(plane.minRest)} />
              <InfoLine label="Repos maximum" value={fmtMinutes(plane.maxRest)} />
            </div>
            <div className="rotation-strip">
              {plane.flights.slice(0, 6).map((flight, index) => (
                <span key={`${plane.tail}-${flight.callsign}-${index}`}>
                  {csDisplay(flight.callsign)} {fmtDateTime(flight.firstSeen)}
                </span>
              ))}
            </div>
          </div>
        ))}
      </div>
    </>
  );
}

export default function VolsPage() {
  const [live, setLive] = useState<LiveData | null>(null);
  const [hist, setHist] = useState<HistoryData | null>(null);
  const [airline, setAirline] = useState<Airline>("all");
  const [view, setView] = useState<View>("live");
  const [liveLoad, setLiveLoad] = useState(true);
  const [histLoad, setHistLoad] = useState(false);
  const [lastUpdate, setLastUpdate] = useState("");
  const [countdown, setCountdown] = useState(30);
  const [selectedHex, setSelectedHex] = useState<string>();

  const fetchLive = useCallback(async () => {
    try {
      const r = await fetch("/api/vols/live", { cache: "no-store" });
      if (!r.ok) return;
      const d: LiveData = await r.json();
      setLive(d);
      setLastUpdate(new Date(d.timestamp).toLocaleTimeString("fr-TN", { hour: "2-digit", minute: "2-digit", second: "2-digit" }));
      setCountdown(30);
    } finally {
      setLiveLoad(false);
    }
  }, []);

  const fetchHist = useCallback(async () => {
    setHistLoad(true);
    try {
      const r = await fetch("/api/vols/history", { cache: "no-store" });
      if (!r.ok) return;
      const d = await r.json();
      setHist(d as HistoryData);
    } finally {
      setHistLoad(false);
    }
  }, []);

  useEffect(() => { fetchLive(); }, [fetchLive]);
  useEffect(() => {
    const t = setInterval(fetchLive, 30000);
    return () => clearInterval(t);
  }, [fetchLive]);
  useEffect(() => {
    const t = setInterval(() => setCountdown((c) => c > 0 ? c - 1 : 30), 1000);
    return () => clearInterval(t);
  }, []);
  useEffect(() => {
    if (view !== "live" && !hist) fetchHist();
  }, [view, hist, fetchHist]);

  const allLive = useMemo(() => [
    ...(live?.tunisair || []).map((f) => ({ ...f, _al: "TAR" as const })),
    ...(live?.nouvelair || []).map((f) => ({ ...f, _al: "LBT" as const })),
  ], [live]);

  const shownLive = airline === "all" ? allLive : allLive.filter((f) => f._al === airline);
  const selectedLive = shownLive.find((f) => f.hex === selectedHex) || shownLive[0];

  const histFlights = hist?.flights ?? [];
  const filteredHist = airline === "all" ? histFlights : histFlights.filter((f) => histAirline(f.callsign) === airline);
  const shownHist = filteredHist.slice(0, 80);

  const delayTotal = filteredHist.reduce((sum, f) => sum + (f.delayMin || 0), 0);
  const delayedCount = filteredHist.filter((f) => (f.delayMin || 0) > 0).length;
  const inAir = allLive.filter((f) => !isGrounded(f.alt_baro)).length;
  const onGround = allLive.filter((f) => isGrounded(f.alt_baro)).length;
  const tarCnt = allLive.filter((f) => f._al === "TAR").length;
  const lbtCnt = allLive.filter((f) => f._al === "LBT").length;
  return (
    <>
      <style>{`
        /* ── Reset & base ────────────────────────────────── */
        *,*::before,*::after{box-sizing:border-box}
        body{background:#0a0a0a}

        /* ── BG animations ───────────────────────────────── */
        @keyframes orb-drift-1{0%,100%{transform:translate(0,0) scale(1)}33%{transform:translate(60px,-40px) scale(1.08)}66%{transform:translate(-30px,50px) scale(.94)}}
        @keyframes orb-drift-2{0%,100%{transform:translate(0,0) scale(1)}40%{transform:translate(-80px,30px) scale(1.1)}70%{transform:translate(40px,-60px) scale(.92)}}
        @keyframes orb-drift-3{0%,100%{transform:translate(0,0) scale(1)}50%{transform:translate(50px,70px) scale(1.06)}}
        @keyframes grid-fade{0%,100%{opacity:.18}50%{opacity:.28}}

        /* ── Page shell ──────────────────────────────────── */
        .vols-wrap{
          min-height:100vh;
          background:#0a0a0a;
          padding:0 0 100px;position:relative;font-family:"Inter",system-ui,sans-serif;overflow:hidden;
        }

        /* fixed dot grid */
        .vols-wrap::before{
          content:"";position:fixed;inset:0;pointer-events:none;z-index:0;
          background-image:radial-gradient(circle,rgba(255,255,255,.035) 1px,transparent 1px);
          background-size:30px 30px;
          animation:grid-fade 8s ease-in-out infinite;
        }

        /* floating orbs */
        .vols-orb{position:fixed;border-radius:50%;pointer-events:none;z-index:0;filter:blur(80px)}
        .vols-orb-1{
          width:600px;height:600px;
          top:-160px;left:-180px;
          background:radial-gradient(circle,rgba(59,222,185,.09) 0%,transparent 70%);
          animation:orb-drift-1 18s ease-in-out infinite;
        }
        .vols-orb-2{
          width:500px;height:500px;
          top:30%;right:-150px;
          background:radial-gradient(circle,rgba(204,255,155,.07) 0%,transparent 70%);
          animation:orb-drift-2 22s ease-in-out infinite;
        }
        .vols-orb-3{
          width:400px;height:400px;
          bottom:10%;left:30%;
          background:radial-gradient(circle,rgba(59,222,185,.06) 0%,transparent 70%);
          animation:orb-drift-3 26s ease-in-out infinite;
        }
        .vols-inner{max-width:1360px;margin:0 auto;padding:0 28px;position:relative;z-index:1}

        /* ── Topbar nav ──────────────────────────────────── */
        .vols-topbar,.vols-nav{
          position:sticky;top:0;z-index:30;
          display:flex;align-items:center;justify-content:space-between;gap:14px;
          padding:0 28px;height:58px;
          border-bottom:1px solid rgba(255,255,255,.07);
          background:rgba(10,10,10,.85);
          backdrop-filter:blur(20px) saturate(1.3);
        }
        .vols-topbar-left{display:flex;align-items:center;gap:20px}
        .vols-brand{display:flex;align-items:baseline;gap:2px;text-decoration:none}
        .vols-brand-num{
          font-size:22px;font-weight:900;letter-spacing:-2px;color:#fff;line-height:1;
        }
        .vols-brand-tld{font-size:12px;font-weight:600;color:#3bdeb9;letter-spacing:0;line-height:1;margin-top:2px}
        .vols-brand-sep{width:1px;height:18px;background:rgba(255,255,255,.1);margin:0 4px}
        .vols-brand-sub{font-size:11px;font-weight:800;letter-spacing:.1em;text-transform:uppercase;color:rgba(255,255,255,.45)}
        .vols-nav-beta{
          display:inline-flex;align-items:center;padding:2px 8px;border-radius:999px;
          border:1px solid rgba(245,158,11,.3);background:rgba(245,158,11,.1);
          color:#f59e0b;font-size:8px;font-weight:900;letter-spacing:.1em;text-transform:uppercase;
        }
        .vols-topbar-right,.vols-nav-actions{display:flex;align-items:center;gap:8px}
        .vols-nav-brand{display:flex;align-items:center;gap:8px;font-size:11px;font-weight:800;letter-spacing:.08em;text-transform:uppercase;color:rgba(255,255,255,.65)}
        .vols-nav-brand em{font-style:normal;color:#3bdeb9}
        /* ── Shine animation (same as site-wide light_skew_hover) ── */
        @keyframes vols-shine{100%{left:-200%}}

        .vols-nav-btn{
          height:38px;padding:0 20px;border-radius:999px;
          border:1px solid rgba(255,255,255,.18);
          display:inline-flex;align-items:center;gap:8px;text-decoration:none;
          font-size:11px;font-weight:700;letter-spacing:.06em;text-transform:uppercase;
          color:#fff;background:transparent;
          transition:border-color .22s,box-shadow .22s,color .22s;
          white-space:nowrap;position:relative;overflow:hidden;z-index:1;
        }
        .vols-nav-btn::after{
          background-image:linear-gradient(90deg,transparent,rgba(255,255,255,.22),transparent);
          content:"";left:150%;position:absolute;top:0;bottom:0;
          -webkit-transform:skew(-20deg);-ms-transform:skew(-20deg);transform:skew(-20deg);
          width:200%;z-index:-1;
        }
        .vols-nav-btn:hover{border-color:rgba(255,255,255,.35);box-shadow:0 0 18px rgba(255,255,255,.08);color:#fff}
        .vols-nav-btn:hover::after{-webkit-animation:vols-shine .75s cubic-bezier(.01,.56,1,1);animation:vols-shine .75s cubic-bezier(.01,.56,1,1)}
        .vols-nav-btn.primary{
          border-color:rgba(59,222,185,.6);color:#3bdeb9;
        }
        .vols-nav-btn.primary::after{
          background-image:linear-gradient(90deg,transparent,rgba(59,222,185,.28),transparent);
        }
        .vols-nav-btn.primary:hover{border-color:#3bdeb9;box-shadow:0 0 22px rgba(59,222,185,.2);color:#ccff9b}

        /* ── Hero ────────────────────────────────────────── */
        .vols-hero{text-align:center;padding:52px 0 40px;position:relative}
        .vols-hero::after{
          content:"";position:absolute;left:50%;top:60%;transform:translate(-50%,-50%);
          width:600px;height:280px;border-radius:50%;pointer-events:none;
          background:radial-gradient(ellipse,rgba(59,222,185,.06) 0%,transparent 70%);
          filter:blur(30px);z-index:-1;
        }
        .vols-eyebrow{
          display:inline-flex;align-items:center;gap:8px;margin-bottom:20px;
          padding:5px 16px;border-radius:999px;
          border:1px solid rgba(59,222,185,.25);background:rgba(59,222,185,.06);
          font-size:10px;font-weight:800;letter-spacing:.14em;text-transform:uppercase;color:#3bdeb9;
        }
        .vols-eyebrow-dot{width:6px;height:6px;border-radius:50%;background:#3bdeb9;box-shadow:0 0 8px #3bdeb9;animation:vd-pulse 2s ease infinite}
        .vols-hero h1{
          font-size:clamp(32px,4.5vw,58px);font-weight:900;color:#fff;
          letter-spacing:-1.5px;margin:0 0 14px;line-height:1.05;
        }
        .vols-hero h1 .grad{
          background:linear-gradient(110deg,#3bdeb9,#77e590,#ccff9b);
          -webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text;
        }
        .vols-hero p{
          font-size:15px;color:rgba(255,255,255,.42);max-width:680px;
          margin:0 auto 26px;line-height:1.75;
        }
        .vols-live-bar{
          display:inline-flex;align-items:center;gap:9px;
          padding:6px 16px;border-radius:999px;
          border:1px solid rgba(255,255,255,.07);background:rgba(255,255,255,.03);
          font-size:11px;font-weight:700;color:rgba(255,255,255,.36);letter-spacing:.03em;
        }
        @keyframes vd-pulse{0%,100%{opacity:1;transform:scale(1)}50%{opacity:.3;transform:scale(.6)}}
        .live-dot{width:6px;height:6px;border-radius:50%;background:#3bdeb9;box-shadow:0 0 8px #3bdeb9;animation:vd-pulse 2s ease infinite;flex-shrink:0}

        /* ── KPI stat strip ──────────────────────────────── */
        .vols-stats{
          display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:10px;margin-bottom:28px;
        }
        .vstat{
          background:rgba(255,255,255,.028);
          border:1px solid rgba(255,255,255,.065);
          border-radius:12px;padding:18px 20px;
          position:relative;overflow:hidden;
          transition:border-color .2s,box-shadow .2s;
        }
        .vstat::before{
          content:"";position:absolute;top:0;left:0;right:0;height:1px;
          background:linear-gradient(90deg,transparent,rgba(59,222,185,.2),transparent);
        }
        .vstat:hover{border-color:rgba(255,255,255,.1);box-shadow:0 8px 28px rgba(0,0,0,.2)}
        .vstat-n{font-size:32px;font-weight:900;line-height:1;margin-bottom:8px;letter-spacing:-1px}
        .vstat-l{font-size:10px;font-weight:800;color:rgba(255,255,255,.36);letter-spacing:.08em;text-transform:uppercase}
        .vstat-sub{font-size:10px;color:rgba(255,255,255,.22);margin-top:5px;font-weight:700}

        /* ── Insight grid (3-col) ────────────────────────── */
        .insight-grid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:10px;margin-bottom:28px}

        /* ── Info note ───────────────────────────────────── */
        .vols-note{
          display:flex;align-items:flex-start;gap:10px;padding:13px 18px;
          background:rgba(59,222,185,.04);border:1px solid rgba(59,222,185,.12);
          border-radius:10px;margin-bottom:24px;font-size:12px;color:rgba(255,255,255,.46);line-height:1.65;
        }
        .evidence-note{background:rgba(245,158,11,.04);border-color:rgba(245,158,11,.18)}

        /* ── Source coverage cards ───────────────────────── */
        .source-grid{
          display:grid;grid-template-columns:repeat(auto-fill,minmax(200px,1fr));gap:10px;
          margin:-4px 0 26px;
        }
        .source-card{
          background:rgba(255,255,255,.025);border:1px solid rgba(255,255,255,.06);
          border-radius:10px;padding:13px 15px;
          transition:border-color .2s;
        }
        .source-card:hover{border-color:rgba(255,255,255,.1)}
        .source-head{display:flex;align-items:center;justify-content:space-between;gap:8px;margin-bottom:10px}
        .source-head strong{font-size:11px;color:#fff;text-transform:uppercase;letter-spacing:.1em;font-weight:900}
        .source-head span{font-size:9px;font-weight:800;color:rgba(255,255,255,.3);text-transform:uppercase;letter-spacing:.06em}
        .source-error{margin-top:7px;font-size:10px;font-weight:800;color:#f59e0b;text-transform:uppercase;letter-spacing:.04em}

        /* ── Toolbar: airline filter + view tabs ─────────── */
        .vols-ctrl{
          display:flex;align-items:center;justify-content:space-between;
          flex-wrap:wrap;gap:12px;margin-bottom:24px;
          padding:10px 14px;
          background:rgba(255,255,255,.02);border:1px solid rgba(255,255,255,.07);border-radius:14px;
        }
        .vtabs,.vview{display:flex;gap:6px;flex-wrap:wrap}
        .vtab{
          height:36px;padding:0 16px;border-radius:999px;font-size:11px;font-weight:700;cursor:pointer;
          border:1px solid rgba(255,255,255,.14);background:transparent;
          color:rgba(255,255,255,.5);letter-spacing:.06em;text-transform:uppercase;
          position:relative;overflow:hidden;z-index:1;
          transition:border-color .2s,color .2s,box-shadow .2s;
        }
        .vtab::after{
          background-image:linear-gradient(90deg,transparent,rgba(255,255,255,.16),transparent);
          content:"";left:150%;position:absolute;top:0;bottom:0;
          -webkit-transform:skew(-20deg);-ms-transform:skew(-20deg);transform:skew(-20deg);
          width:200%;z-index:-1;
        }
        .vtab:hover{color:#fff;border-color:rgba(255,255,255,.28)}
        .vtab:hover::after{-webkit-animation:vols-shine .75s cubic-bezier(.01,.56,1,1);animation:vols-shine .75s cubic-bezier(.01,.56,1,1)}
        .vtab.on{color:#3bdeb9;border-color:rgba(59,222,185,.45);box-shadow:0 0 16px rgba(59,222,185,.1)}
        .vtab.on::after{background-image:linear-gradient(90deg,transparent,rgba(59,222,185,.2),transparent)}

        .vview-btn{
          height:36px;padding:0 18px;border-radius:999px;font-size:11px;font-weight:700;cursor:pointer;
          border:1px solid rgba(255,255,255,.14);background:transparent;
          color:rgba(255,255,255,.5);letter-spacing:.06em;text-transform:uppercase;
          position:relative;overflow:hidden;z-index:1;
          transition:border-color .2s,color .2s,box-shadow .2s;
        }
        .vview-btn::after{
          background-image:linear-gradient(90deg,transparent,rgba(255,255,255,.16),transparent);
          content:"";left:150%;position:absolute;top:0;bottom:0;
          -webkit-transform:skew(-20deg);-ms-transform:skew(-20deg);transform:skew(-20deg);
          width:200%;z-index:-1;
        }
        .vview-btn:hover{color:#fff;border-color:rgba(255,255,255,.28)}
        .vview-btn:hover::after{-webkit-animation:vols-shine .75s cubic-bezier(.01,.56,1,1);animation:vols-shine .75s cubic-bezier(.01,.56,1,1)}
        .vview-btn.on{
          color:#fff;border-color:rgba(59,222,185,.55);
          box-shadow:0 0 20px rgba(59,222,185,.14),inset 0 0 20px rgba(59,222,185,.04);
          font-weight:800;
        }
        .vview-btn.on::after{background-image:linear-gradient(90deg,transparent,rgba(59,222,185,.22),transparent)}

        /* ── Live view layout ────────────────────────────── */
        .live-layout{display:grid;grid-template-columns:minmax(0,1.5fr) minmax(300px,.68fr);gap:14px;margin-bottom:20px}

        /* ── Map panel ───────────────────────────────────── */
        .map-panel{
          background:rgba(10,10,10,.98);border:1px solid rgba(255,255,255,.07);
          border-radius:14px;overflow:hidden;display:flex;flex-direction:column;
          box-shadow:0 24px 60px rgba(0,0,0,.4);
        }
        .map-grid{flex:1;min-height:440px;position:relative;background:#0a0a0a;isolation:isolate;overflow:hidden}
        .tile-stage{position:absolute;inset:0;z-index:0}
        .sat-tile{position:absolute;width:256px;height:256px;object-fit:cover;user-select:none;pointer-events:none;background:#111}
        .map-vignette{
          position:absolute;inset:0;z-index:1;pointer-events:none;
          background:
            linear-gradient(180deg,rgba(0,0,0,.22),rgba(0,0,0,.05) 40%,rgba(0,0,0,.32)),
            radial-gradient(circle at 50% 50%,transparent 0,rgba(0,0,0,.22) 68%,rgba(0,0,0,.55) 100%);
        }
        .map-vignette::after{
          content:"";position:absolute;inset:0;
          background:
            linear-gradient(90deg,rgba(255,255,255,.04) 1px,transparent 1px),
            linear-gradient(0deg,rgba(255,255,255,.04) 1px,transparent 1px);
          background-size:80px 80px;mix-blend-mode:screen;opacity:.18;
        }
        .map-radar{
          position:absolute;left:50%;top:50%;z-index:2;
          width:min(520px,70%);aspect-ratio:1/1;border-radius:50%;
          transform:translate(-50%,-50%);pointer-events:none;
          background:conic-gradient(from 270deg,rgba(59,222,185,.18),rgba(59,222,185,0) 14%,rgba(59,222,185,0) 100%);
          animation:radar-spin 7s linear infinite;opacity:.5;
        }
        @keyframes radar-spin{to{transform:translate(-50%,-50%) rotate(360deg)}}
        .route-overlay{position:absolute;inset:0;z-index:4;width:100%;height:100%;pointer-events:none;overflow:visible}
        .route-path{fill:none;stroke-linecap:round;stroke-linejoin:round;filter:drop-shadow(0 2px 10px rgba(0,0,0,.6))}
        .route-done{stroke:#f6c945;stroke-width:3.5}
        .route-left{stroke:rgba(255,255,255,.75);stroke-width:2.5;stroke-dasharray:8 8}
        .route-dot{stroke:#0a0a0a;stroke-width:2.5;filter:drop-shadow(0 2px 6px rgba(0,0,0,.7))}
        .route-dot.dep{fill:#f6c945}.route-dot.arr{fill:#ffffff}
        .route-label{font-size:12px;font-weight:900;letter-spacing:.08em;fill:#fff;paint-order:stroke;stroke:rgba(0,0,0,.85);stroke-width:4px;stroke-linejoin:round}
        .map-labels span{
          position:absolute;z-index:3;transform:translate(-50%,-50%);
          font-size:10px;font-weight:900;letter-spacing:.07em;
          color:rgba(255,255,255,.75);text-shadow:0 1px 8px rgba(0,0,0,.9);
          background:rgba(0,0,0,.45);border:1px solid rgba(255,255,255,.11);
          border-radius:4px;padding:2px 6px;
        }
        .map-tools{position:absolute;right:14px;top:14px;z-index:6;display:flex;flex-direction:column;gap:5px}
        .map-tools button{
          width:34px;height:34px;border-radius:8px;
          border:1px solid rgba(255,255,255,.14);background:rgba(10,10,10,.88);
          color:#fff;font-size:17px;font-weight:900;cursor:pointer;
          backdrop-filter:blur(8px);box-shadow:0 4px 14px rgba(0,0,0,.3);
          transition:background .2s,border-color .2s;
        }
        .map-tools button:hover{background:rgba(59,222,185,.12);border-color:rgba(59,222,185,.3)}
        .map-badge{
          position:absolute;left:14px;top:14px;z-index:6;
          height:28px;display:flex;align-items:center;gap:6px;padding:0 10px;
          border-radius:7px;background:rgba(10,10,10,.85);
          border:1px solid rgba(59,222,185,.22);color:#3bdeb9;
          font-size:9px;font-weight:900;letter-spacing:.1em;text-transform:uppercase;
          backdrop-filter:blur(8px);box-shadow:0 4px 14px rgba(0,0,0,.3);
        }
        .plane-marker{position:absolute;z-index:5;width:0;height:0;border:0;padding:0;color:#fff;background:transparent;cursor:pointer;transition:left 1.15s linear,top 1.15s linear;filter:drop-shadow(0 6px 12px rgba(0,0,0,.8))}
        .plane-symbol{
          position:absolute;left:0;top:0;width:38px;height:38px;margin-left:-19px;margin-top:-19px;
          border-radius:999px;display:grid;place-items:center;
          background:rgba(10,10,10,.78);
          box-shadow:0 0 0 2px rgba(0,0,0,.3),0 0 0 4px rgba(255,255,255,.04),0 0 14px rgba(59,222,185,.1);
          transition:transform .2s,box-shadow .2s,background .2s;
        }
        .plane-svg{width:28px;height:28px;overflow:visible}
        .plane-svg path{fill:currentColor;stroke:rgba(0,0,0,.7);stroke-width:2;paint-order:stroke}
        .plane-marker.tar .plane-symbol{color:#ff5252}.plane-marker.lbt .plane-symbol{color:#4d8eff}
        .plane-marker.selected .plane-symbol{
          color:#f6c945;background:rgba(15,15,10,.9);
          box-shadow:0 0 0 3px rgba(0,0,0,.4),0 0 0 6px rgba(246,201,69,.16),0 0 24px rgba(246,201,69,.38);
        }
        .plane-label{
          position:absolute;left:22px;top:-13px;white-space:nowrap;
          border-radius:5px;padding:3px 7px;
          background:rgba(10,10,10,.88);border:1px solid rgba(255,255,255,.1);
          color:rgba(255,255,255,.9);font-size:10px;font-weight:900;letter-spacing:.02em;
          text-shadow:0 1px 5px #000;
        }
        .map-foot{
          display:flex;justify-content:space-between;gap:12px;flex-wrap:wrap;
          padding:10px 16px;border-top:1px solid rgba(255,255,255,.05);
          font-size:9px;font-weight:800;color:rgba(255,255,255,.32);letter-spacing:.06em;text-transform:uppercase;
        }

        /* ── Detail panel ────────────────────────────────── */
        .detail-panel{
          background:rgba(10,10,10,.95);
          border:1px solid rgba(59,222,185,.1);
          border-radius:14px;
          padding:18px;
          overflow-y:auto;
          max-height:600px;
          box-shadow:0 16px 40px rgba(0,0,0,.32),0 0 0 1px rgba(204,255,155,.04);
          position:relative;
          overflow:hidden;
        }
        .detail-panel::before{
          content:"";
          position:absolute;
          top:0;
          left:0;
          right:0;
          height:1px;
          background:linear-gradient(90deg,transparent,rgba(59,222,185,.18),transparent);
          pointer-events:none;
        }
        .detail-head,.vc-top,.vc-bottom,.fleet-head{display:flex;align-items:center;justify-content:space-between;gap:10px}
        .detail-panel h2{font-size:28px;color:#fff;margin:14px 0 12px;letter-spacing:-0.5px;font-weight:900}
        .detail-grid,.fleet-metrics{display:grid;gap:8px}
        .info-line{
          display:flex;
          align-items:flex-start;
          justify-content:space-between;
          gap:12px;
          padding:10px 11px;
          border:1px solid rgba(255,255,255,.06);
          border-radius:8px;
          background:rgba(255,255,255,.02);
          font-size:11px;
          color:rgba(255,255,255,.45);
        }
        .info-line:last-child{border-bottom:1px solid rgba(255,255,255,.06)}
        .info-line strong{text-align:right;color:rgba(255,255,255,.84);font-weight:800;display:flex;flex-direction:column;align-items:flex-end;gap:3px}
        .info-line small{font-size:9px;line-height:1.25;color:rgba(255,255,255,.26);font-weight:800;letter-spacing:.03em}

        /* ── Airline pill ────────────────────────────────── */
        .airline-pill{
          display:inline-flex;align-items:center;height:20px;padding:0 9px;
          border-radius:999px;color:#fff;font-size:9px;font-weight:900;
          letter-spacing:.08em;text-transform:uppercase;white-space:nowrap;
        }

        /* ── Status badges ───────────────────────────────── */
        .status-pill,.status-mini{
          display:inline-flex;align-items:center;border-radius:6px;
          padding:3px 8px;font-size:10px;font-weight:900;letter-spacing:.05em;text-transform:uppercase;
        }
        .status-mini.landed{background:rgba(148,163,184,.08);color:#94a3b8}
        .status-mini.flying{background:rgba(59,222,185,.1);color:#3bdeb9}
        .delay-badge{font-size:10px;font-weight:900;letter-spacing:.04em}
        .delay-badge.good{color:#3bdeb9}.delay-badge.warn{color:#f59e0b}.delay-badge.bad{color:#ef4444}

        /* ── Misc text helpers ───────────────────────────── */
        .muted-small,.soft-text{font-size:11px;color:rgba(255,255,255,.32);font-weight:700}
        .soft-text{line-height:1.55}
        .panel-title{font-size:14px;font-weight:800;color:rgba(255,255,255,.5);margin-bottom:12px;letter-spacing:.04em}

        /* ── Flight cards grid ───────────────────────────── */
        .vols-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(240px,1fr));gap:10px;margin-bottom:44px}
        .vc-card{
          text-align:left;
          background:rgba(10,10,10,.95);
          border:1px solid rgba(59,222,185,.1);
          border-radius:12px;padding:16px;
          display:flex;flex-direction:column;gap:10px;cursor:pointer;
          transition:transform .22s,border-color .22s,box-shadow .22s;
          position:relative;overflow:hidden;
        }
        .vc-card::before{content:"";position:absolute;top:0;left:0;right:0;height:1px;background:linear-gradient(90deg,transparent,rgba(59,222,185,.15),transparent)}
        .vc-card:hover,.vc-card.selected{
          transform:translateY(-3px);border-color:rgba(204,255,155,.28);
          box-shadow:0 16px 40px rgba(0,0,0,.32),0 0 0 1px rgba(204,255,155,.1);
        }
        .vc-title{font-size:24px;font-weight:900;color:#fff;line-height:1;letter-spacing:-0.5px;margin:4px 0}
        .vc-metrics{display:flex;gap:6px;border-top:1px solid rgba(255,255,255,.05);padding-top:10px}
        .vc-metrics span{
          font-size:11px;font-weight:800;color:rgba(255,255,255,.5);
          background:rgba(255,255,255,.04);border:1px solid rgba(255,255,255,.06);
          border-radius:6px;padding:4px 8px;
        }
        .data-stamp{
          border-top:1px solid rgba(255,255,255,.05);padding-top:8px;
          font-size:9px;font-weight:800;letter-spacing:.06em;text-transform:uppercase;color:rgba(255,255,255,.24);
        }

        /* ── History / Delays table ──────────────────────── */
        .vh-wrap{
          overflow-x:auto;border-radius:12px;
          border:1px solid rgba(255,255,255,.07);
          background:rgba(10,10,10,.98);
          box-shadow:0 20px 50px rgba(0,0,0,.35);
        }
        .vh-table{width:100%;border-collapse:collapse}
        .vh-table thead{background:rgba(255,255,255,.025);border-bottom:1px solid rgba(255,255,255,.07)}
        .vh-table th{
          padding:14px 16px;font-size:9px;font-weight:900;letter-spacing:.11em;
          text-transform:uppercase;color:rgba(255,255,255,.28);text-align:left;white-space:nowrap;
        }
        .vh-row td{
          padding:13px 16px;border-bottom:1px solid rgba(255,255,255,.038);
          white-space:nowrap;font-size:12px;color:rgba(255,255,255,.54);
          transition:background .15s;
        }
        .vh-row:hover td{background:rgba(59,222,185,.025)}
        .vh-row:last-child td{border-bottom:0}
        .strong-cell{font-weight:900!important;color:#fff!important}
        .green-cell{font-weight:900!important;color:#ccff9b!important}
        .route-arrow{color:rgba(59,222,185,.7);margin:0 6px;font-weight:900}

        /* ── Fleet cards ─────────────────────────────────── */
        .fleet-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(320px,1fr));gap:12px}
        .fleet-card{
          background:rgba(10,10,10,.98);border:1px solid rgba(255,255,255,.07);
          border-radius:14px;padding:18px;
          box-shadow:0 10px 30px rgba(0,0,0,.25);
          transition:border-color .2s,box-shadow .2s;
        }
        .fleet-card:hover{border-color:rgba(59,222,185,.14);box-shadow:0 16px 40px rgba(0,0,0,.32)}
        .fleet-tail{font-size:26px;font-weight:900;color:#fff;letter-spacing:-0.5px}
        .rotation-strip{display:flex;gap:5px;flex-wrap:wrap;margin-top:12px}
        .rotation-strip span{
          font-size:10px;font-weight:800;color:rgba(255,255,255,.42);
          border:1px solid rgba(255,255,255,.07);border-radius:999px;
          padding:3px 8px;background:rgba(255,255,255,.025);
        }

        /* ── Empty / loader states ───────────────────────── */
        .vols-empty{
          text-align:center;padding:80px 20px;color:rgba(255,255,255,.22);
          font-size:14px;font-weight:700;letter-spacing:.03em;
        }
        .vols-spin{display:flex;align-items:center;justify-content:center;padding:80px}
        .spin-ring{
          width:40px;height:40px;
          border:3px solid rgba(59,222,185,.12);border-top-color:#3bdeb9;
          border-radius:50%;animation:vd-spin .75s linear infinite;
        }
        @keyframes vd-spin{to{transform:rotate(360deg)}}

        /* ── Responsive ──────────────────────────────────── */
        @media(max-width:1080px){
          .live-layout{grid-template-columns:1fr}
          .vols-stats{grid-template-columns:repeat(2,minmax(0,1fr))}
          .insight-grid{grid-template-columns:repeat(2,minmax(0,1fr))}
          .map-grid{min-height:400px}
        }
        @media(max-width:680px){
          .vols-inner{padding:0 16px}
          .vols-topbar,.vols-nav{padding:0 16px}
          .vols-wrap{padding:0 0 74px}
          .vols-hero{padding:28px 0 20px}
          .vols-eyebrow{margin-bottom:12px;padding:4px 11px;font-size:9px;letter-spacing:.1em}
          .vols-hero h1{font-size:clamp(28px,8vw,34px);line-height:1.1;margin-bottom:10px;letter-spacing:-.8px}
          .vols-hero p{font-size:13px;line-height:1.58;margin-bottom:14px}
          .vols-live-bar{font-size:10px;padding:5px 11px;gap:7px}
          .vols-stats{grid-template-columns:repeat(2,minmax(0,1fr));gap:8px;margin-bottom:18px}
          .vstat{padding:13px 12px;border-radius:10px}
          .vstat-n{font-size:24px;margin-bottom:5px}
          .vstat-l{font-size:9px}
          .vstat-sub{font-size:9px}
          .insight-grid{grid-template-columns:1fr;gap:8px}
          .source-grid{grid-template-columns:repeat(2,minmax(0,1fr));gap:8px;margin-bottom:16px}
          .source-card{padding:10px 10px;border-radius:10px}
          .source-head{margin-bottom:7px}
          .source-head strong{font-size:9px;letter-spacing:.07em}
          .source-head span{font-size:8px}
          .info-line{padding:6px 0;font-size:10px;gap:8px}
          .info-line strong{font-size:10px}
          .info-line small{font-size:8px}
          .source-error{font-size:9px}
          .map-grid{min-height:340px}
          .vols-grid,.fleet-grid{grid-template-columns:1fr}
          .vtab,.vview-btn{flex:1;font-size:10px;padding:0 8px;height:34px}
          .vtabs,.vview{width:100%}
          .vols-ctrl{flex-direction:column;align-items:stretch;gap:8px;padding:8px 9px;border-radius:12px}
          .detail-panel{max-height:none}
          .detail-panel{padding:14px;border-radius:12px}
          .detail-panel h2{font-size:22px;margin:10px 0 8px}
          .detail-grid{
            grid-template-columns:repeat(2,minmax(0,1fr));
            gap:8px;
          }
          .detail-panel .info-line{
            border:1px solid rgba(255,255,255,.08);
            border-radius:8px;
            padding:8px;
            background:rgba(255,255,255,.02);
            flex-direction:column;
            align-items:flex-start;
            justify-content:flex-start;
            gap:5px;
          }
          .detail-panel .info-line strong{
            align-items:flex-start;
            text-align:left;
            font-size:10px;
          }
          .detail-panel .info-line span{
            word-break:break-word;
          }
          .map-panel{border-radius:12px}
          .map-foot{padding:8px 10px;font-size:8px;gap:8px}
          .vols-grid{gap:8px;margin-bottom:28px}
          .vc-card{padding:12px;border-radius:10px;gap:8px}
          .vc-title{font-size:20px}
          .vols-note{padding:10px 12px;font-size:11px;margin-bottom:16px}
          .vh-table th{padding:10px 10px;font-size:8px}
          .vh-row td{padding:9px 10px;font-size:11px}
          .vols-topbar{padding:0 16px;height:auto;min-height:52px;flex-wrap:wrap;gap:6px;padding-top:8px;padding-bottom:8px}
          .vols-topbar-left{gap:8px;min-width:0;flex-wrap:wrap}
          .vols-brand-num{font-size:19px;letter-spacing:-1.7px}
          .vols-brand-tld{font-size:10px}
          .vols-brand-sub{font-size:9px}
          .vols-brand-sep{height:14px;margin:0 2px}
          .vols-nav-beta{font-size:7px;padding:2px 6px}
          .vols-topbar-right{flex-wrap:wrap}
          .vols-nav-btn{flex:1 1 120px;justify-content:center;height:34px;padding:0 12px;font-size:10px}
        }
        @media(max-width:480px){
          .vols-inner{padding:0 12px}
          .vols-topbar{padding-left:12px;padding-right:12px}
          .vols-hero{padding:22px 0 18px}
          .vols-stats{gap:6px}
          .source-grid{grid-template-columns:1fr}
          .map-grid{min-height:300px}
          .map-badge{left:8px;top:8px;height:24px;padding:0 8px;font-size:8px}
          .map-tools{right:8px;top:8px;gap:4px}
          .map-tools button{width:30px;height:30px}
          .plane-label{display:none}
          .vtabs,.vview{gap:5px}
          .detail-grid{grid-template-columns:1fr}
        }

        /* ════════════════════════════════════════════════
           LIGHT MODE OVERRIDES  [data-theme="light"]
           All teal/green accents → dark purple #5B21B6
        ════════════════════════════════════════════════ */
        [data-theme="light"] body{background:#f4f6f3!important}

        /* page shell */
        [data-theme="light"] .vols-wrap{background:#f0f2ef!important}
        [data-theme="light"] .vols-wrap::before{
          background-image:radial-gradient(circle,rgba(0,0,0,.055) 1px,transparent 1px)!important;
        }

        /* orbs — purple tones */
        [data-theme="light"] .vols-orb-1{background:radial-gradient(circle,rgba(91,33,182,.07) 0%,transparent 70%)!important}
        [data-theme="light"] .vols-orb-2{background:radial-gradient(circle,rgba(124,58,237,.05) 0%,transparent 70%)!important}
        [data-theme="light"] .vols-orb-3{background:radial-gradient(circle,rgba(91,33,182,.05) 0%,transparent 70%)!important}

        /* topbar */
        [data-theme="light"] .vols-topbar,[data-theme="light"] .vols-nav{
          background:rgba(255,255,255,.95)!important;
          border-bottom-color:rgba(0,0,0,.09)!important;
        }
        [data-theme="light"] .vols-brand-num{color:#0a0f0d!important}
        [data-theme="light"] .vols-brand-tld{color:#5B21B6!important}
        [data-theme="light"] .vols-brand-sep{background:rgba(0,0,0,.1)!important}
        [data-theme="light"] .vols-brand-sub{color:rgba(0,0,0,.38)!important}
        [data-theme="light"] .vols-nav-btn{
          border-color:rgba(0,0,0,.14)!important;color:#0a0f0d!important;background:transparent!important;
        }
        [data-theme="light"] .vols-nav-btn::after{
          background-image:linear-gradient(90deg,transparent,rgba(0,0,0,.09),transparent)!important;
        }
        [data-theme="light"] .vols-nav-btn:hover{border-color:rgba(0,0,0,.28)!important;box-shadow:0 0 16px rgba(0,0,0,.08)!important;color:#0a0f0d!important}
        [data-theme="light"] .vols-nav-btn.primary{border-color:rgba(91,33,182,.5)!important;color:#5B21B6!important}
        [data-theme="light"] .vols-nav-btn.primary:hover{border-color:#5B21B6!important;box-shadow:0 0 20px rgba(91,33,182,.18)!important;color:#4C1D95!important}

        /* hero */
        [data-theme="light"] .vols-hero::after{
          background:radial-gradient(ellipse,rgba(91,33,182,.06) 0%,transparent 70%)!important;
        }
        [data-theme="light"] .vols-eyebrow{
          border-color:rgba(91,33,182,.22)!important;background:rgba(91,33,182,.06)!important;color:#5B21B6!important;
        }
        [data-theme="light"] .vols-eyebrow-dot{background:#5B21B6!important;box-shadow:0 0 8px #5B21B6!important}
        [data-theme="light"] .vols-hero h1{color:#0a0f0d!important}
        [data-theme="light"] .vols-hero h1 .grad{
          background:linear-gradient(110deg,#5B21B6,#7C3AED,#A78BFA)!important;
          -webkit-background-clip:text!important;-webkit-text-fill-color:transparent!important;background-clip:text!important;
        }
        [data-theme="light"] .vols-hero p{color:rgba(0,0,0,.48)!important}
        [data-theme="light"] .vols-live-bar{
          border-color:rgba(0,0,0,.07)!important;background:rgba(0,0,0,.03)!important;color:rgba(0,0,0,.4)!important;
        }
        [data-theme="light"] .live-dot{background:#5B21B6!important;box-shadow:0 0 8px #5B21B6!important}

        /* KPI stat strip */
        [data-theme="light"] .vstat{
          background:#ffffff!important;border-color:rgba(0,0,0,.08)!important;
          box-shadow:0 2px 12px rgba(0,0,0,.07),0 1px 3px rgba(0,0,0,.04)!important;
        }
        [data-theme="light"] .vstat::before{
          background:linear-gradient(90deg,transparent,rgba(91,33,182,.18),transparent)!important;
        }
        [data-theme="light"] .vstat:hover{border-color:rgba(91,33,182,.18)!important;box-shadow:0 8px 28px rgba(0,0,0,.1)!important}
        [data-theme="light"] .vstat-l{color:rgba(0,0,0,.4)!important}
        [data-theme="light"] .vstat-sub{color:rgba(0,0,0,.3)!important}

        /* toolbar */
        [data-theme="light"] .vols-ctrl{
          background:#ffffff!important;border-color:rgba(0,0,0,.08)!important;
          box-shadow:0 2px 10px rgba(0,0,0,.06)!important;
        }
        [data-theme="light"] .vtab{
          border-color:rgba(0,0,0,.12)!important;color:rgba(0,0,0,.45)!important;background:transparent!important;
        }
        [data-theme="light"] .vtab::after{
          background-image:linear-gradient(90deg,transparent,rgba(0,0,0,.08),transparent)!important;
        }
        [data-theme="light"] .vtab:hover{color:#0a0f0d!important;border-color:rgba(0,0,0,.24)!important}
        [data-theme="light"] .vtab.on{color:#5B21B6!important;border-color:rgba(91,33,182,.4)!important;box-shadow:0 0 16px rgba(91,33,182,.1)!important}
        [data-theme="light"] .vtab.on::after{background-image:linear-gradient(90deg,transparent,rgba(91,33,182,.16),transparent)!important}
        [data-theme="light"] .vview-btn{
          border-color:rgba(0,0,0,.12)!important;color:rgba(0,0,0,.45)!important;background:transparent!important;
        }
        [data-theme="light"] .vview-btn::after{
          background-image:linear-gradient(90deg,transparent,rgba(0,0,0,.08),transparent)!important;
        }
        [data-theme="light"] .vview-btn:hover{color:#0a0f0d!important;border-color:rgba(0,0,0,.24)!important}
        [data-theme="light"] .vview-btn.on{
          color:#5B21B6!important;border-color:rgba(91,33,182,.5)!important;
          box-shadow:0 0 20px rgba(91,33,182,.12),inset 0 0 20px rgba(91,33,182,.04)!important;
        }
        [data-theme="light"] .vview-btn.on::after{background-image:linear-gradient(90deg,transparent,rgba(91,33,182,.18),transparent)!important}

        /* notes */
        [data-theme="light"] .vols-note{
          background:rgba(91,33,182,.04)!important;border-color:rgba(91,33,182,.14)!important;color:rgba(0,0,0,.52)!important;
        }
        [data-theme="light"] .evidence-note{background:rgba(245,158,11,.04)!important;border-color:rgba(245,158,11,.2)!important}

        /* source cards */
        [data-theme="light"] .source-card{
          background:#ffffff!important;border-color:rgba(0,0,0,.08)!important;
          box-shadow:0 2px 10px rgba(0,0,0,.06)!important;
        }
        [data-theme="light"] .source-card:hover{border-color:rgba(91,33,182,.18)!important}
        [data-theme="light"] .source-head strong{color:#0a0f0d!important}
        [data-theme="light"] .source-head span{color:rgba(0,0,0,.32)!important}
        [data-theme="light"] .source-error{color:#B45309!important}

        /* map panel — keep dark satellite look, just lighten border/footer */
        [data-theme="light"] .map-panel{
          border-color:rgba(0,0,0,.1)!important;box-shadow:0 24px 60px rgba(0,0,0,.14)!important;
        }
        [data-theme="light"] .map-foot{
          border-top-color:rgba(0,0,0,.07)!important;color:rgba(0,0,0,.38)!important;
          background:rgba(255,255,255,.95)!important;
        }
        [data-theme="light"] .map-badge{
          background:rgba(255,255,255,.95)!important;border-color:rgba(91,33,182,.28)!important;color:#5B21B6!important;
        }
        [data-theme="light"] .map-tools button{
          background:rgba(255,255,255,.95)!important;border-color:rgba(0,0,0,.12)!important;color:#0a0f0d!important;
        }
        [data-theme="light"] .map-tools button:hover{background:rgba(91,33,182,.08)!important;border-color:rgba(91,33,182,.28)!important}
        [data-theme="light"] .map-radar{
          background:conic-gradient(from 270deg,rgba(91,33,182,.18),rgba(91,33,182,0) 14%,rgba(91,33,182,0) 100%)!important;
        }

        /* detail panel */
        [data-theme="light"] .detail-panel{
          background:#ffffff!important;border-color:rgba(91,33,182,.1)!important;
          box-shadow:0 16px 40px rgba(0,0,0,.1),0 0 0 1px rgba(91,33,182,.04)!important;
        }
        [data-theme="light"] .detail-panel::before{
          background:linear-gradient(90deg,transparent,rgba(91,33,182,.16),transparent)!important;
        }
        [data-theme="light"] .detail-panel h2{color:#0a0f0d!important}
        [data-theme="light"] .info-line{
          border-color:rgba(0,0,0,.07)!important;background:rgba(0,0,0,.02)!important;color:rgba(0,0,0,.52)!important;
        }
        [data-theme="light"] .info-line:last-child{border-bottom-color:rgba(0,0,0,.07)!important}
        [data-theme="light"] .info-line strong{color:rgba(0,0,0,.85)!important}
        [data-theme="light"] .info-line small{color:rgba(0,0,0,.3)!important}

        /* flight cards */
        [data-theme="light"] .vc-card{
          background:#ffffff!important;border-color:rgba(91,33,182,.1)!important;
          box-shadow:0 2px 10px rgba(0,0,0,.07)!important;
        }
        [data-theme="light"] .vc-card::before{
          background:linear-gradient(90deg,transparent,rgba(91,33,182,.14),transparent)!important;
        }
        [data-theme="light"] .vc-card:hover,[data-theme="light"] .vc-card.selected{
          border-color:rgba(91,33,182,.32)!important;
          box-shadow:0 16px 40px rgba(0,0,0,.1),0 0 0 1px rgba(91,33,182,.1)!important;
        }
        [data-theme="light"] .vc-title{color:#0a0f0d!important}
        [data-theme="light"] .vc-metrics span{
          color:rgba(0,0,0,.52)!important;background:rgba(0,0,0,.03)!important;border-color:rgba(0,0,0,.07)!important;
        }
        [data-theme="light"] .data-stamp{
          border-top-color:rgba(0,0,0,.06)!important;color:rgba(0,0,0,.28)!important;
        }
        [data-theme="light"] .muted-small,[data-theme="light"] .soft-text{color:rgba(0,0,0,.38)!important}
        [data-theme="light"] .panel-title{color:rgba(0,0,0,.42)!important}

        /* history/delays table */
        [data-theme="light"] .vh-wrap{
          background:#ffffff!important;border-color:rgba(0,0,0,.08)!important;
          box-shadow:0 8px 30px rgba(0,0,0,.08)!important;
        }
        [data-theme="light"] .vh-table thead{
          background:rgba(0,0,0,.025)!important;border-bottom-color:rgba(0,0,0,.07)!important;
        }
        [data-theme="light"] .vh-table th{color:rgba(0,0,0,.35)!important}
        [data-theme="light"] .vh-row td{
          border-bottom-color:rgba(0,0,0,.05)!important;color:rgba(0,0,0,.58)!important;
        }
        [data-theme="light"] .vh-row:hover td{background:rgba(91,33,182,.03)!important}
        [data-theme="light"] .strong-cell{color:#0a0f0d!important}
        [data-theme="light"] .green-cell{color:#5B21B6!important}
        [data-theme="light"] .route-arrow{color:rgba(91,33,182,.65)!important}

        /* badges & pills */
        [data-theme="light"] .status-mini.flying{background:rgba(91,33,182,.1)!important;color:#5B21B6!important}
        [data-theme="light"] .delay-badge.good{color:#5B21B6!important}

        /* fleet cards */
        [data-theme="light"] .fleet-card{
          background:#ffffff!important;border-color:rgba(0,0,0,.08)!important;
          box-shadow:0 4px 16px rgba(0,0,0,.07)!important;
        }
        [data-theme="light"] .fleet-card:hover{border-color:rgba(91,33,182,.18)!important;box-shadow:0 12px 32px rgba(0,0,0,.1)!important}
        [data-theme="light"] .fleet-tail{color:#0a0f0d!important}
        [data-theme="light"] .rotation-strip span{
          color:rgba(0,0,0,.42)!important;border-color:rgba(0,0,0,.07)!important;background:rgba(0,0,0,.025)!important;
        }

        /* loader & empty */
        [data-theme="light"] .vols-empty{color:rgba(0,0,0,.3)!important}
        [data-theme="light"] .spin-ring{
          border-color:rgba(91,33,182,.12)!important;border-top-color:#5B21B6!important;
        }
        [data-theme="light"] .detail-head .panel-title{color:rgba(0,0,0,.42)!important}
      `}</style>

      {/* ── Sticky topbar ─────────────────────────── */}
      <nav className="vols-topbar">
        <div className="vols-topbar-left">
          <a href="/" className="vols-brand">
            <span className="vols-brand-num">1111</span>
            <span className="vols-brand-tld">.tn</span>
          </a>
          <div className="vols-brand-sep" />
          <span className="vols-brand-sub">Vols Live</span>
          <span className="vols-nav-beta">Beta</span>
        </div>
        <div className="vols-topbar-right">
          <a href="/" className="vols-nav-btn">
            <svg width="12" height="12" viewBox="0 0 14 14" fill="none" aria-hidden="true">
              <path d="M12.83 7H1.17M1.17 7L7 1.17M1.17 7L7 12.83" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            Accueil
          </a>
        </div>
      </nav>

      <div className="vols-wrap">
        {/* animated background orbs */}
        <div className="vols-orb vols-orb-1" aria-hidden="true" />
        <div className="vols-orb vols-orb-2" aria-hidden="true" />
        <div className="vols-orb vols-orb-3" aria-hidden="true" />

        <div className="vols-inner">

          {/* ── Hero ──────────────────────────────────── */}
          <div className="vols-hero">
            <div className="vols-eyebrow">
              <span className="vols-eyebrow-dot" />
              Suivi ADS-B temps reel
            </div>
            <h1>Vols <span className="grad">Tunisair</span> &amp; Nouvelair</h1>
            <p>Carte satellite live, details avion, historique, retards calcules sur distance reelle et rotations de flotte — en acces public.</p>
            <div className="vols-live-bar">
              <span className="live-dot" />
              {lastUpdate ? `Mis a jour ${lastUpdate} · refresh dans ${countdown}s` : "Connexion aux sources ADS-B…"}
            </div>
          </div>

          {/* ── KPI strip ─────────────────────────────── */}
          <div className="vols-stats">
            <StatCard n={inAir} l="En vol" c="#3BDEB9" />
            <StatCard n={onGround} l="Au sol" c="#94A3B8" />
            <StatCard n={tarCnt} l="Tunisair" c="#EF4444" />
            <StatCard n={lbtCnt} l="Nouvelair" c="#3B82F6" />
          </div>

          {/* ── Source coverage ───────────────────────── */}
          <SourceCoverage sources={live?.sources} />

          {/* ── Toolbar ───────────────────────────────── */}
          <div className="vols-ctrl">
            <div className="vtabs">
              {(["all", "TAR", "LBT"] as Airline[]).map((a) => (
                <button key={a} className={`vtab${airline === a ? " on" : ""}`} onClick={() => setAirline(a)} type="button">
                  {a === "all" ? "Toutes" : a === "TAR" ? "Tunisair" : "Nouvelair"}
                </button>
              ))}
            </div>
            <div className="vview">
              {([
                ["live", "Direct + carte"],
                ["history", "Historique"],
                ["delays", "Retards"],
                ["fleet", "Flotte / repos"],
              ] as Array<[View, string]>).map(([key, label]) => (
                <button key={key} className={`vview-btn${view === key ? " on" : ""}`} onClick={() => setView(key)} type="button">
                  {label}
                </button>
              ))}
            </div>
          </div>

          {/* ── Live view ─────────────────────────────── */}
          {view === "live" && (
            liveLoad
              ? <div className="vols-spin"><div className="spin-ring" /></div>
              : shownLive.length === 0
                ? <div className="vols-empty">Aucun vol detecte en ce moment. La couverture ADS-B peut etre partielle.</div>
                : (
                  <>
                    <div className="live-layout">
                      <LiveMap flights={shownLive} selectedHex={selectedLive?.hex} onSelect={setSelectedHex} />
                      <LiveDetails flight={selectedLive} />
                    </div>
                    <div className="vols-grid">
                      {shownLive.map((f) => (
                        <FlightCard key={f.hex} f={f} selected={selectedLive?.hex === f.hex} onSelect={() => setSelectedHex(f.hex)} />
                      ))}
                    </div>
                  </>
                )
          )}

          {/* ── History/fleet loading ─────────────────── */}
          {view !== "live" && histLoad && <div className="vols-spin"><div className="spin-ring" /></div>}

          {/* ── History view ──────────────────────────── */}
          {view === "history" && !histLoad && (
            <>
              <div className="insight-grid">
                <StatCard n={hist?.total ?? filteredHist.length} l="vols detectes" c="#3BDEB9" sub="adsb-snapshots" />
                <StatCard n={delayedCount} l="avec retard" c="#F59E0B" />
                <StatCard n={fmtMinutes(delayTotal)} l="retard cumule" c="#EF4444" />
              </div>
              <div className="vols-note evidence-note">
                <span>Historique base sur les snapshots ADS-B accumules. Charge le {fmtDateTimeMs(hist?.timestamp)}.</span>
              </div>
              {shownHist.length === 0
                ? <div className="vols-empty">Aucune donnee historique disponible. Laissez le systeme collecter quelques vols.</div>
                : (
                  <div className="vh-wrap">
                    <table className="vh-table">
                      <thead>
                        <tr>
                          <th>Compagnie</th><th>Vol</th><th>Immat.</th><th>Trajet</th><th>Type</th><th>Depart</th><th>Arrivee</th><th>Duree reelle</th><th>Theorique</th><th>Retard</th><th>Statut</th>
                        </tr>
                      </thead>
                      <tbody>{shownHist.map((f, i) => <HistoryRow key={`${f.icao24}-${f.callsign}-${i}`} f={f} />)}</tbody>
                    </table>
                  </div>
                )}
            </>
          )}

          {/* ── Delays & Fleet ────────────────────────── */}
          {view === "delays" && !histLoad && <DelayView flights={filteredHist} />}
          {view === "fleet" && !histLoad && <FleetView flights={filteredHist} />}

          <div style={{ textAlign:"center", marginTop:64, fontSize:10, color:"rgba(255,255,255,.13)", fontWeight:700, letterSpacing:".07em", textTransform:"uppercase" }}>
            ADS-B : ADSB.LOL · ADSB.FI · EZZ456CH · AIRPLANES.LIVE · OPENSKY · FR24
          </div>

        </div>
      </div>
    </>
  );
}
