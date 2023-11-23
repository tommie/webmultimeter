<script setup lang="ts">
import { UM25CProtocol } from "../utils/um25c";

const viewStore = useViewStore();
async function onClickClose() {
  viewStore.setConnection(null, UM25CProtocol.DeviceModel.UNKNOWN);
}
</script>

<template>
  <div>
    <DeviceSelectorPage v-if="!viewStore.connection" />
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
