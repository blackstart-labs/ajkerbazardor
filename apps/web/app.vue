<script setup lang="ts">
// Root app layout — wraps every page
</script>

<template>
  <div class="app-shell">
    <NuxtPage />
  </div>
</template>

<style>
/* ── Reset & Base ─────────────────────────────────────────────────────────── */
*,
*::before,
*::after {
  box-sizing: border-box;
  margin: 0;
  padding: 0;
}

html {
  font-size: 16px;
  -webkit-text-size-adjust: 100%;
  scroll-behavior: smooth;
}

body {
  font-family: var(--font-body);
  background-color: var(--color-bg-canvas);
  color: var(--color-text-primary);
  line-height: var(--leading-normal);
  min-height: 100dvh;
}

img,
picture,
video,
canvas,
svg {
  display: block;
  max-width: 100%;
}

input,
button,
textarea,
select {
  font: inherit;
}

p,
h1,
h2,
h3,
h4,
h5,
h6 {
  overflow-wrap: break-word;
}

a {
  color: var(--color-brand-primary);
  text-decoration: none;
}

a:hover {
  text-decoration: underline;
}

/* ── App Shell ───────────────────────────────────────────────────────────── */
.app-shell {
  min-height: 100dvh;
  display: flex;
  flex-direction: column;
}
</style>
