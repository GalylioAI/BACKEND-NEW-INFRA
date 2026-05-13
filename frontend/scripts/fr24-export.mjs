import { mkdir, writeFile } from "node:fs/promises";
import { homedir } from "node:os";
import path from "node:path";

const API_BASE = "https://fr24api.flightradar24.com/api";
const VALID_DETAILS = new Set(["light", "full"]);

const modes = {
  "sandbox-live": {
    endpoint: ({ detail = "light" }) => `/sandbox/live/flight-positions/${detail}`,
    required: ["airport"],
    params: ({ airport, limit }) => ({ airports: airport, limit }),
  },
  "live-airport": {
    endpoint: ({ detail = "light" }) => `/live/flight-positions/${detail}`,
    required: ["airport"],
    params: ({ airport, limit }) => ({ airports: airport, limit }),
  },
  "live-bounds": {
    endpoint: ({ detail = "light" }) => `/live/flight-positions/${detail}`,
    required: ["bounds"],
    params: ({ bounds, limit }) => ({ bounds, limit }),
  },
  "airport-info": {
    endpoint: ({ detail = "light", code }) => `/static/airports/${code}/${detail}`,
    required: ["code"],
    params: () => ({}),
  },
  "airline-info": {
    endpoint: ({ icao }) => `/static/airlines/${icao}/light`,
    required: ["icao"],
    params: () => ({}),
  },
  "summary": {
    endpoint: ({ detail = "light" }) => `/flight-summary/${detail}`,
    required: ["from", "to"],
    params: ({ from, to, flights, callsigns, registrations, airports, routes, aircraft, limit, sort }) => ({
      flight_datetime_from: from,
      flight_datetime_to: to,
      flights,
      callsigns,
      registrations,
      airports,
      routes,
      aircraft,
      limit,
      sort,
    }),
  },
};

function parseArgs(argv) {
  const [mode, ...rest] = argv;
  const options = {};

  for (let index = 0; index < rest.length; index += 1) {
    const item = rest[index];

    if (!item.startsWith("--")) {
      throw new Error(`Unexpected argument: ${item}`);
    }

    const key = item.slice(2);
    const next = rest[index + 1];
    if (!next || next.startsWith("--")) {
      options[key] = "true";
    } else {
      options[key] = next;
      index += 1;
    }
  }

  return { mode, options };
}

function usage() {
  console.log(`
Usage:
  npm run fr24:export -- <mode> [options]

Modes:
  sandbox-live   Test your token/key with static sandbox data
  live-airport   Export live positions for an airport
  live-bounds    Export live positions in a geographic bounding box
  airport-info   Export airport reference information
  airline-info   Export airline reference information
  summary        Export flight summaries for a time range

Required:
  Set FR24_API_TOKEN before running.

Examples:
  npm run fr24:export -- sandbox-live --airport LHR
  npm run fr24:export -- live-airport --airport LHR --detail light --limit 100
  npm run fr24:export -- live-bounds --bounds "41.0,40.5,-74.5,-73.5" --detail full --limit 1000
  npm run fr24:export -- airport-info --code LHR --detail full
  npm run fr24:export -- airline-info --icao BAW
  npm run fr24:export -- summary --from 2026-05-04T00:00:00Z --to 2026-05-04T12:00:00Z --airports LHR --limit 100

Optional:
  --output "C:\\Users\\you\\Desktop\\fr24_export"
  --detail light|full
  --sort asc|desc
`);
}

function assertOptions(mode, options) {
  if (!modes[mode]) {
    usage();
    throw new Error(mode ? `Unknown mode: ${mode}` : "Missing mode");
  }

  const detail = options.detail ?? "light";
  if (!VALID_DETAILS.has(detail)) {
    throw new Error("--detail must be either light or full");
  }

  for (const required of modes[mode].required) {
    if (!options[required]) {
      throw new Error(`Missing --${required} for ${mode}`);
    }
  }
}

function buildUrl(mode, options) {
  const endpoint = modes[mode].endpoint(options);
  const url = new URL(`${API_BASE}${endpoint}`);
  const params = modes[mode].params(options);

  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== "") {
      url.searchParams.set(key, value);
    }
  }

  return url;
}

function defaultOutputDir() {
  return path.join(homedir(), "Desktop", "fr24_export");
}

function timestamp() {
  return new Date().toISOString().replace(/[:.]/g, "-");
}

async function main() {
  const token = process.env.FR24_API_TOKEN;
  if (!token) {
    usage();
    throw new Error("Set FR24_API_TOKEN before running this exporter");
  }

  const { mode, options } = parseArgs(process.argv.slice(2));
  assertOptions(mode, options);

  const url = buildUrl(mode, options);
  const response = await fetch(url, {
    headers: {
      Accept: "application/json",
      "Accept-Version": "v1",
      Authorization: `Bearer ${token}`,
    },
  });

  const text = await response.text();
  let body;
  try {
    body = JSON.parse(text);
  } catch {
    body = { raw: text };
  }

  if (!response.ok) {
    throw new Error(`FR24 request failed (${response.status} ${response.statusText}): ${JSON.stringify(body, null, 2)}`);
  }

  const outputDir = path.resolve(options.output ?? defaultOutputDir());
  await mkdir(outputDir, { recursive: true });

  const filename = `${timestamp()}_${mode}.json`;
  const outputPath = path.join(outputDir, filename);
  await writeFile(outputPath, `${JSON.stringify(body, null, 2)}\n`, "utf8");

  console.log(`Saved ${mode} export to ${outputPath}`);
}

main().catch((error) => {
  console.error(error.message);
  process.exitCode = 1;
});
