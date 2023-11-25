<script setup lang="ts">
import { type UM25CConnection, UM25CProtocol } from "../utils/um25c";

const props = defineProps<{
  conn: Readonly<UM25CConnection>;
}>();

const dataStore = useDataStore();
const readError = ref<Error>();
async function openDatabase() {
  try {
    await dataStore.openDatabase();
  } catch (e) {
    console.error("Opening the database failed:", e);
    readError.value = e as Error;
  }
}
onMounted(() => openDatabase());
watch(
  () => dataStore.databaseOpen,
  (databaseOpen) => {
    if (databaseOpen) return;

    return openDatabase();
  },
);

const viewStore = useViewStore();
const readInterval = ref<ReturnType<typeof setInterval>>();
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
  return (
    dataStore.latestDataPoint?.groups
      .map(
        (group, index) =>
          [index, group] as [number, UM25CProtocol.GroupDataPoint],
      )
      .filter(([index, group]) => group.energy > 0)
      .map(([index]) => index) ?? []
  );
}

const groupMeasurementGraph = ref<"charge" | "energy">("energy");
function onClickCumulativeCaption() {
  groupMeasurementGraph.value =
    groupMeasurementGraph.value === "charge" ? "energy" : "charge";
}

const groupUnit = computed(() => {
  const units = viewStore.getUnits(
    groupMeasurementGraph.value,
    groupMeasurementGraph.value === "charge" ? "C" : "J",
  );
  let fn = (v: number) => v;
  if (units === "Ah" || units === "Wh") {
    fn = (v: number) => v * 3600;
  } else {
    fn = (v: number) => v;
  }

  switch (groupMeasurementGraph.value) {
    case "charge":
      return {
        label: "Charge",
        units,
        fn,
      };
    case "energy":
      return {
        label: "Energy",
        units,
        fn,
      };
  }
});

function onActivateGroup(index: number) {
  return props.conn.selectGroup(index);
}

function onResetGroup(index: number) {
  return props.conn.clickButton(UM25CProtocol.Button.RESET_GROUP);
}
</script>

<template>
  <div class="grid">
    <Message class="col-12" severity="error" :closable="false" v-if="readError">
      {{ readError }}
    </Message>

    <div class="col-2">
      <MeasurementDisplay
        v-if="dataStore.latestDataPoint"
        :value="dataStore.latestDataPoint"
        @activategroup="onActivateGroup"
        @resetgroup="onResetGroup"
      />
    </div>

    <div class="col-10">
      <ClientOnly>
        <figure>
          <caption>
            Power
          </caption>
          <PlotLane
            class="plot"
            :value="dataStore.dataPoints.map((v) => [v.timestamp, v.power])"
            unit="W"
          />
        </figure>
        <figure>
          <caption>
            Current
          </caption>
          <PlotLane
            class="plot"
            :value="dataStore.dataPoints.map((v) => [v.timestamp, v.current])"
            unit="A"
          />
        </figure>
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
              groupUnit.label
            }}
          </caption>
          <PlotLane
            class="plot"
            :value="
              dataStore.dataPoints.map((v) => [
                v.timestamp,
                groupUnit.fn(v.groups[index][groupMeasurementGraph]),
              ])
            "
            :unit="groupUnit.units"
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
