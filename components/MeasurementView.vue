<script setup lang="ts">
import { type UM25CConnection, UM25CProtocol } from "../utils/um25c";

const props = defineProps<{
  conn: UM25CConnection;
}>();

const dataStore = useDataStore();
const readInterval = ref<ReturnType<typeof setInterval>>();
const readStatus = ref<boolean | Error>(false);
onUnmounted(() => {
  if (readInterval.value) clearInterval(readInterval.value);
});
watch(readInterval, (_readInterval, oldReadInterval) => {
  if (oldReadInterval) clearInterval(oldReadInterval);
});
watch(
  () => props.conn,
  async (conn, oldConn) => {
    if (oldConn) {
      readInterval.value = undefined;
    }

    if (!conn) return;

    readInterval.value = setInterval(async () => {
      if (readStatus.value) return;

      readStatus.value = true;

      try {
        const data = await conn.readData();
        dataStore.addDataPoint(data);
      } catch (e) {
        readInterval.value = undefined;

        if (e instanceof DOMException && e.name === "AbortError") {
          return;
        }

        readStatus.value = e as Error;
        console.error("Reading measurement failed:", e);
      } finally {
        if (readStatus.value === true) readStatus.value = false;
      }
    }, 1000);
  },
  { immediate: true },
);

function onResetGroup(index: number) {
  return props.conn.clickButton(UM25CProtocol.Button.RESET_GROUP);
}
</script>

<template>
  <div class="grid">
    <Message class="col-12" v-if="readStatus && readStatus !== true">{{
      readStatus
    }}</Message>

    <div class="col-2">
      <Badge :class="[readStatus ? 'bg-teal-200' : 'surface-ground']"></Badge>
      <MeasurementDisplay
        v-if="dataStore.latestDataPoint"
        :value="dataStore.latestDataPoint"
        @resetgroup="onResetGroup"
      />
    </div>

    <div class="col-10">
      <ClientOnly>
        <PlotLane
          :value="dataStore.dataPoints.map((v) => [v.timestamp, v.voltage])"
          unit="V"
        />
        <PlotLane
          :value="
            dataStore.dataPoints.map((v) => [v.timestamp, v.current * 1000])
          "
          unit="mA"
        />
        <PlotLane
          :value="
            dataStore.dataPoints.map((v) => [
              v.timestamp,
              v.groups[0].energy * 1000 * 3600,
            ])
          "
          unit="mWh"
        />
      </ClientOnly>
    </div>
  </div>
</template>
