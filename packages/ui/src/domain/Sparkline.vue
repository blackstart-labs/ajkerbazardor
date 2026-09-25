<script setup lang="ts">
import { computed } from 'vue';
import type { Direction } from '@ajkerbazardor/shared';

export interface SparklineProps {
  points?: (number | null)[];
  width?: number;
  height?: number;
  direction?: Direction | null;
  strokeWidth?: number;
}

const props = withDefaults(defineProps<SparklineProps>(), {
  points: () => [],
  width: 80,
  height: 28,
  direction: 'same',
  strokeWidth: 2,
});

const validPoints = computed(() => {
  return props.points.filter((p): p is number => p !== null && Number.isFinite(p));
});

const pathData = computed(() => {
  const pts = validPoints.value;
  if (pts.length < 2) return '';

  const w = props.width;
  const h = props.height;
  const paddingY = 4;
  const usableH = h - paddingY * 2;

  let min = Math.min(...pts);
  let max = Math.max(...pts);

  if (min === max) {
    min -= 1;
    max += 1;
  }

  const range = max - min;
  const stepX = (w - 4) / (pts.length - 1);

  const coords = pts.map((val, idx) => {
    const x = 2 + idx * stepX;
    const y = h - paddingY - ((val - min) / range) * usableH;
    return `${x.toFixed(1)},${y.toFixed(1)}`;
  });

  return `M ${coords.join(' L ')}`;
});

const areaData = computed(() => {
  const linePath = pathData.value;
  if (!linePath) return '';
  const pts = validPoints.value;
  const w = props.width;
  const h = props.height;
  const stepX = (w - 4) / (pts.length - 1);
  const lastX = (2 + (pts.length - 1) * stepX).toFixed(1);

  return `${linePath} L ${lastX},${h} L 2,${h} Z`;
});

const colorClass = computed(() => {
  if (props.direction === 'up') return 'ui-sparkline--up';
  if (props.direction === 'down') return 'ui-sparkline--down';
  return 'ui-sparkline--same';
});
</script>

<template>
  <svg
    :width="width"
    :height="height"
    :viewBox="`0 0 ${width} ${height}`"
    class="ui-sparkline"
    :class="colorClass"
    aria-hidden="true"
  >
    <defs>
      <linearGradient :id="`sparkline-grad-${direction}`" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stop-color="currentColor" stop-opacity="0.25" />
        <stop offset="100%" stop-color="currentColor" stop-opacity="0.0" />
      </linearGradient>
    </defs>

    <path v-if="areaData" :d="areaData" :fill="`url(#sparkline-grad-${direction})`" class="ui-sparkline__area" />

    <path
      v-if="pathData"
      :d="pathData"
      fill="none"
      stroke="currentColor"
      :stroke-width="strokeWidth"
      stroke-linecap="round"
      stroke-linejoin="round"
      class="ui-sparkline__line"
    />
  </svg>
</template>

<style scoped>
.ui-sparkline {
  display: inline-block;
  overflow: visible;
}

.ui-sparkline--up {
  color: var(--color-trend-up, #b91c1c);
}

.ui-sparkline--down {
  color: var(--color-trend-down, #15803d);
}

.ui-sparkline--same {
  color: var(--color-trend-same, #57534e);
}
</style>
