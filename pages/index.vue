<script setup lang="ts">
import { type UM25CConnection } from "../utils/um25c";

const conn = shallowRef<UM25CConnection>();
onUnmounted(async () => {
  await conn.value?.close();
});
watch(conn, async (_conn, oldConn) => {
  await oldConn?.close();
});

function onConnected(connection: UM25CConnection) {
  conn.value = connection;
}

async function onClickClose() {
  conn.value = undefined;
}
</script>

<template>
  <div>
    <!-- Using v-show so auto-connect only happens on first mount. -->
    <DeviceSelector v-show="!conn" auto-connect @connected="onConnected" />
    <div v-if="conn">
      <Toolbar>
        <template #start>
          <Button @click="onClickClose">Close</Button>
        </template>
      </Toolbar>

      <MeasurementView :conn="conn" />
    </div>
  </div>
</template>
