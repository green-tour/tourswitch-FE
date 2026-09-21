<script setup>
import {
  CategoryScale,
  Chart,
  Filler,
  LineController,
  LineElement,
  LinearScale,
  PointElement,
  Tooltip,
} from "chart.js";
import {
  computed,
  nextTick,
  onBeforeUnmount,
  onMounted,
  ref,
  watch,
} from "vue";
import AppState from "../common/AppState.vue";

Chart.register(
  CategoryScale,
  LineController,
  LineElement,
  LinearScale,
  PointElement,
  Tooltip,
  Filler,
);

const props = defineProps({
  forecasts: {
    type: Array,
    default: () => [],
  },
});

const chartCanvas = ref(null);
let chart = null;

const chartPoints = computed(() =>
  props.forecasts
    .filter(
      (forecast) => forecast?.date && Number.isFinite(Number(forecast.rate)),
    )
    .map((forecast) => ({
      label: new Intl.DateTimeFormat("ko-KR", {
        month: "numeric",
        day: "numeric",
      }).format(new Date(forecast.date)),
      rate: Number(forecast.rate),
      level: forecast.level ?? "정보 없음",
    })),
);

const renderChart = async () => {
  chart?.destroy();
  chart = null;

  if (!chartPoints.value.length) return;

  await nextTick();
  if (!chartCanvas.value) return;

  chart = new Chart(chartCanvas.value, {
    type: "line",
    data: {
      labels: chartPoints.value.map((point) => point.label),
      datasets: [
        {
          data: chartPoints.value.map((point) => point.rate),
          borderColor: "#00bfc4",
          backgroundColor: "rgb(0 191 196 / 12%)",
          borderWidth: 2,
          fill: true,
          pointBackgroundColor: "#ffffff",
          pointBorderColor: "#00bfc4",
          pointBorderWidth: 2,
          pointRadius: 3,
          pointHoverRadius: 4,
          tension: 0.35,
        },
      ],
    },
    options: {
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false },
        tooltip: {
          displayColors: false,
          callbacks: {
            label: (context) =>
              `${chartPoints.value[context.dataIndex].level} · ${context.parsed.y}%`,
          },
        },
      },
      scales: {
        x: {
          grid: { display: false },
          border: { display: false },
          ticks: { color: "#6c7975", font: { size: 10 } },
        },
        y: {
          min: 0,
          max: 100,
          ticks: {
            callback: (value) => `${value}%`,
            color: "#6c7975",
            font: { size: 10 },
            stepSize: 25,
          },
          border: { display: false },
          grid: { color: "rgb(183 192 189 / 45%)" },
        },
      },
    },
  });
};

onMounted(renderChart);
watch(chartPoints, renderChart);
onBeforeUnmount(() => chart?.destroy());
</script>

<template>
  <section class="crowd-forecast-chart" aria-label="일주일 혼잡도 예측">
    <div v-if="chartPoints.length" class="chart-summary">
      <span>방문자 집중률</span><strong>단위: %</strong>
    </div>
    <div v-if="chartPoints.length" class="chart-canvas">
      <canvas ref="chartCanvas"></canvas>
    </div>
    <AppState v-else type="empty" message="일주일 예측 정보가 아직 없습니다." />
  </section>
</template>

<style scoped>
.crowd-forecast-chart {
  min-height: 204px;
  margin: 0 0 30px;
  padding: var(--team-space-3);
  border: var(--team-border-default);
  border-radius: var(--team-radius);
  background: var(--team-color-white);
}
.chart-summary {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin: 0 var(--team-space-1) var(--team-space-2);
  color: var(--team-color-gray-600);
  font-size: var(--team-font-size-xs);
}
.chart-summary strong {
  font-weight: var(--team-font-weight-medium);
}
.chart-canvas {
  position: relative;
  height: 156px;
}
.crowd-forecast-chart :deep(.app-state) {
  min-height: 176px;
  padding: var(--team-space-4);
}
</style>

