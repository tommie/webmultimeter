<script setup lang="ts">
import { type UM25CConnection } from "../utils/um25c";
import { type ComputedUnit } from "./MeasurementDisplayValue.vue";

const props = defineProps<{
  value: UM25CConnection.TimestampedDataPoint;
}>();

const emit = defineEmits<{
  (e: "activategroup", index: number): void;
  (e: "resetgroup", index: number): void;
}>();

const viewStore = useViewStore();

const TEMPERATURE_UNITS: ComputedUnit[] = [
  { label: "℃", fn: (v) => v },
  { label: "℉", fn: (v) => v * 1.8 + 32 },
];

const ENERGY_UNITS: ComputedUnit[] = [
  { label: "J", fn: (v) => v },
  { label: "Wh", fn: (v) => v * 3600 },
];

const CHARGE_UNITS: ComputedUnit[] = [
  { label: "C", fn: (v) => v },
  { label: "Ah", fn: (v) => v * 3600 },
];

const targetGroup = ref(props.value.screen.group);
watch(
  () => props.value.screen.group,
  (group) => {
    targetGroup.value = group;
  },
);

const targetGroupTimeout = ref<ReturnType<typeof setTimeout>>();
onUnmounted(() => {
  if (targetGroupTimeout.value) clearTimeout(targetGroupTimeout.value);
});

function onClickGroupActivate(index: number) {
  targetGroup.value = index;
  emit("activategroup", index);

  // Communication may be spotty, so revert after a timeout. There is no
  // command ack in the protocol.
  targetGroupTimeout.value = setTimeout(() => {
    targetGroupTimeout.value = undefined;
    targetGroup.value = props.value.screen.group;
  }, 10000);
}
</script>

<template>
  <div>
    <Fieldset
      legend="Snapshot"
      :pt="{ content: { class: 'flex flex-column gap-3' } }"
    >
      <MeasurementDisplayValue label="Power" :value="value.power" unit="W" />
      <MeasurementDisplayValue
        label="Current"
        :value="value.current"
        unit="A"
      />
      <MeasurementDisplayValue
        label="Voltage"
        :value="value.voltage"
        unit="V"
      />
      <MeasurementDisplayValue
        label="Temperature"
        :value="value.temperature.celsius"
        :decimals="0"
        :units="TEMPERATURE_UNITS"
        :unit="viewStore.getUnits('temperature', '℃')"
        @update:unit="(unit) => viewStore.setUnits('temperature', unit)"
      />

      <div class="text-xs">
        At {{ new Date(value.timestamp).toLocaleString() }}
      </div>
    </Fieldset>
    <template v-for="(group, index) in value.groups" :key="index">
      <Fieldset
        v-if="index === 0 || group.energy || group.charge"
        :legend="index ? `Group ${index}` : 'Since Power-On'"
        toggleable
        class="my-3"
        :pt="{ content: { class: 'flex flex-column gap-3' } }"
      >
        <div class="grid">
          <MeasurementDisplayValue
            class="col-12 md:col-6"
            label="Energy"
            :value="group.energy"
            size="sm"
            :units="ENERGY_UNITS"
            :unit="viewStore.getUnits('energy', 'J')"
            @update:unit="(unit) => viewStore.setUnits('energy', unit)"
          />
          <MeasurementDisplayValue
            class="col-12 md:col-6"
            label="Charge"
            :value="group.charge"
            size="sm"
            :units="CHARGE_UNITS"
            :unit="viewStore.getUnits('charge', 'C')"
            @update:unit="(unit) => viewStore.setUnits('charge', unit)"
          />
        </div>
        <div class="grid">
          <div class="col-12 md:col-6 text-center">
            <RadioButton
              class="active-button"
              title="Selects this group for recording energy and charge"
              aria-label="Selects this group for recording energy and charge"
              :value="index"
              :model-value="value.screen.group"
              :disabled="targetGroup !== value.screen.group"
              @click="() => onClickGroupActivate(index)"
            />
          </div>
          <Button
            class="col-12 md:col-6 reset-button"
            label="Reset"
            severity="warning"
            size="small"
            text
            @click="() => emit('resetgroup', index)"
          />
        </div>
      </Fieldset>
    </template>
  </div>
</template>

<style scoped>
/* Dim it down a bit, since it's hardly an urgent action. */
.reset-button:not(:hover) {
  opacity: 0.8;
}
</style>
