<script setup lang="ts">
import { type UM25CConnection } from "../utils/um25c";
import { type ComputedUnit } from "./MeasurementDisplayValue.vue";

defineProps<{
  value: UM25CConnection.TimestampedDataPoint;
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
</script>

<template>
  <div>
    <Fieldset
      legend="Snapshot"
      :pt="{ content: { class: 'flex flex-column gap-3' } }"
    >
      <MeasurementDisplayValue
        label="Voltage"
        :value="value.voltage"
        unit="V"
      />
      <MeasurementDisplayValue
        label="Current"
        :value="value.current"
        unit="A"
      />
      <MeasurementDisplayValue label="Power" :value="value.power" unit="W" />
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
        v-if="group.energy || group.charge"
        :legend="`Group ${index}`"
        class="my-3"
        :pt="{ content: { class: 'flex flex-column gap-3' } }"
      >
        <MeasurementDisplayValue
          label="Energy"
          :value="group.energy"
          size="sm"
          :units="ENERGY_UNITS"
          :unit="viewStore.getUnits('energy', 'J')"
          @update:unit="(unit) => viewStore.setUnits('energy', unit)"
        />
        <MeasurementDisplayValue
          label="Charge"
          :value="group.charge"
          size="sm"
          :units="CHARGE_UNITS"
          :unit="viewStore.getUnits('charge', 'C')"
          @update:unit="(unit) => viewStore.setUnits('charge', unit)"
        />
      </Fieldset>
    </template>
  </div>
</template>