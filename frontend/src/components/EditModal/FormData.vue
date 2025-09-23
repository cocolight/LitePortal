<template>
    <label>
        <strong>标题</strong>
        <input id="mName" :value="props.name || ''" @input="handleInput($event, 'name')" />
    </label>

    <label>
        <strong>描述</strong>
        <input id="mDesc" :value="props.desc || ''" @input="handleInput($event, 'desc')" />
    </label>

    <label>
        <strong>内网地址</strong>
        <input id="mInt" :value="props.intUrl || ''" @input="handleInput($event, 'intUrl')"/>
    </label>

    <label>
        <strong>公网地址</strong>
        <input id="mExt" :value="props.extUrl || ''" @input="handleInput($event, 'extUrl')"/>
    </label>
</template>

<script setup lang="ts">
import type { FormDataProps } from './types'

// 定义props类型
const props = defineProps<FormDataProps>()

// 定义emit
type Field = keyof FormDataProps
const emit = defineEmits<{
  <K extends Field>(event:`update:${K}`,value: string): void
}>()

// 响应input事件
const handleInput = (event: Event, field: keyof FormDataProps) => {
    const target = event.target as HTMLInputElement
    emit(`update:${field}`, target.value)
}


</script>

<style scoped lang="scss">
/* ========== 公共变量 ========== */
$input-height: 32px;
$input-padding-x: 0.625rem;
$input-border-radius: 4px;
$input-border: 1px solid var(--border);
$input-bg: #fff;
$input-focus-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);

.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.5);
  backdrop-filter: blur(4px);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 9999;
  animation: fadeIn 0.2s ease-out;
}

.modal {
  background: var(--card);
  padding: 1.75rem;
  border-radius: var(--radius);
  width: 480px;
  display: flex;
  flex-direction: column;
  gap: 1rem;
  box-shadow: var(--shadow-lg);
  border: 1px solid var(--border);
  animation: slideUp 0.3s ease-out;

  h3 {
    font-size: 1.25rem;
    font-weight: 600;
    margin-bottom: 0.5rem;
  }

  label {
    display: flex;
    flex-direction: row;
    align-items: center;
    font-size: 0.875rem;
    font-weight: 500;
    color: var(--text);
    gap: 0.5rem;

    strong {
      min-width: 80px;
      text-align: justify;
      text-align-last: justify;
      margin-right: 0.5rem;
    }

    /* 普通输入框 -> 统一高度 */
    input {
      flex: 1;
      height: $input-height;
      padding: 0 $input-padding-x;
      border-radius: $input-border-radius;
      border: $input-border;
      background: $input-bg;
      color: var(--text);
      transition: var(--transition);
      text-align: left;

      &:focus {
        outline: none;
        border-color: var(--accent);
        box-shadow: $input-focus-shadow;
      }
    }
  }
}

/* ========== 一体式搜索框（与普通输入框同高） ========== */
.input-wrapper {
  display: flex;
  flex: 1;
  align-items: stretch;
  border: $input-border;
  border-radius: $input-border-radius;
  // overflow: hidden;
  background: $input-bg;
  height: $input-height;

  input {
    border: none;
    border-right: none;
    outline: none;
    height: 100%;
    padding: 0 $input-padding-x;
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
    border-radius: 0 $input-border-radius $input-border-radius 0;
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

/* ===== 以下保持原样，仅嵌套优化 ===== */
.icon-preview-section {
  margin-bottom: 1rem;
}

.icon-preview-container {
  display: flex;
  justify-content: space-between;
  gap: 0.75rem;
}

.preview-item {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.5rem;
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
}

.online-icon-wrapper,
.text-icon-wrapper {
  position: relative;
  cursor: pointer;
}


.text-icon {
  font-size: 1.5rem;
  font-weight: 700;
  background: linear-gradient(135deg, var(--gradient-1) 0%, var(--gradient-2) 100%);
  -webkit-background-clip: text;
  background-clip: text;
  color: transparent;
}

.modal-btns {
  display: flex;
  gap: 0.75rem;
  justify-content: flex-end;
  margin-top: 0.5rem;

  button {
    padding: 0.5rem 1rem;
    font-size: 0.875rem;
    font-weight: 500;
    transition: var(--transition);

    &:first-child {
      background: var(--accent);
      color: #fff;

      &:hover {
        background: var(--accent-hover);
        transform: translateY(-1px);
        box-shadow: var(--shadow);
      }
    }

    &:last-child {
      background: #fff;
      color: #ef4444;
      border: 1px solid #ef4444;

      &:hover {
        background: #ef4444;
        color: #fff;
        transform: translateY(-1px);
        box-shadow: var(--shadow);
      }
    }
  }
}

.divider {
  height: 1px;
  background-color: var(--border);
  margin: 1rem -1.75rem;
  width: calc(100% + 3.5rem);
}

@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

@keyframes slideUp {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
</style>