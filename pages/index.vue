<script setup lang="ts">
import type DeviceSelector from "../components/DeviceSelector.vue";
import { type UM25CConnection, UM25CProtocol } from "../utils/um25c";

const viewStore = useViewStore();
const selectorRef = ref<typeof DeviceSelector>();
onMounted(async () => {
  if (!viewStore.autoConnect || !selectorRef.value) return;

  selectorRef.value.autoConnect();
});

async function onConnected(connection: UM25CConnection) {
  viewStore.setConnection(
    connection,
    (await connection.readData()).deviceModel,
  );
}

async function onClickClose() {
  viewStore.setConnection(null, UM25CProtocol.DeviceModel.UNKNOWN);
}
</script>

<template>
  <div>
    <DeviceSelector
      ref="selectorRef"
      v-if="!viewStore.connection"
      @connected="onConnected"
    />
    <div v-else>
      <Toolbar>
        <template #start>
          <Button label="Close" @click="onClickClose" />
        </template>
        <template #end>
          <ConnectionStateIndicator :conn="viewStore.connection" />
          <div class="ml-3 text-color-secondary hover:text-color">
            Connected to a
            {{ UM25CProtocol.DeviceModel[viewStore.deviceModel] }}
          </div>
        </template>
      </Toolbar>

      <MeasurementView :conn="viewStore.connection" />
    </div>
  </div>
</template>
