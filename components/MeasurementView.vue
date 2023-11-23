<script setup lang="ts">
import { type UM25CConnection, UM25CProtocol } from "../utils/um25c";

const props = defineProps<{
  conn: Readonly<UM25CConnection>;
}>();

const dataStore = useDataStore();
const readInterval = ref<ReturnType<typeof setInterval>>();
const readError = ref<Error>();
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

    let reading = false;
    readInterval.value = setInterval(async () => {
      if (reading) return;

      reading = true;

      try {
        const data = await conn.readData();
        dataStore.addDataPoint(data);
        readError.value = undefined;
      } catch (e) {
        readInterval.value = undefined;

        if (e instanceof DOMException && e.name === "AbortError") {
          return;
        }

        readError.value = e as Error;
        console.error("Reading measurement failed:", e);
      } finally {
        reading = false;
      }
    }, 1000);
  },
  { immediate: true },
);

function activeGroupIndices() {
  return dataStore.latestDataPoint.groups
    .map(
      (group, index) =>
        [index, group] as [number, UM25CProtocol.GroupDataPoint],
    )
    .filter(([index, group]) => group.energy > 0)
    .map(([index]) => index);
}

const groupMeasurementGraph = ref<"charge" | "energy">("energy");
function onClickCumulativeCaption() {
  groupMeasurementGraph.value =
    groupMeasurementGraph.value === "charge" ? "energy" : "charge";
}

function onResetGroup(index: number) {
  return props.conn.clickButton(UM25CProtocol.Button.RESET_GROUP);
}
</script>

<template>
  <div class="grid">
    <Message class="col-12" v-if="readError">
      {{ readError }}
    </Message>

    <div class="col-2">
      <MeasurementDisplay
        v-if="dataStore.latestDataPoint"
        :value="dataStore.latestDataPoint"
        @resetgroup="onResetGroup"
      />
    </div>

    <div class="col-10">
      <ClientOnly>
        <figure>
          <caption>
            Voltage
          </caption>
          <PlotLane
            class="plot"
            :value="dataStore.dataPoints.map((v) => [v.timestamp, v.voltage])"
            unit="V"
          />
        </figure>
        <figure>
          <caption>
            Current
          </caption>
          <PlotLane
            class="plot"
            :value="
              dataStore.dataPoints.map((v) => [v.timestamp, v.current * 1000])
            "
            unit="mA"
          />
        </figure>
        <figure v-for="index in activeGroupIndices()" :key="index">
          <caption
            class="cursor-pointer hover:text-primary"
            @click="onClickCumulativeCaption"
          >
            {{
              index ? `Group ${index}` : undefined
            }}
            Cumulative
            {{
              groupMeasurementGraph === "charge" ? "Charge" : "Energy"
            }}
          </caption>
          <PlotLane
            class="plot"
            :value="
              dataStore.dataPoints.map((v) => [
                v.timestamp,
                v.groups[index][groupMeasurementGraph] * 1000 * 3600,
              ])
            "
            :unit="groupMeasurementGraph === 'charge' ? 'mAh' : 'mWh'"
          />
        </figure>
      </ClientOnly>
    </div>
  </div>
</template>

<style scoped>
figure > caption {
  display: block;
  text-align: center;
}

.plot {
  height: 33vh;
}
</style>
