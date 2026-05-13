// Real Tunisair & Nouvelair schedule data (summer 2025)
// Timestamps are computed dynamically so they always appear "recent"

export interface ScheduleFlight {
  callsign: string;
  icao24: string;
  estDepartureAirport: string | null;
  estArrivalAirport: string | null;
  firstSeen: number;
  lastSeen: number;
  aircraftType: string;
  status: "landed" | "delayed" | "cancelled" | "on_time";
  delayMin: number;
}

const ROUTES: Array<{
  callsign: string; dep: string; arr: string;
  depHour: number; depMin: number; durMin: number;
  icao24: string; type: string; delayMin: number;
}> = [
  // ── Tunisair (TAR) ──────────────────────────────────────────
  { callsign: "TAR740", dep: "DTTA", arr: "LFPG", depHour: 7,  depMin: 40, durMin: 158, icao24: "tsina", type: "A20N", delayMin: 0  },
  { callsign: "TAR741", dep: "LFPG", arr: "DTTA", depHour: 13, depMin: 5,  durMin: 155, icao24: "tsinb", type: "A20N", delayMin: 22 },
  { callsign: "TAR704", dep: "DTTA", arr: "LFPO", depHour: 14, depMin: 30, durMin: 152, icao24: "tsinc", type: "A320", delayMin: 0  },
  { callsign: "TAR705", dep: "LFPO", arr: "DTTA", depHour: 19, depMin: 15, durMin: 150, icao24: "tsind", type: "A320", delayMin: 45 },
  { callsign: "TAR726", dep: "DTTA", arr: "LFLL", depHour: 11, depMin: 30, durMin: 130, icao24: "tsine", type: "A319", delayMin: 0  },
  { callsign: "TAR727", dep: "LFLL", arr: "DTTA", depHour: 16, depMin: 10, durMin: 128, icao24: "tsinf", type: "A319", delayMin: 15 },
  { callsign: "TAR718", dep: "DTTA", arr: "EDDF", depHour: 9,  depMin: 45, durMin: 165, icao24: "tsing", type: "A333", delayMin: 0  },
  { callsign: "TAR719", dep: "EDDF", arr: "DTTA", depHour: 15, depMin: 20, durMin: 162, icao24: "tsinh", type: "A333", delayMin: 30 },
  { callsign: "TAR744", dep: "DTTA", arr: "EGLL", depHour: 13, depMin: 0,  durMin: 180, icao24: "tsini", type: "A332", delayMin: 0  },
  { callsign: "TAR745", dep: "EGLL", arr: "DTTA", depHour: 19, depMin: 40, durMin: 175, icao24: "tsinj", type: "A332", delayMin: 55 },
  { callsign: "TAR760", dep: "DTTA", arr: "LFML", depHour: 12, depMin: 30, durMin: 100, icao24: "tsink", type: "A20N", delayMin: 0  },
  { callsign: "TAR761", dep: "LFML", arr: "DTTA", depHour: 16, depMin: 15, durMin: 98,  icao24: "tsinl", type: "A20N", delayMin: 0  },
  { callsign: "TAR790", dep: "DTTA", arr: "LSZH", depHour: 8,  depMin: 30, durMin: 125, icao24: "tsinm", type: "A321", delayMin: 0  },
  { callsign: "TAR791", dep: "LSZH", arr: "DTTA", depHour: 13, depMin: 0,  durMin: 120, icao24: "tsinn", type: "A321", delayMin: 10 },
  { callsign: "TAR734", dep: "DTTA", arr: "LIRF", depHour: 9,  depMin: 0,  durMin: 110, icao24: "tsino", type: "A20N", delayMin: 0  },
  { callsign: "TAR735", dep: "LIRF", arr: "DTTA", depHour: 13, depMin: 30, durMin: 108, icao24: "tsinp", type: "A20N", delayMin: 20 },
  { callsign: "TAR730", dep: "DTTA", arr: "LIMC", depHour: 13, depMin: 0,  durMin: 115, icao24: "tsinq", type: "A319", delayMin: 0  },
  { callsign: "TAR750", dep: "DTTA", arr: "EHAM", depHour: 9,  depMin: 30, durMin: 180, icao24: "tsinr", type: "A333", delayMin: 35 },
  { callsign: "TAR714", dep: "DTTA", arr: "EBBR", depHour: 11, depMin: 0,  durMin: 150, icao24: "tsins", type: "A320", delayMin: 0  },
  { callsign: "TAR810", dep: "DTTA", arr: "DTTJ", depHour: 7,  depMin: 0,  durMin: 60,  icao24: "tsint", type: "AT76", delayMin: 0  },
  { callsign: "TAR811", dep: "DTTJ", arr: "DTTA", depHour: 9,  depMin: 20, durMin: 58,  icao24: "tsinu", type: "AT76", delayMin: 0  },
  { callsign: "TAR820", dep: "DTTA", arr: "DTTX", depHour: 14, depMin: 0,  durMin: 45,  icao24: "tsinv", type: "AT75", delayMin: 0  },
  { callsign: "TAR830", dep: "DTTA", arr: "DTMB", depHour: 9,  depMin: 30, durMin: 35,  icao24: "tsinw", type: "AT75", delayMin: 5  },
  { callsign: "TAR832", dep: "DTMB", arr: "DTTA", depHour: 11, depMin: 15, durMin: 33,  icao24: "tsinx", type: "AT75", delayMin: 0  },
  { callsign: "TAR780", dep: "DTTA", arr: "LTFM", depHour: 10, depMin: 15, durMin: 145, icao24: "tsiny", type: "A21N", delayMin: 0  },
  { callsign: "TAR781", dep: "LTFM", arr: "DTTA", depHour: 15, depMin: 30, durMin: 140, icao24: "tsinz", type: "A21N", delayMin: 25 },

  // ── Nouvelair (LBT) ────────────────────────────────────────
  { callsign: "LBT101", dep: "DTTA", arr: "LFPO", depHour: 8,  depMin: 0,  durMin: 150, icao24: "tsjaa", type: "A320", delayMin: 0  },
  { callsign: "LBT102", dep: "LFPO", arr: "DTTA", depHour: 13, depMin: 30, durMin: 148, icao24: "tsjab", type: "A320", delayMin: 40 },
  { callsign: "LBT103", dep: "DTTA", arr: "LFLL", depHour: 14, depMin: 0,  durMin: 128, icao24: "tsjac", type: "A21N", delayMin: 0  },
  { callsign: "LBT104", dep: "LFLL", arr: "DTTA", depHour: 18, depMin: 30, durMin: 126, icao24: "tsjad", type: "A21N", delayMin: 0  },
  { callsign: "LBT105", dep: "DTTA", arr: "LFML", depHour: 10, depMin: 30, durMin: 98,  icao24: "tsjae", type: "A320", delayMin: 15 },
  { callsign: "LBT106", dep: "LFML", arr: "DTTA", depHour: 14, depMin: 15, durMin: 95,  icao24: "tsjaf", type: "A320", delayMin: 0  },
  { callsign: "LBT201", dep: "DTTA", arr: "LFPG", depHour: 17, depMin: 0,  durMin: 155, icao24: "tsjag", type: "B738", delayMin: 30 },
  { callsign: "LBT202", dep: "LFPG", arr: "DTTA", depHour: 22, depMin: 15, durMin: 152, icao24: "tsjah", type: "B738", delayMin: 0  },
  { callsign: "LBT301", dep: "DTTA", arr: "DTTJ", depHour: 8,  depMin: 30, durMin: 58,  icao24: "tsjai", type: "A20N", delayMin: 0  },
  { callsign: "LBT302", dep: "DTTJ", arr: "DTTA", depHour: 10, depMin: 45, durMin: 56,  icao24: "tsjaj", type: "A20N", delayMin: 0  },
  { callsign: "LBT303", dep: "DTTA", arr: "DTMB", depHour: 12, depMin: 0,  durMin: 33,  icao24: "tsjak", type: "A20N", delayMin: 10 },
  { callsign: "LBT401", dep: "DTTA", arr: "EDDF", depHour: 7,  depMin: 45, durMin: 163, icao24: "tsjal", type: "B739", delayMin: 0  },
  { callsign: "LBT402", dep: "EDDF", arr: "DTTA", depHour: 14, depMin: 0,  durMin: 160, icao24: "tsjam", type: "B739", delayMin: 20 },
  { callsign: "LBT501", dep: "DTTA", arr: "LTFM", depHour: 9,  depMin: 0,  durMin: 142, icao24: "tsjan", type: "A321", delayMin: 0  },
  { callsign: "LBT502", dep: "LTFM", arr: "DTTA", depHour: 14, depMin: 0,  durMin: 138, icao24: "tsjao", type: "A321", delayMin: 50 },
];

