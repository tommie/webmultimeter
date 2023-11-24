import { acceptHMRUpdate, defineStore, skipHydrate } from "pinia";

import { type UM25CConnection, UM25CProtocol } from "../utils/um25c";

export const useViewStore = defineStore("viewStore", () => {
  const units = skipHydrate(
    ref(
      new Map<string, string>(
        Object.entries(
          process.client
            ? JSON.parse(localStorage.getItem("viewStore/units") ?? "{}")
            : [],
        ),
      ),
    ),
  );
  const autoConnect = ref(true);
  const connection = shallowRef<UM25CConnection | null>(null);
  const deviceModel = ref<UM25CProtocol.DeviceModel>(
    UM25CProtocol.DeviceModel.UNKNOWN,
  );
  watch(connection, async (_conn, oldConn) => {
    if (oldConn) {
      await oldConn.close();
    }
  });

  let needsStorage = false;
  function requestStorage() {
    if (needsStorage) return;

    needsStorage = true;

    nextTick(() => {
      needsStorage = false;
      localStorage.setItem(
        "viewStore/units",
        JSON.stringify(Object.fromEntries(units.value.entries())),
      );
    });
  }

  return {
    units,
    autoConnect,
    connection,
    deviceModel,

    getUnits(key: string, def: string) {
      return units.value.get(key) ?? def;
    },

    setUnits(key: string, value: string) {
      units.value.set(key, value);
      requestStorage();
    },

    setAutoConnect(b: boolean) {
      autoConnect.value = b;
    },

    setConnection(
      conn: UM25CConnection | null,
      model: UM25CProtocol.DeviceModel,
    ) {
      connection.value = conn ? markRaw(conn) : null;
      deviceModel.value = model;
    },
  };
});

if (import.meta.hot) {
  import.meta.hot.accept(acceptHMRUpdate(useViewStore, import.meta.hot));
}
