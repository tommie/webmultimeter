<script setup lang="ts">
import * as d3 from "d3";

const props = defineProps<{
  value: [number, number][];
  unit?: string;
}>();

// Declare the chart dimensions and margins.
const width = ref(300);
const height = ref(100);
const marginTop = 20;
const marginRight = 30;
const marginBottom = 30;
const marginLeft = 40;

// Create the SVG container.
const svg = d3
  .create("svg")
  .attr("style", "max-width: 100%; height: auto; height: intrinsic;");
watch(
  [width, height],
  ([width, height]) => {
    svg.attr("viewBox", [0, 0, width, height]);
  },
  { immediate: true },
);

// Add the x-axis.
const xAxis = svg
  .append("g")
  .attr("transform", `translate(0,${height.value - marginBottom})`);
watch(
  height,
  (height) => {
    xAxis.attr("transform", `translate(0,${height - marginBottom})`);
  },
  { immediate: true },
);

// Add the y-axis, remove the domain line, add grid lines and a label.
const yAxis = svg
  .append("g")
  .call((g) => g.select(".domain").remove())
  .attr("transform", `translate(${width.value - marginRight},0)`)
  .call((g) =>
    g
      .selectAll(".tick line")
      .clone()
      .attr("x2", width.value - marginLeft - marginRight)
      .attr("stroke-opacity", 0.1),
  );
watch(
  width,
  (width) => {
    yAxis.attr("transform", `translate(${width - marginRight},0)`).call((g) =>
      g
        .selectAll(".tick line")
        .clone()
        .attr("x2", width - marginLeft - marginRight)
        .attr("stroke-opacity", 0.1),
    );
  },
  { immediate: true },
);

// Append a path for the line.
const series = svg
  .append("path")
  .attr("fill", "none")
  .attr("stroke", "steelblue")
  .attr("stroke-width", 1.5);

watch(
  [() => props.value, width, height],
  ([value, width, height]) => {
    if (!value?.length) return;

    const x = d3.scaleUtc(d3.extent(value, (d) => d[0]) as [number, number], [
      marginLeft,
      width - marginRight,
    ]);
    xAxis.call(
      d3
        .axisBottom(x)
        .ticks(width / 80)
        .tickSizeOuter(0),
    );

    const y = d3.scaleLinear(
      [0, d3.max(value, (d) => d[1])!],
      [height - marginBottom, marginTop],
    );
    yAxis.call(d3.axisRight(y).ticks(height / 40));

    const line = d3
      .line()
      .x((d) => x(d[0]))
      .y((d) => y(d[1]));

    series.attr("d", line(value));
  },
  { deep: true, immediate: true },
);
watch(
  () => props.unit,
  (unit) => {
    if (!unit) return;

    yAxis.call((g) =>
      g
        .append("text")
        .attr("x", 0)
        .attr("y", marginTop * 0.8)
        .attr("fill", "currentColor")
        .attr("text-anchor", "start")
        .text(unit),
    );
  },
  { deep: true, immediate: true },
);

const rootRef = shallowRef<HTMLDivElement | null>(null);
onMounted(() => {
  const node = svg.node();

  if (!node || !rootRef.value) return;

  rootRef.value.append(node);
});

const onWindowResize = () => {
  if (!rootRef.value) return;

  width.value = rootRef.value.clientWidth;
  height.value = rootRef.value.clientHeight;
};
onMounted(() => {
  window.addEventListener("resize", onWindowResize);
  onWindowResize();
});
onUnmounted(() => {
  window.removeEventListener("resize", onWindowResize);
});
</script>

<template>
  <div ref="rootRef" />
</template>

<style scoped>
div {
  width: 100%;
}
</style>
