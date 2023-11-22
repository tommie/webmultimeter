import { acceptHMRUpdate, defineStore } from "pinia";

export const useViewStore = defineStore("viewStore", () => {
  const units = ref(
    new Map<string, string>(
      Object.entries(localStorage.getItem("viewStore/units") ?? "{}"),
    ),
  );

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

    getUnits(key: string, def: string) {
      return units.value.get(key) ?? def;
    },

    setUnits(key: string, value: string) {
      units.value.set(key, value);
      requestStorage();
    },
  };
});

if (import.meta.hot) {
  import.meta.hot.accept(acceptHMRUpdate(useViewStore, import.meta.hot));
}
