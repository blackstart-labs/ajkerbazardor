<script setup lang="ts">
import { computed } from 'vue';
import { formatBnInt, formatChangePct } from '@ajkerbazardor/shared';

export interface DistributionChartProps {
  upCount: number;
  downCount: number;
  sameCount: number;
  totalTracked: number;
}

const props = defineProps<DistributionChartProps>();

const upShare = computed(() => (props.totalTracked > 0 ? (props.upCount / props.totalTracked) * 100 : 0));
const downShare = computed(() => (props.totalTracked > 0 ? (props.downCount / props.totalTracked) * 100 : 0));
const sameShare = computed(() => (props.totalTracked > 0 ? (props.sameCount / props.totalTracked) * 100 : 0));
</script>

<template>
  <div class="ui-distribution" role="region" aria-label="আজকের বাজারদরের সার্বিক চিত্র">
    <!-- Stacked progress bar -->
    <div class="ui-distribution__bar">
      <div
        class="ui-distribution__seg ui-distribution__seg--down"
        :style="{ width: `${downShare}%` }"
        :title="`কমেছে: ${formatBnInt(downCount)} (${formatChangePct(downShare).replace(/^[+−-]/, '')})`"
      />
      <div
        class="ui-distribution__seg ui-distribution__seg--same"
        :style="{ width: `${sameShare}%` }"
        :title="`একই আছে: ${formatBnInt(sameCount)} (${formatChangePct(sameShare).replace(/^[+−-]/, '')})`"
      />
      <div
        class="ui-distribution__seg ui-distribution__seg--up"
        :style="{ width: `${upShare}%` }"
        :title="`বেড়েছে: ${formatBnInt(upCount)} (${formatChangePct(upShare).replace(/^[+−-]/, '')})`"
      />
    </div>

    <!-- Legend breakdown -->
    <div class="ui-distribution__legend">
      <div class="ui-distribution__item ui-distribution__item--down">
        <span class="ui-distribution__dot" aria-hidden="true">▼</span>
        <span class="ui-distribution__label">কমেছে:</span>
        <strong class="ui-distribution__num">{{ formatBnInt(downCount) }}</strong>
        <span class="ui-distribution__pct">({{ downShare.toFixed(1) }}%)</span>
      </div>

      <div class="ui-distribution__item ui-distribution__item--same">
        <span class="ui-distribution__dot" aria-hidden="true">●</span>
        <span class="ui-distribution__label">একই আছে:</span>
        <strong class="ui-distribution__num">{{ formatBnInt(sameCount) }}</strong>
        <span class="ui-distribution__pct">({{ sameShare.toFixed(1) }}%)</span>
      </div>

      <div class="ui-distribution__item ui-distribution__item--up">
        <span class="ui-distribution__dot" aria-hidden="true">▲</span>
        <span class="ui-distribution__label">বেড়েছে:</span>
        <strong class="ui-distribution__num">{{ formatBnInt(upCount) }}</strong>
        <span class="ui-distribution__pct">({{ upShare.toFixed(1) }}%)</span>
      </div>
    </div>
  </div>
</template>

<style scoped>
.ui-distribution {
  display: flex;
  flex-direction: column;
  gap: var(--space-3, 0.75rem);
  width: 100%;
}

.ui-distribution__bar {
  display: flex;
  height: 12px;
  width: 100%;
  border-radius: var(--radius-full, 9999px);
  overflow: hidden;
  background-color: var(--color-bg-muted, #ebe5df);
}

.ui-distribution__seg {
  height: 100%;
  transition: width var(--duration-normal, 250ms) var(--ease-standard);
}

.ui-distribution__seg--down {
  background-color: var(--color-trend-down, #15803d);
}

.ui-distribution__seg--same {
  background-color: var(--color-trend-same, #57534e);
}

.ui-distribution__seg--up {
  background-color: var(--color-trend-up, #b91c1c);
}

.ui-distribution__legend {
  display: flex;
  align-items: center;
  justify-content: space-around;
  gap: var(--space-3, 0.75rem);
  flex-wrap: wrap;
  font-family: var(--font-body);
  font-size: var(--text-sm, 0.875rem);
}

.ui-distribution__item {
  display: flex;
  align-items: center;
  gap: var(--space-1, 0.25rem);
}

.ui-distribution__item--down {
  color: var(--color-trend-down, #15803d);
}

.ui-distribution__item--same {
  color: var(--color-trend-same, #57534e);
}

.ui-distribution__item--up {
  color: var(--color-trend-up, #b91c1c);
}

.ui-distribution__dot {
  font-size: 0.75em;
}

.ui-distribution__label {
  color: var(--color-text-secondary, #57534e);
}

.ui-distribution__num {
  font-weight: 700;
  font-family: var(--font-heading);
}

.ui-distribution__pct {
  font-size: var(--text-xs, 0.75rem);
  color: var(--color-text-muted, #78716c);
}
</style>
