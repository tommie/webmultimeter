<script setup lang="ts">
import type DeviceSelector from "../components/DeviceSelector.vue";
import { type UM25CConnection, UM25CProtocol } from "../utils/um25c";

const viewStore = useViewStore();
const selectorRef = ref<typeof DeviceSelector>();
watch(selectorRef, async (selectorRef) => {
  if (!selectorRef) return;

  if (!viewStore.autoConnect || !selectorRef) return;

  selectorRef.autoConnect();
});

async function onConnected(connection: UM25CConnection) {
  viewStore.setConnection(
    connection,
    (await connection.readData()).deviceModel,
  );
  viewStore.setAutoConnect(false);
}
</script>

<template>
  <Dialog :visible="true" modal :closable="false" header="Select Device">
    <DeviceSelector
      ref="selectorRef"
      v-if="!viewStore.connection"
      @connected="onConnected"
    />
  </Dialog>
</template>