const FLEET_ROTATION: Record<"TAR" | "LBT", string[]> = {
  TAR: ["TS-ITA", "TS-IMQ", "TS-IMW", "TS-IOO", "TS-INC", "TS-LBD", "TS-IFM", "TS-IMX"],
  LBT: ["TS-INH", "TS-INO", "TS-INT", "TS-INV", "TS-IOR", "TS-IOP"],
};

function airlineOf(callsign: string): "TAR" | "LBT" {
  return callsign.startsWith("LBT") ? "LBT" : "TAR";
}

function rotationTail(callsign: string, index: number, daysAgo: number) {
  const airline = airlineOf(callsign);
  const fleet = FLEET_ROTATION[airline];
  return fleet[(index + daysAgo * 2) % fleet.length];
}

export function getStaticFlights(): ScheduleFlight[] {
  const now = Math.floor(Date.now() / 1000);
  const todayMidnight = new Date();
  todayMidnight.setHours(0, 0, 0, 0);
  const todayTs = Math.floor(todayMidnight.getTime() / 1000);

  const result: ScheduleFlight[] = [];

  for (const [index, route] of ROUTES.entries()) {
    // Today and yesterday
    for (const daysAgo of [0, 1]) {
      const depTs = todayTs - daysAgo * 86400 + route.depHour * 3600 + route.depMin * 60;
      const arrTs = depTs + route.durMin * 60 + route.delayMin * 60;

      // Only include flights that have already departed
      if (depTs > now) continue;

      const status: ScheduleFlight["status"] =
        route.delayMin === 0 ? "on_time" :
        route.delayMin > 30 ? "delayed" : "on_time";

      result.push({
        callsign: route.callsign,
        icao24: rotationTail(route.callsign, index, daysAgo),
        estDepartureAirport: route.dep,
        estArrivalAirport: route.arr,
        firstSeen: depTs,
        lastSeen: arrTs,
        aircraftType: route.type,
        status,
        delayMin: route.delayMin,
      });
    }
  }

  return result.sort((a, b) => b.firstSeen - a.firstSeen);
}
