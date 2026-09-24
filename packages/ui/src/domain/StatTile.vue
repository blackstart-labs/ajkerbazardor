<script setup lang="ts">
import { computed } from 'vue';
import { formatBnInt, formatChangePct } from '@ajkerbazardor/shared';

export interface StatTileProps {
  title: string;
  value: number | string;
  share?: number | null | undefined;
  subtitle?: string | undefined;
  variant?: 'neutral' | 'success' | 'danger' | 'brand';
}

const props = withDefaults(defineProps<StatTileProps>(), {
  share: null,
  variant: 'neutral',
});

const formattedValue = computed(() => {
  if (typeof props.value === 'number') {
    return formatBnInt(props.value);
  }
  return props.value;
});

const formattedShare = computed(() => {
  if (props.share === null || props.share === undefined) return null;
  return formatChangePct(props.share).replace(/^[+−-]/, ''); // share percentage without sign e.g. "১৫.২%"
});
</script>

<template>
  <div class="ui-stat-tile" :class="`ui-stat-tile--${variant}`">
    <div class="ui-stat-tile__header">
      <span class="ui-stat-tile__title">{{ title }}</span>
      <span v-if="$slots.icon" class="ui-stat-tile__icon">
        <slot name="icon" />
      </span>
    </div>

    <div class="ui-stat-tile__body">
      <div class="ui-stat-tile__value">
        {{ formattedValue }}
      </div>
      <div v-if="formattedShare" class="ui-stat-tile__share">({{ formattedShare }})</div>
    </div>

    <div v-if="subtitle || $slots.footer" class="ui-stat-tile__footer">
      <slot name="footer">
        <span class="ui-stat-tile__subtitle">{{ subtitle }}</span>
      </slot>
    </div>
  </div>
</template>

<style scoped>
.ui-stat-tile {
  background-color: var(--color-bg-surface, #ffffff);
  border: 1px solid var(--color-border-subtle, #e7e0d8);
  border-radius: var(--radius-lg, 14px);
  padding: var(--space-4, 1rem) var(--space-5, 1.25rem);
  box-shadow: var(--shadow-sm);
  display: flex;
  flex-direction: column;
  gap: var(--space-1-5, 0.375rem);
  min-width: 140px;
}

.ui-stat-tile__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.ui-stat-tile__title {
  font-family: var(--font-body);
  font-size: var(--text-sm, 0.875rem);
  font-weight: 500;
  color: var(--color-text-secondary, #57534e);
}

.ui-stat-tile__body {
  display: flex;
  align-items: baseline;
  gap: var(--space-2, 0.5rem);
}

.ui-stat-tile__value {
  font-family: var(--font-heading);
  font-size: var(--text-3xl, 1.875rem);
  font-weight: 700;
  line-height: 1.1;
  color: var(--color-text-primary, #1c1917);
}

.ui-stat-tile__share {
  font-family: var(--font-body);
  font-size: var(--text-sm, 0.875rem);
  font-weight: 600;
  color: var(--color-text-muted, #78716c);
}

.ui-stat-tile__footer {
  font-family: var(--font-body);
  font-size: var(--text-xs, 0.75rem);
  color: var(--color-text-muted, #78716c);
  margin-top: var(--space-1, 0.25rem);
}

/* ── Variants ────────────────────────────────────────────────────────────── */
.ui-stat-tile--success {
  border-left: 4px solid var(--color-trend-down, #15803d);
}
.ui-stat-tile--success .ui-stat-tile__value {
  color: var(--color-trend-down, #15803d);
}

.ui-stat-tile--danger {
  border-left: 4px solid var(--color-trend-up, #b91c1c);
}
.ui-stat-tile--danger .ui-stat-tile__value {
  color: var(--color-trend-up, #b91c1c);
}

.ui-stat-tile--brand {
  border-left: 4px solid var(--color-brand-primary, #d97706);
}
.ui-stat-tile--brand .ui-stat-tile__value {
  color: var(--color-brand-ink, #78350f);
}
</style>
