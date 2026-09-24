<script setup lang="ts">
import { computed } from 'vue';
import type { Direction } from '@ajkerbazardor/shared';
import PriceRange from './PriceRange.vue';
import TrendBadge from './TrendBadge.vue';
import Sparkline from './Sparkline.vue';

export interface ProductCardProps {
  id: number;
  slug: string;
  nameBn: string;
  categoryNameBn?: string | undefined;
  unitLabel: string;
  minPrice: number | null;
  maxPrice: number | null;
  delta?: number | null | undefined;
  changePct?: number | null | undefined;
  direction?: Direction | 'no_data' | null | undefined;
  sparkline?: (number | null)[] | undefined;
  imageUrl?: string | null | undefined;
  isWatched?: boolean | undefined;
}

const props = withDefaults(defineProps<ProductCardProps>(), {
  delta: null,
  changePct: null,
  direction: 'same',
  sparkline: () => [],
  imageUrl: null,
  isWatched: false,
});

const emit = defineEmits<{
  (e: 'click', slug: string): void;
  (e: 'watch', id: number, watched: boolean): void;
}>();

const resolvedDirection = computed<'up' | 'down' | 'same' | 'no_data'>(() => {
  if (props.direction) return props.direction;
  if (props.minPrice === null && props.maxPrice === null) return 'no_data';
  if (props.delta && props.delta > 0) return 'up';
  if (props.delta && props.delta < 0) return 'down';
  return 'same';
});

function handleWatchClick(event: MouseEvent) {
  event.stopPropagation();
  emit('watch', props.id, !props.isWatched);
}

function handleCardClick() {
  emit('click', props.slug);
}
</script>

<template>
  <article
    class="ui-product-card"
    :class="[`ui-product-card--${resolvedDirection}`, { 'ui-product-card--no-data': resolvedDirection === 'no_data' }]"
    role="button"
    tabindex="0"
    :aria-label="`${nameBn}, ${unitLabel}`"
    @click="handleCardClick"
    @keydown.enter="handleCardClick"
    @keydown.space.prevent="handleCardClick"
  >
    <!-- Image Tile with Category Fallback & Badge Overlay -->
    <div class="ui-product-card__image-container">
      <div v-if="imageUrl" class="ui-product-card__image-wrapper">
        <img :src="imageUrl" :alt="nameBn" loading="lazy" class="ui-product-card__image" />
      </div>
      <div v-else class="ui-product-card__image-fallback">
        <slot name="illustration">
          <!-- Generic market basket SVG fallback -->
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
            <path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4Z" />
            <path d="M3 6h18" />
            <path d="M16 10a4 4 0 0 1-8 0" />
          </svg>
        </slot>
      </div>

      <!-- Direction Badge as discount-style pill overlay -->
      <div class="ui-product-card__badge-pos">
        <TrendBadge :direction="resolvedDirection" :delta="delta" :change-pct-val="changePct" size="sm" />
      </div>

      <!-- Watchlist Button (heart icon) -->
      <button
        type="button"
        class="ui-product-card__watch"
        :class="{ 'ui-product-card__watch--active': isWatched }"
        :aria-label="isWatched ? 'Watchlist থেকে সরান' : 'Watchlist-এ রাখুন'"
        :title="isWatched ? 'Watchlist থেকে সরান' : 'Watchlist-এ রাখুন'"
        @click="handleWatchClick"
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" stroke-width="2">
          <path
            d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"
            :fill="isWatched ? 'currentColor' : 'none'"
          />
        </svg>
      </button>
    </div>

    <!-- Product Info (Calm, dense, price is loudest element) -->
    <div class="ui-product-card__content">
      <div class="ui-product-card__header">
        <h3 class="ui-product-card__name">{{ nameBn }}</h3>
        <span class="ui-product-card__unit">{{ unitLabel }}</span>
      </div>

      <div class="ui-product-card__pricing">
        <div class="ui-product-card__price-wrap">
          <PriceRange
            v-if="resolvedDirection !== 'no_data' && (minPrice !== null || maxPrice !== null)"
            :min="minPrice"
            :max="maxPrice"
            size="md"
          />
          <span v-else class="ui-product-card__no-price">আজ বাজারে মেলেনি</span>
        </div>

        <!-- In-house SVG sparkline -->
        <div v-if="sparkline && sparkline.length >= 2" class="ui-product-card__sparkline">
          <Sparkline
            :points="sparkline"
            :direction="resolvedDirection === 'no_data' ? 'same' : resolvedDirection"
            :width="72"
            :height="24"
          />
        </div>
      </div>
    </div>
  </article>
