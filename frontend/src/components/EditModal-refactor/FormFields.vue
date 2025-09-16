<template>
  <label>
    <strong>标题</strong>
    <input id="mName" :value="name" @input="$emit('update:name', $event.target.value)" />
  </label>

  <label>
    <strong>描述</strong>
    <input id="mDesc" :value="desc" @input="$emit('update:desc', $event.target.value)" />
  </label>

  <label>
    <strong>内网地址</strong>
    <input id="mInt" :value="int" @input="$emit('update:int', $event.target.value)" />
  </label>

  <label>
    <strong>公网地址</strong>
    <input id="mExt" :value="ext" @input="$emit('update:ext', $event.target.value)" />
  </label>
</template>

<script setup lang="ts">
defineProps({
  name: {
    type: String,
    required: true
  },
  desc: {
    type: String,
    required: true
  },
  int: {
    type: String,
    required: true
  },
  ext: {
    type: String,
    required: true
  }
})

defineEmits(['update:name', 'update:desc', 'update:int', 'update:ext'])
</script>

<style scoped lang="scss">
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

  input {
    flex: 1;
    height: 32px;
    padding: 0 0.625rem;
    border-radius: 4px;
    border: 1px solid var(--border);
    background: #fff;
    color: var(--text);
    transition: var(--transition);
    text-align: left;

    &:focus {
      outline: none;
      border-color: var(--accent);
      box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
    }
  }
}
</style>
