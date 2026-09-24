<script setup lang="ts">
import { computed } from 'vue';

export interface SkeletonProps {
  variant?: 'text' | 'rect' | 'circle' | 'card';
  width?: string;
  height?: string;
}

const props = withDefaults(defineProps<SkeletonProps>(), {
  variant: 'text',
});

const styles = computed(() => ({
  width: props.width,
  height: props.height,
}));

const classes = computed(() => ['ui-skeleton', `ui-skeleton--${props.variant}`]);
</script>

<template>
  <div :class="classes" :style="styles" aria-hidden="true" />
</template>

<style scoped>
.ui-skeleton {
  background: linear-gradient(
    90deg,
    var(--color-bg-subtle, #f4efeb) 0%,
    var(--color-bg-muted, #ebe5df) 50%,
    var(--color-bg-subtle, #f4efeb) 100%
  );
  background-size: 200% 100%;
  animation: ui-skeleton-shimmer 1.5s ease-in-out infinite;
  border-radius: var(--radius-sm, 6px);
}

.ui-skeleton--text {
  height: 1rem;
  width: 100%;
  margin-bottom: 0.25rem;
  border-radius: var(--radius-xs, 3px);
}

.ui-skeleton--rect {
  width: 100%;
  height: 100px;
}

.ui-skeleton--circle {
  width: 44px;
  height: 44px;
  border-radius: var(--radius-full, 9999px);
}

.ui-skeleton--card {
  width: 100%;
  height: 240px;
  border-radius: var(--radius-lg, 14px);
}

@keyframes ui-skeleton-shimmer {
  0% {
    background-position: 200% 0;
  }
  100% {
    background-position: -200% 0;
  }
}

@media (prefers-reduced-motion: reduce) {
  .ui-skeleton {
    animation: none;
    background: var(--color-bg-muted, #ebe5df);
  }
}
</style>
