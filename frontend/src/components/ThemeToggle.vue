<template>
  <button id="themeToggle" @click="toggleTheme">
    {{ themeIcon }}
  </button>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useTheme } from '../composables/useTheme'
import type { Theme } from '../types'

const { theme, toggleTheme } = useTheme()

const themeIcon = computed(() => {
  return theme.value === 'dark' ? '🌙' : '☀️'
})
</script>

<style scoped>
#themeToggle {
  background: transparent;
  color: var(--text);
  border-radius: 50%;
  width: 40px;
  height: 40px;
  padding: 0;
  box-shadow: none;
  font-size: 20px;
}

#themeToggle:hover {
  background: rgba(59, 130, 246, 0.1);
  transform: rotate(15deg);
}

#themeToggle:active {
  transform: rotate(5deg);
}
</style>
