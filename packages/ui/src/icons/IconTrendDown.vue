<script setup lang="ts">
export interface IconProps {
  size?: number | string;
  color?: string;
}

withDefaults(defineProps<IconProps>(), {
  size: 20,
  color: 'currentColor',
});
</script>

<template>
  <svg
    :width="size"
    :height="size"
    viewBox="0 0 24 24"
    fill="none"
    :stroke="color"
    stroke-width="2"
    stroke-linecap="round"
    stroke-linejoin="round"
    class="ui-icon"
    aria-hidden="true"
  >
    <polyline points="23 18 13.5 8.5 8.5 13.5 1 6" />
    <polyline points="17 18 23 18 23 12" />
  </svg>
</template>
