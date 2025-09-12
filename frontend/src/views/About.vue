<template>
  <div class="about-container">
    <h1>关于 LitePortal</h1>
    <div class="about-content">
      <p>LitePortal 是一个轻量级的门户网站，旨在提供简洁高效的导航体验。</p>
      <h2>主要功能</h2>
      <ul>
        <li>快速访问常用网站</li>
        <li>自定义链接分类</li>
        <li>支持多种图标类型</li>
        <li>响应式设计，适配各种设备</li>
      </ul>
      <h2>技术栈</h2>
      <p>前端：Vue 3 + TypeScript + Pinia + Vue Router</p>
      <p>后端：Node.js + Express</p>
      <h2>联系我</h2>
      <ul>
        <li>个人博客: <a href="https://alili.website" target="_blank">个人学习经验分享</a></li>
        <li>Gitee: <a href="https://gitee.com/yumos/LitePortal" target="_blank">LitePortal</a></li>
      </ul>
      <div class="back-button-container">
        <button class="back-button" @click="goToHome">
          <span class="button-icon">←</span>
          返回主页
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useRouter } from 'vue-router'

const router = useRouter()

// 导航到首页
const goToHome = () => {
  router.push('/')
}
</script>

<style scoped>
.about-container {
  max-width: 800px;
  margin: 0 auto;
  padding: 20px;
}

.about-content {
  margin-top: 20px;
  line-height: 1.6;
}

h2 {
  margin-top: 20px;
  margin-bottom: 10px;
  color: #4a4a4a;
}

ul {
  padding-left: 20px;
}

li {
  margin-bottom: 8px;
}

.back-button-container {
  margin-top: 30px;
  text-align: center;
}

.back-button {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 10px 20px;
  background-color: #4a6cf7;
  color: white;
  border: none;
  border-radius: 4px;
  font-size: 16px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.3s ease;
}

.back-button:hover {
  background-color: #3a5ce5;
  transform: translateY(-2px);
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
}

.button-icon {
  margin-right: 8px;
  font-size: 18px;
}
</style>
