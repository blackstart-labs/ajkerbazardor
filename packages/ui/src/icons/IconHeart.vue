<script setup lang="ts">
export interface IconHeartProps {
  size?: number | string;
  filled?: boolean;
  color?: string;
}

withDefaults(defineProps<IconHeartProps>(), {
  size: 20,
  filled: false,
  color: 'currentColor',
});
</script>

<template>
  <svg
    :width="size"
    :height="size"
    viewBox="0 0 24 24"
    :fill="filled ? color : 'none'"
    :stroke="color"
    stroke-width="2"
    stroke-linecap="round"
    stroke-linejoin="round"
    class="ui-icon"
    aria-hidden="true"
  >
    <path
      d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"
    />
  </svg>
</template>
