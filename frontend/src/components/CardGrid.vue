<template>
  <div id="grid" class="grid">
    <div v-if="props.loading" class="loading-indicator">加载中...</div>
    <div v-else-if="props.error" class="error-indicator">{{ props.error }}</div>
    <template v-else>
      <Card
        v-for="link in props.links"
        :key="link.id"
        :link="link"
        @contextmenu="showContextMenu"
      />
      <Card
        :is-add-card="true"
        @add="handleAddCard"
      />
    </template>
  </div>
</template>

<script setup lang="ts">
import Card from './Card.vue'
import type { Link, CardGridProps } from '@/types'

const props = defineProps<CardGridProps>()
const emit = defineEmits(['show-context-menu', 'add-link'])

const showContextMenu = (event: MouseEvent, link: Link) => {
  event.preventDefault()
  event.stopPropagation
  emit('show-context-menu', event, link)
}

const handleAddCard = () => {
  emit('add-link')
}
</script>

<style scoped>
.grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(120px, 1fr));
  gap: 1.5rem;
  padding: 1rem;
}

.loading-indicator,
.error-indicator {
  grid-column: 1 / -1;
  text-align: center;
  padding: 2rem;
  color: var(--text);
  background-color: var(--card);
  border-radius: var(--radius);
  border: 1px solid var(--border);
}

.error-indicator {
  color: #e74c3c;
}
</style>
