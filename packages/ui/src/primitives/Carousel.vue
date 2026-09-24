<script setup lang="ts">
import { ref } from 'vue';

export interface CarouselProps {
  ariaLabel?: string;
}

withDefaults(defineProps<CarouselProps>(), {
  ariaLabel: 'Carousel',
});

const trackRef = ref<HTMLDivElement | null>(null);

function scrollLeft() {
  if (!trackRef.value) return;
  trackRef.value.scrollBy({ left: -280, behavior: 'smooth' });
}

function scrollRight() {
  if (!trackRef.value) return;
  trackRef.value.scrollBy({ left: 280, behavior: 'smooth' });
}
</script>

<template>
  <div class="ui-carousel" role="region" :aria-label="ariaLabel">
    <div class="ui-carousel__controls">
      <button type="button" class="ui-carousel__btn" aria-label="Previous items" @click="scrollLeft">‹</button>
      <button type="button" class="ui-carousel__btn" aria-label="Next items" @click="scrollRight">›</button>
    </div>

    <div ref="trackRef" class="ui-carousel__track">
      <slot />
    </div>
  </div>
</template>

<style scoped>
.ui-carousel {
  position: relative;
  width: 100%;
}

.ui-carousel__controls {
  position: absolute;
  top: -44px;
  right: 0;
  display: flex;
  gap: var(--space-2, 0.5rem);
}

.ui-carousel__btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 34px;
  height: 34px;
  border-radius: var(--radius-full, 9999px);
  border: 1px solid var(--color-border-subtle, #e7e0d8);
  background-color: var(--color-bg-surface, #ffffff);
  color: var(--color-text-secondary, #57534e);
  font-size: 1.25rem;
  line-height: 1;
  cursor: pointer;
  transition: all var(--duration-fast, 150ms);
}

.ui-carousel__btn:hover {
  background-color: var(--color-bg-subtle, #f4efeb);
  color: var(--color-text-primary, #1c1917);
  border-color: var(--color-border-strong, #d6cec5);
}

.ui-carousel__track {
  display: flex;
  gap: var(--space-4, 1rem);
  overflow-x: auto;
  scroll-snap-type: x mandatory;
  scroll-behavior: smooth;
  padding: var(--space-2, 0.5rem) 2px var(--space-4, 1rem);
  scrollbar-width: none; /* Hide scrollbar for clean app feel */
}

.ui-carousel__track::-webkit-scrollbar {
  display: none;
}

:slotted(*) {
  scroll-snap-align: start;
  flex-shrink: 0;
}
</style>
