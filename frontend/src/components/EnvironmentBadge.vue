<template>
  <div class="environment-badge" :class="environmentClass">
    {{ environmentText }}
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { isDevelopment, isProduction, getEnvName } from '../utils/env'

const environmentText = computed(() => {
  if (isDevelopment) return '开发环境'
  if (isProduction) return '生产环境'
  return getEnvName()
})

const environmentClass = computed(() => {
  return {
    'is-development': isDevelopment,
    'is-production': isProduction,
  }
})
</script>

<style scoped>
.environment-badge {
  display: inline-block;
  padding: 2px 8px;
  border-radius: 4px;
  font-size: 12px;
  font-weight: bold;
  margin-left: 10px;
}

.is-development {
  background-color: #f0f9eb;
  color: #67c23a;
  border: 1px solid #e1f3d8;
}

.is-production {
  background-color: #ecf5ff;
  color: #409eff;
  border: 1px solid #d9ecff;
}
</style>
