<script setup lang="ts">
import { type UM25CConnection, UM25CProtocol } from "../utils/um25c";

const hadConn = ref(false);
const conn = shallowRef<UM25CConnection>();
const deviceModel = ref<UM25CProtocol.DeviceModel>(
  UM25CProtocol.DeviceModel.UNKNOWN,
);
onUnmounted(async () => {
  await conn.value?.close();
});
watch(conn, async (conn, oldConn) => {
  deviceModel.value = UM25CProtocol.DeviceModel.UNKNOWN;
  await oldConn?.close();

  if (!conn) return;

  hadConn.value = true;

  const data = await conn.readData();
  deviceModel.value = data.deviceModel;
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
    <DeviceSelector
      v-if="!conn"
      :auto-connect="!hadConn"
      @connected="onConnected"
    />
    <div v-if="conn">
      <Toolbar>
        <template #start>
          <Button label="Close" @click="onClickClose" />
        </template>
        <template #end>
          <ConnectionStateIndicator :conn="conn" />
          <div class="ml-3 text-color-secondary hover:text-color">
            Connected to a {{ UM25CProtocol.DeviceModel[deviceModel] }}
          </div>
        </template>
      </Toolbar>

      <MeasurementView :conn="conn" />
    </div>
  </div>
</template>
