<script setup lang="ts">
import { computed } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import ThemeToggle from './components/ThemeToggle.vue'
// import EnvironmentBadge from './components/EnvironmentBadge.vue'

// 路由相关
const router = useRouter()
const route = useRoute()

// 判断是否在首页
const isHomePage = computed(() => route.path === '/')

// 导航到首页
const navigateToHome = () => {
  router.push('/')
}
</script>

<template>
  <div class="app-container">
    <header>
      <div class="header-left">
        <h1 @click="navigateToHome" class="clickable-title">LitePortal</h1>
        <nav v-if="isHomePage">
          <router-link to="/" class="nav-link">首页</router-link>
          <router-link to="/about" class="nav-link">关于</router-link>
        </nav>
      </div>
      <ThemeToggle />
    </header>

    <main>
      <router-view v-slot="{ Component }">
        <transition name="fade" mode="out-in">
          <component :is="Component" />
        </transition>
      </router-view>
    </main>
  </div>
</template>

<style scoped>
.app-container {
  max-width: 1280px;
  margin: 0 auto;
}

header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 2rem;
}

.header-left {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.clickable-title {
  cursor: pointer;
  margin: 0;
}

nav {
  display: flex;
  gap: 1rem;
}

.nav-link {
  text-decoration: none;
  color: #666;
  font-weight: 500;
  padding: 0.25rem 0.5rem;
  border-radius: 4px;
  transition: all 0.2s;
}

.nav-link:hover, .nav-link.router-link-active {
  color: #4a6cf7;
  background-color: rgba(74, 108, 247, 0.1);
}

main {
  display: flex;
  flex-direction: column;
  gap: 2rem;
}

/* 路由过渡动画 */
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
