<template>
  <section class="search-box">
    <div class="search-container">
      <div class="search-engines">
        <button
          v-for="(engine, index) in engines"
          :key="index"
          class="engine-btn"
          :class="{ active: currentEngine.name === engine.name }"
          @click="setCurrentEngine(engine)"
        >
          {{ engine.name }}
        </button>
      </div>
      <div class="search-input-container">
        <input
          id="searchInput"
          v-model="searchQuery"
          type="text"
          placeholder="搜索..."
          @keydown="handleKeyDown"
        />
        <button class="search-btn" @click="performSearch">
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <circle cx="11" cy="11" r="8"></circle>
            <path d="m21 21-4.35-4.35"></path>
          </svg>
        </button>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import { useSearch } from '@/composables/useSearch'
// import type { SearchEngine } from '../types'

const {
  engines,
  currentEngine,
  searchQuery,
  setCurrentEngine,
  performSearch,
  handleKeyDown
} = useSearch()
</script>
