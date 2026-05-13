import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";

type SnapshotKind = "live" | "history" | "delays";

type StoredSnapshot = {
  capturedAt: string;
  data: unknown;
};

type VolsStore = {
  updatedAt: string;
  live: StoredSnapshot[];
  history: StoredSnapshot[];
  delays: StoredSnapshot[];
};

const MAX_SNAPSHOTS = 1000;
const STORE_PATH = path.join(process.cwd(), "data", "vols-data.json");

let writeQueue = Promise.resolve();

async function readStore(): Promise<VolsStore> {
  try {
    const text = await readFile(STORE_PATH, "utf8");
    const parsed = JSON.parse(text) as Partial<VolsStore>;

    return {
      updatedAt: parsed.updatedAt || new Date().toISOString(),
      live: Array.isArray(parsed.live) ? parsed.live : [],
      history: Array.isArray(parsed.history) ? parsed.history : [],
      delays: Array.isArray(parsed.delays) ? parsed.delays : [],
    };
  } catch {
    return {
      updatedAt: new Date().toISOString(),
      live: [],
      history: [],
      delays: [],
    };
  }
}

export function saveVolsSnapshot(kind: SnapshotKind, data: unknown) {
  writeQueue = writeQueue
    .then(async () => {
      const store = await readStore();
      const snapshot = { capturedAt: new Date().toISOString(), data };

      store[kind] = [snapshot, ...store[kind]].slice(0, MAX_SNAPSHOTS);
      store.updatedAt = snapshot.capturedAt;

      await mkdir(path.dirname(STORE_PATH), { recursive: true });
      await writeFile(STORE_PATH, `${JSON.stringify(store, null, 2)}\n`, "utf8");
    })
    .catch(() => undefined);

  return writeQueue;
}

export const volsStorePath = STORE_PATH;
