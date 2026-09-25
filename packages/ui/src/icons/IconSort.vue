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
    <path d="m3 16 4 4 4-4" />
    <path d="M7 20V4" />
    <path d="m21 8-4-4-4 4" />
    <path d="M17 4v16" />
  </svg>
</template>
