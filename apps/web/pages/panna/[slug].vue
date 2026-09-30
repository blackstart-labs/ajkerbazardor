<script setup lang="ts">
const route = useRoute();
await navigateTo(`/prices/${route.params['slug']}`, { redirectCode: 301 });
</script>

<template>
  <div />
</template>
