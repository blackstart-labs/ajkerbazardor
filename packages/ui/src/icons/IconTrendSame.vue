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
    <line x1="5" y1="12" x2="19" y2="12" />
  </svg>
</template>
