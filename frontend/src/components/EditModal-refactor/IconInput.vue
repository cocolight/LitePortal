<template>
  <div class="input-wrapper">
    <input
      :value="modelValue"
      @input="$emit('update:modelValue', $event.target.value)"
      :placeholder="placeholder"
      @keydown.enter="$emit('search')"
    />
    <button class="search-btn" type="button" @click="$emit('search')">
      <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
        <path
          d="M15.5 14h-.79l-.28-.27A6.471 6.471 0 0 0 16 9.5 6.5 6.5 0 1 0 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 5L20.5 19l-5-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z" />
      </svg>
    </button>
  </div>
</template>

<script setup lang="ts">
defineProps({
  modelValue: {
    type: String,
    required: true
  },
  placeholder: {
    type: String,
    default: ''
  }
})

defineEmits(['update:modelValue', 'search'])
</script>

<style scoped lang="scss">
.input-wrapper {
  display: flex;
  flex: 1;
  align-items: stretch;
  border: 1px solid var(--border);
  border-radius: 4px;
  background: #fff;
  height: 32px;

  input {
    border: none;
    border-right: none;
    outline: none;
    height: 100%;
    padding: 0 0.625rem;
    border-radius: 4px 0 0 4px !important;
    flex: 1;
    min-width: 240px;
    font-size: 14px;
    background: transparent;
  }

  .search-btn {
    border: none;
    border-left: none;
    background: #f5f7fa;
    cursor: pointer;
    padding: 0 10px;
    display: flex;
    align-items: center;
    height: 100%;
    border-radius: 0 4px 4px 0;
    margin-left: 0;
    transition: background 0.2s;

    &:hover {
      background: #e6e8eb;
    }

    svg {
      fill: #606266;
    }
  }
}
</style>
