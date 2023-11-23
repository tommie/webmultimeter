<script lang="ts">
export interface ComputedUnit {
  label: string;
  fn: (v: number) => number;
  decimals?: number;
}
</script>

<script setup lang="ts">
const props = withDefaults(
  defineProps<{
    label: string;
    value: number;
    unit: string;
    units?: ComputedUnit[];
    decimals?: number;
    size?: "mid" | "sm";
  }>(),
  {
    units: () => [],
    decimals: 1,
    size: "mid",
  },
);

const emit = defineEmits<{
  (e: "update:unit", unit: string): void;
}>();

const PREFIXES: [string, number][] = [
  ["T", 12],
  ["G", 9],
  ["M", 6],
  ["k", 3],
  ["", 0],
  ["m", -3],
  ["µ", -6],
  ["n", -9],
  ["p", -12],
];

const unit = ref(
  props.units.find((v) => v.label === props.unit) ?? {
    label: props.unit,
    fn: (v) => v,
    decimals: props.decimals,
  },
);
watch(
  [() => props.unit, () => props.units, () => props.decimals],
  ([u, units, decimals]) => {
    unit.value = units.find((v) => v.label === u) ?? {
      label: u,
      fn: (v) => v,
      decimals,
    };
  },
);

const scaled = computed(() => {
  const value = unit.value.fn(props.value);

  for (const [label, exp10] of PREFIXES) {
    const base = Math.pow(10, exp10);
    if (value >= base) {
      return [(value / base).toFixed(unit.value.decimals), label];
    }
  }

  return ["0", ""];
});

function onClick() {
  const i = props.units.findIndex((v) => v.label === unit.value.label);
  if (i < 0) return;

  unit.value = props.units[(i + 1) % props.units.length];
  emit("update:unit", unit.value.label);
}
</script>

<template>
  <div
    :class="[
      'flex flex-column text-right root',
      props.units?.length > 1 ? 'has-units' : undefined,
    ]"
    @click="onClick"
  >
    <div :class="['label', size === 'mid' ? 'text-sm' : 'text-xs']">
      {{ label }}
    </div>
    <div :class="['value', 'flex-1', size === 'mid' ? 'text-5xl' : 'text-2xl']">
      {{ scaled[0] }} {{ scaled[1] }}{{ unit.label }}
    </div>
  </div>
</template>

<style scoped>
.label {
  color: var(--text-color-secondary);
}

.has-units {
  cursor: pointer;
}

.root:hover .label,
.root:hover .value {
  color: var(--primary-color) !important;
}
</style>
