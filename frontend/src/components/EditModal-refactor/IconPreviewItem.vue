<template>
  <div class="preview-item" :class="wrapperClass" @click="$emit('click')">
    <div class="preview-icon" :class="[type, { selected }]">
      <img v-if="type !== 'text_icon'" :src="iconUrl" :alt="label" :onerror="`this.src='${fallbackIcon}'`" />
      <span v-else>{{ text }}</span>
    </div>
    <div class="preview-label">{{ label }}</div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { IconType } from '@/types'

const props = defineProps({
  type: {
    type: String,
    required: true,
    validator: (value: string) => ['online_icon', 'text_icon', 'upload_icon'].includes(value)
  },
  selected: {
    type: Boolean,
    default: false
  },
  iconUrl: {
    type: String,
    default: ''
  },
  text: {
    type: String,
    default: ''
  },
  label: {
    type: String,
    required: true
  }
})

const emit = defineEmits(['click'])

const fallbackIcon = computed(() => {
  return props.type === 'upload_icon'
    ? 'https://api.iconify.design/mdi:cart.svg'
    : 'https://api.iconify.design/mdi:web.svg'
})

const wrapperClass = computed(() => {
  return props.type === 'text_icon' ? 'text-icon-wrapper' : ''
})
</script>

<style scoped lang="scss">
.preview-item {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.5rem;
  cursor: pointer;
}

.preview-label {
  font-size: 0.75rem;
  color: var(--text-secondary);
  text-align: center;
}

.preview-icon {
  width: 60px;
  height: 60px;
  border-radius: var(--radius);
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--bg);
  border: 1px solid var(--border);
  overflow: hidden;

  &.selected {
    box-shadow: 0 0 0 2px var(--accent);
  }

  img {
    width: 36px;
    height: 36px;
    object-fit: contain;
  }

  &.text-icon {
    font-size: 1.5rem;
    font-weight: 700;
    background: linear-gradient(135deg, var(--gradient-1) 0%, var(--gradient-2) 100%);
    -webkit-background-clip: text;
    background-clip: text;
    color: transparent;
  }
}
</style>
