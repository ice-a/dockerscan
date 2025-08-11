<template>
  <div class="home-view">
    <DockerMirrorChecker />
  </div>
</template>

<script setup lang="ts">
import DockerMirrorChecker from '@/components/DockerMirrorChecker.vue'
</script>

<style scoped>
.home-view {
  min-height: 100vh;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}
</style>
