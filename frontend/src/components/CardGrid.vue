<template>
  <div id="grid" class="grid">
    <Card
      v-for="link in links"
      :key="link.id"
      :link="link"
      @contextmenu="showContextMenu"
    />
    <Card 
      :is-add-card="true" 
      @add="handleAddCard"
    />
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted } from 'vue'
import Card from './Card.vue'
import { useLinkStore } from '../stores/linkStore'
import type { Link } from '../types'

const emit = defineEmits(['show-context-menu', 'add-link'])

const linkStore = useLinkStore()
const links = computed(() => linkStore.links)

onMounted(() => {
  linkStore.fetchLinks()
})

const showContextMenu = (event, link) => {
  emit('show-context-menu', event, link)
}

const handleAddCard = () => {
  emit('add-link')
}
</script>
