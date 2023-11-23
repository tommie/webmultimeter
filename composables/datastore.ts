import { acceptHMRUpdate, defineStore } from "pinia";

import { type UM25CConnection } from "../utils/um25c";

export const useDataStore = defineStore("dataStore", () => {
  const dataPoints = ref<UM25CConnection.TimestampedDataPoint[]>(
    JSON.parse(localStorage.getItem("dataStore/points") ?? "[]"),
  );

  // 6000 is too large for Chrome's local storage item.
  const MAX_DATA_POINTS = 1 << 12;

  function pruneDataPoints() {
    if (dataPoints.value.length <= MAX_DATA_POINTS) {
      return;
    }

    dataPoints.value = dataPoints.value.filter(
      (_v, index) => index >= MAX_DATA_POINTS / 2 || index % 2 === 1,
    );
  }

  let timeout: ReturnType<typeof setTimeout> | undefined;
  onScopeDispose(() => {
    if (timeout) clearTimeout(timeout);
  });

  function requestStorage() {
    if (timeout) return;

    timeout = setTimeout(() => {
      timeout = undefined;
      localStorage.setItem(
        "dataStore/points",
        JSON.stringify(dataPoints.value),
      );
    }, 10000);
  }

  return {
    dataPoints,

    latestDataPoint: computed(
      () => dataPoints.value[dataPoints.value.length - 1],
    ),

    addDataPoint(p: UM25CConnection.TimestampedDataPoint) {
      dataPoints.value.push(p);
      pruneDataPoints();
      requestStorage();
    },

    clearDataPoints() {
      dataPoints.value.splice(0, dataPoints.value.length);
      requestStorage();
    },
  };
});

if (import.meta.hot) {
  import.meta.hot.accept(acceptHMRUpdate(useDataStore, import.meta.hot));
}
