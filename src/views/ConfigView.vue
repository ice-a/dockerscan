<template>
  <div class="config-view">
    <ConfigGenerator />
  </div>
</template>

<script setup lang="ts">
import ConfigGenerator from '@/components/ConfigGenerator.vue'
</script>

<style scoped>
.config-view {
  min-height: 100vh;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}
</style>
