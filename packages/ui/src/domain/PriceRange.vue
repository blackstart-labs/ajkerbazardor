<script setup lang="ts">
import { computed } from 'vue';
import { formatTaka } from '@ajkerbazardor/shared';

export interface PriceRangeProps {
  min: number | null;
  max: number | null;
  size?: 'sm' | 'md' | 'lg' | 'hero';
}

const props = withDefaults(defineProps<PriceRangeProps>(), {
  size: 'md',
});

const formattedRange = computed(() => {
  if (props.min === null && props.max === null) return '—';
  if (props.min === null) return formatTaka(props.max);
  if (props.max === null) return formatTaka(props.min);
  if (props.min === props.max) return formatTaka(props.min);

  // E.g. "৳৫৫ – ৬০"
  const minStr = formatTaka(props.min);
  const maxStr = formatTaka(props.max).replace(/^৳/, '');
  return `${minStr} – ${maxStr}`;
});
</script>

<template>
  <span class="ui-price-range" :class="`ui-price-range--${size}`">
    <span class="ui-price-range__value">{{ formattedRange }}</span>
  </span>
</template>

<style scoped>
.ui-price-range {
  display: inline-flex;
  align-items: baseline;
  font-family: var(--font-heading);
  font-weight: 700;
  color: var(--color-text-primary, #1c1917);
  letter-spacing: -0.01em;
  line-height: 1.15;
}

.ui-price-range--sm {
  font-size: var(--text-base, 1rem);
}

.ui-price-range--md {
  font-size: var(--text-xl, 1.25rem);
}

.ui-price-range--lg {
  font-size: var(--text-2xl, 1.5rem);
}

.ui-price-range--hero {
  font-size: var(--text-4xl, 2.25rem);
}
</style>
