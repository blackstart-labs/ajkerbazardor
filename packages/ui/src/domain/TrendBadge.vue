<script setup lang="ts">
import { computed } from 'vue';
import { formatTakaDelta, formatChangePct, type Direction } from '@ajkerbazardor/shared';

export interface TrendBadgeProps {
  direction?: Direction | 'no_data' | null | undefined;
  delta?: number | null | undefined;
  changePctVal?: number | null | undefined;
  size?: 'sm' | 'md' | undefined;
}

const props = withDefaults(defineProps<TrendBadgeProps>(), {
  direction: 'same',
  delta: null,
  changePctVal: null,
  size: 'md',
});

const resolvedDirection = computed<'up' | 'down' | 'same' | 'no_data'>(() => {
  if (props.direction) return props.direction;
  if (props.delta === null && props.changePctVal === null) return 'same';
  if (props.delta && props.delta > 0) return 'up';
  if (props.delta && props.delta < 0) return 'down';
  return 'same';
});

const symbol = computed(() => {
  switch (resolvedDirection.value) {
    case 'up':
      return '▲';
    case 'down':
      return '▼';
    case 'same':
      return '●';
    case 'no_data':
      return '—';
  }
});

const labelText = computed(() => {
  if (resolvedDirection.value === 'no_data') {
    return 'আজ বাজারে মেলেনি';
  }

  if (
    props.delta !== null &&
    props.delta !== undefined &&
    props.changePctVal !== null &&
    props.changePctVal !== undefined
  ) {
    return `${formatTakaDelta(props.delta)} · ${formatChangePct(props.changePctVal)}`;
  }
  if (props.delta !== null && props.delta !== undefined) {
    return formatTakaDelta(props.delta);
  }
  if (props.changePctVal !== null && props.changePctVal !== undefined) {
    return formatChangePct(props.changePctVal);
  }

  if (resolvedDirection.value === 'up') return 'বেড়েছে';
  if (resolvedDirection.value === 'down') return 'কমেছে';
  return 'একই আছে';
});

const ariaLabel = computed(() => {
  if (resolvedDirection.value === 'no_data') return 'আজকের বাজারদর পাওয়া যায়নি';
  if (resolvedDirection.value === 'up') return `দাম বেড়েছে: ${labelText.value}`;
  if (resolvedDirection.value === 'down') return `দাম কমেছে: ${labelText.value}`;
  return 'দাম অপরিবর্তিত';
});
</script>

<template>
  <span
    class="ui-trend-badge"
    :class="[`ui-trend-badge--${resolvedDirection}`, `ui-trend-badge--${size}`]"
    :aria-label="ariaLabel"
  >
    <span class="ui-trend-badge__symbol" aria-hidden="true">{{ symbol }}</span>
    <span class="ui-trend-badge__label">{{ labelText }}</span>
  </span>
</template>

<style scoped>
.ui-trend-badge {
  display: inline-flex;
  align-items: center;
  gap: var(--space-1, 0.25rem);
  font-family: var(--font-body);
  font-weight: 700;
  border-radius: var(--radius-full, 9999px);
  border: 1px solid transparent;
  line-height: 1;
  white-space: nowrap;
}

.ui-trend-badge--sm {
  font-size: var(--text-xs, 0.75rem);
  padding: 0.25rem 0.5rem;
}

.ui-trend-badge--md {
  font-size: var(--text-sm, 0.875rem);
  padding: 0.35rem 0.625rem;
}

.ui-trend-badge__symbol {
  font-size: 0.75em;
}

/* ── Direction States ────────────────────────────────────────────────────── */
.ui-trend-badge--up {
  background-color: var(--color-trend-up-bg, #fef2f2);
  color: var(--color-trend-up-text, #991b1b);
  border-color: var(--color-trend-up-border, #fca5a5);
}

.ui-trend-badge--down {
  background-color: var(--color-trend-down-bg, #f0fdf4);
  color: var(--color-trend-down-text, #166534);
  border-color: var(--color-trend-down-border, #86efac);
}

.ui-trend-badge--same {
  background-color: var(--color-trend-same-bg, #f5f5f4);
  color: var(--color-trend-same-text, #44403c);
  border-color: var(--color-trend-same-border, #d6d3d1);
}

.ui-trend-badge--no_data {
  background-color: var(--color-trend-nodata-bg, #f5f5f4);
  color: var(--color-trend-nodata-text, #78716c);
  border-color: var(--color-trend-nodata-border, #d6d3d1);
  background-image: repeating-linear-gradient(
    45deg,
    transparent,
    transparent 4px,
    rgba(120, 113, 108, 0.1) 4px,
    rgba(120, 113, 108, 0.1) 8px
  );
}
</style>
