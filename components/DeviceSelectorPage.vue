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
