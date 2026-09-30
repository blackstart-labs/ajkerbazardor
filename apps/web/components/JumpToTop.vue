<script setup lang="ts">
const isVisible = ref(false);

function handleScroll() {
  if (typeof window !== 'undefined') {
    isVisible.value = window.scrollY > 280;
  }
}

function scrollToTop() {
  if (typeof window !== 'undefined') {
    window.scrollTo({
      top: 0,
      behavior: 'smooth',
    });
  }
}

onMounted(() => {
  window.addEventListener('scroll', handleScroll, { passive: true });
  handleScroll();
});

onUnmounted(() => {
  window.removeEventListener('scroll', handleScroll);
});
</script>

<template>
  <Transition name="fade-slide">
    <button
      v-if="isVisible"
      type="button"
      class="jump-to-top-btn"
      aria-label="উপরে যান"
      title="উপরে যান (Jump to top)"
      @click="scrollToTop"
    >
      <svg
        width="20"
        height="20"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        stroke-width="2.5"
        stroke-linecap="round"
        stroke-linejoin="round"
        aria-hidden="true"
      >
        <path d="m18 15-6-6-6 6" />
      </svg>
    </button>
  </Transition>
</template>

<style scoped>
.jump-to-top-btn {
  position: fixed;
  bottom: 2rem;
  right: 2rem;
  z-index: 999;
  width: 44px;
  height: 44px;
  border-radius: var(--radius-full);
  background-color: var(--color-brand-primary);
  color: #ffffff;
  border: 1px solid rgba(255, 255, 255, 0.2);
  box-shadow:
    0 4px 14px rgba(15, 118, 110, 0.35),
    0 2px 6px rgba(0, 0, 0, 0.1);
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  outline: none;
  transition:
    transform var(--duration-fast),
    background-color var(--duration-fast),
    box-shadow var(--duration-fast);
}

.jump-to-top-btn:hover {
  background-color: var(--color-brand-hover);
  transform: translateY(-3px) scale(1.05);
  box-shadow: 0 8px 20px rgba(15, 118, 110, 0.45);
}

.jump-to-top-btn:active {
  transform: translateY(0) scale(0.98);
}

.fade-slide-enter-active,
.fade-slide-leave-active {
  transition:
    opacity 0.25s ease,
    transform 0.25s cubic-bezier(0.16, 1, 0.3, 1);
}

.fade-slide-enter-from,
.fade-slide-leave-to {
  opacity: 0;
  transform: translateY(12px) scale(0.9);
}

@media (max-width: 640px) {
  .jump-to-top-btn {
    bottom: 1.25rem;
    right: 1.25rem;
    width: 40px;
    height: 40px;
  }
}
</style>
