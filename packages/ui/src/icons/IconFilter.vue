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
    <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3" />
  </svg>
</template>