</template>

<style scoped>
.ui-product-card {
  display: flex;
  flex-direction: column;
  background-color: var(--color-bg-surface, #ffffff);
  border: 1px solid var(--color-border-subtle, #e7e0d8);
  border-radius: var(--radius-lg, 14px);
  overflow: hidden;
  box-shadow: var(--shadow-card);
  cursor: pointer;
  transition:
    transform var(--duration-fast, 150ms) var(--ease-standard),
    box-shadow var(--duration-fast, 150ms) var(--ease-standard),
    border-color var(--duration-fast, 150ms) var(--ease-standard);
  user-select: none;
  position: relative;
}

.ui-product-card:hover {
  transform: translateY(-2px);
  box-shadow: var(--shadow-card-hover);
  border-color: var(--color-border-strong, #d6cec5);
}

.ui-product-card:focus-visible {
  outline: 2px solid var(--color-focus-ring, #d97706);
  outline-offset: 2px;
}

/* ── Image Tile ──────────────────────────────────────────────────────────── */
.ui-product-card__image-container {
  position: relative;
  width: 100%;
  aspect-ratio: 4 / 3;
  background-color: var(--color-bg-subtle, #f4efeb);
  overflow: hidden;
}

.ui-product-card__image-wrapper {
  width: 100%;
  height: 100%;
}

.ui-product-card__image {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.ui-product-card__image-fallback {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--color-brand-primary, #d97706);
  background: radial-gradient(
    circle at center,
    var(--color-bg-surface, #ffffff) 0%,
    var(--color-bg-subtle, #f4efeb) 100%
  );
}

.ui-product-card__badge-pos {
  position: absolute;
  top: var(--space-2, 0.5rem);
  left: var(--space-2, 0.5rem);
  z-index: 2;
}

.ui-product-card__watch {
  position: absolute;
  top: var(--space-2, 0.5rem);
  right: var(--space-2, 0.5rem);
  z-index: 2;
  width: 34px;
  height: 34px;
  border-radius: var(--radius-full, 9999px);
  background-color: rgba(255, 255, 255, 0.9);
  backdrop-filter: blur(4px);
  border: 1px solid var(--color-border-subtle, #e7e0d8);
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--color-text-muted, #78716c);
  cursor: pointer;
  transition: all var(--duration-fast, 150ms);
}

.ui-product-card__watch:hover {
  color: var(--color-trend-up, #b91c1c);
  transform: scale(1.1);
}

.ui-product-card__watch--active {
  color: var(--color-trend-up, #b91c1c);
  background-color: #ffffff;
}

/* ── Content ─────────────────────────────────────────────────────────────── */
.ui-product-card__content {
  display: flex;
  flex-direction: column;
  padding: var(--space-3, 0.75rem);
  gap: var(--space-2, 0.5rem);
  flex: 1;
}

.ui-product-card__header {
  display: flex;
  flex-direction: column;
}

.ui-product-card__name {
  font-family: var(--font-body);
  font-size: var(--text-base, 1rem);
  font-weight: 600;
  color: var(--color-text-primary, #1c1917);
  margin: 0;
  line-height: var(--leading-tight, 1.25);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.ui-product-card__unit {
  font-family: var(--font-body);
  font-size: var(--text-xs, 0.75rem);
  color: var(--color-text-muted, #78716c);
  line-height: var(--leading-normal, 1.6);
}

.ui-product-card__pricing {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  margin-top: auto;
  gap: var(--space-2, 0.5rem);
}

.ui-product-card__price-wrap {
  display: flex;
  align-items: baseline;
}

.ui-product-card__no-price {
  font-family: var(--font-body);
  font-size: var(--text-sm, 0.875rem);
  font-weight: 500;
  color: var(--color-text-muted, #78716c);
  line-height: 1.2;
}

.ui-product-card__sparkline {
  display: flex;
  align-items: center;
}

/* ── No Data State Styling ───────────────────────────────────────────────── */
.ui-product-card--no-data .ui-product-card__image-container {
  opacity: 0.75;
}

@media (prefers-reduced-motion: reduce) {
  .ui-product-card:hover {
    transform: none;
  }
}
</style>
