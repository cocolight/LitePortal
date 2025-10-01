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
</style>