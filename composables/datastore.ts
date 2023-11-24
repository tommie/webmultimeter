import { acceptHMRUpdate, defineStore } from "pinia";

import { type UM25CConnection } from "../utils/um25c";

function openIndexedDB(name: string) {
  return new Promise<IDBDatabase>((resolve, reject) => {
    const req = indexedDB.open(name, 1);

    req.onerror = (e) => {
      console.error(e);
      reject(req.error);
    };

    req.onblocked = () => {
      reject(
        new Error("Database already open at older version; unable to upgrade"),
      );
    };

    req.onupgradeneeded = (e) => {
      const db = req.result;

      // The success event fires after any transaction started here finishes.
      if (e.oldVersion < 1) {
        const dataPoints = db.createObjectStore("dataPoints", {
          keyPath: "key",
          autoIncrement: true,
        });
      }
    };

    req.onsuccess = (e) => {
      resolve(req.result);
    };
  });
}

function requestPromise<R extends IDBRequest, T = R["result"]>(req: R) {
  return new Promise<T>(async (resolve, reject) => {
    req.onerror = (e) => {
      console.error(e);
      reject(req.error);
    };

    req.onsuccess = (e) => {
      resolve(req.result);
    };
  });
}

function readSeries(tx: IDBTransaction, seriesName: string) {
  return requestPromise(
    tx
      .objectStore("dataPoints")
      .getAll(
        IDBKeyRange.bound([seriesName, 0], [seriesName, Number.MAX_VALUE]),
      ),
  ) as Promise<StoredDataPoint[]>;
}

function writeDataPoint(
  tx: IDBTransaction,
  seriesName: string,
  point: UM25CConnection.TimestampedDataPoint,
) {
  return requestPromise(
    tx
      .objectStore("dataPoints")
      .put({ ...point, key: [seriesName, point.timestamp] }),
  );
}

function clearSeries(
  tx: IDBTransaction,
  seriesName: string,
  timeRange: [number, number] = [0, Number.MAX_VALUE],
  upperOpen = false,
) {
  return requestPromise(
    tx
      .objectStore("dataPoints")
      .delete(
        IDBKeyRange.bound(
          [seriesName, timeRange[0]],
          [seriesName, timeRange[1]],
          false,
          upperOpen,
        ),
      ),
  );
}

interface StoredDataPoint extends UM25CConnection.TimestampedDataPoint {
  key: [string, number];
}

export const useDataStore = defineStore("dataStore", () => {
  const idb = shallowRef<IDBDatabase>();
  onScopeDispose(() => {
    idb.value?.close();
  });

  const dataPoints = ref<UM25CConnection.TimestampedDataPoint[]>(
    JSON.parse(localStorage.getItem("dataStore/points") ?? "[]"),
  );
  watch(idb, async (idb) => {
    if (!idb) return;

    const tx = idb.transaction("dataPoints", "readonly");
    dataPoints.value = await readSeries(tx, "default");
  });

  return {
    databaseOpen: computed(() => Boolean(idb.value)),

    async openDatabase() {
      idb.value = await openIndexedDB("webmultimeter");
    },

    dataPoints,

    latestDataPoint: computed(
      () => dataPoints.value[dataPoints.value.length - 1],
    ),

    async addDataPoint(p: UM25CConnection.TimestampedDataPoint) {
      if (!idb.value) return;

      dataPoints.value.push(p);
      await writeDataPoint(
        idb.value.transaction("dataPoints", "readwrite"),
        "default",
        p,
      );
    },

    async clearDataPoints() {
      if (!idb.value) return;

      dataPoints.value = [];
      await clearSeries(
        idb.value.transaction("dataPoints", "readwrite"),
        "default",
      );
    },
  };
});

if (import.meta.hot) {
  import.meta.hot.accept(acceptHMRUpdate(useDataStore, import.meta.hot));
}
