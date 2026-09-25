<script setup lang="ts">
import { computed } from 'vue';
import { formatTakaDelta, formatChangePct, type Direction } from '@ajkerbazardor/shared';

export interface PriceDeltaProps {
  delta: number | null;
  changePctVal?: number | null;
  direction?: Direction | null;
  showPct?: boolean;
}

const props = withDefaults(defineProps<PriceDeltaProps>(), {
  changePctVal: null,
  direction: null,
  showPct: true,
});

const resolvedDirection = computed<Direction>(() => {
  if (props.direction) return props.direction;
  if (props.delta === null || props.delta === 0) return 'same';
  return props.delta > 0 ? 'up' : 'down';
});

const symbol = computed(() => {
  if (resolvedDirection.value === 'up') return '▲';
  if (resolvedDirection.value === 'down') return '▼';
  return '●';
});

const deltaText = computed(() => {
  if (props.delta === null && props.changePctVal === null) return '—';
  const parts: string[] = [];
  if (props.delta !== null) {
    parts.push(formatTakaDelta(props.delta));
  }
  if (props.showPct && props.changePctVal !== null) {
    parts.push(formatChangePct(props.changePctVal));
  }
  return parts.join(' · ');
});
</script>

<template>
  <span class="ui-price-delta" :class="`ui-price-delta--${resolvedDirection}`">
    <span class="ui-price-delta__symbol" aria-hidden="true">{{ symbol }}</span>
    <span class="ui-price-delta__text">{{ deltaText }}</span>
  </span>
</template>

<style scoped>
.ui-price-delta {
  display: inline-flex;
  align-items: center;
  gap: var(--space-1, 0.25rem);
  font-family: var(--font-body);
  font-size: var(--text-sm, 0.875rem);
  font-weight: 600;
  line-height: 1.25;
}

.ui-price-delta__symbol {
  font-size: 0.75em;
}

.ui-price-delta--up {
  color: var(--color-trend-up, #b91c1c);
}

.ui-price-delta--down {
  color: var(--color-trend-down, #15803d);
}

.ui-price-delta--same {
  color: var(--color-trend-same, #57534e);
}
</style>
