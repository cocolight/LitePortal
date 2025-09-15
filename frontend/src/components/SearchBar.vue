<template>
  <div class="search-bar">
    <input
      v-model="keyword"
      class="search-bar__input"
      placeholder="请输入"
      @keydown.enter="handleSearch"
    />
    <button class="search-bar__btn" @click="handleSearch">
      <!-- 放大镜 svg -->
      <svg class="search-bar__icon" viewBox="0 0 24 24">
        <path
          d="M15.5 14h-.79l-.28-.27A6.471 6.471 0 0 0 16 9.5 6.5 6.5 0 1 0 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 5L20.5 19l-5-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z"
        />
      </svg>
    </button>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'

const emit = defineEmits<{ search: [val: string] }>()

const keyword = ref('')

const handleSearch = () => emit('search', keyword.value)
</script>

<style scoped lang="scss">
.search-bar {
  display: inline-flex;
  border: 1px solid #dcdfe6;
  border-radius: 4px;
  overflow: hidden;
  background: #fff;
  height: 32px;

  &__input {
    flex: 1;
    border: none;
    outline: none;
    padding: 0 8px;
    font-size: 14px;
    background: transparent;
  }

  &__btn {
    border: none;
    background: #f5f7fa;
    cursor: pointer;
    padding: 0 10px;
    display: flex;
    align-items: center;
    transition: background 0.2s;

    &:hover {
      background: #e6e8eb;
    }
  }

  &__icon {
    width: 16px;
    height: 16px;
    fill: #606266;
  }
}
</style>