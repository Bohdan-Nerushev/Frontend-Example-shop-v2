<script setup lang="ts">
import { useRouter } from 'vue-router'
import AppButton from '../components/common/AppButton.vue'

const router = useRouter()

const goHome = () => {
  router.push({ name: 'home' })
}
</script>

<template>
  <div class="not-found-container">
    <div class="glow-effect"></div>
    <div class="content-box">
      <h1 class="error-code">404</h1>
      <h2 class="error-title">Page Not Found</h2>
      <p class="error-desc">
        The page you are looking for does not exist or has been moved. 
        Please check the URL or return to the home page.
      </p>
      <AppButton variant="primary" style="margin-top: 1rem;" @click="goHome">
        Go to Home Page
      </AppButton>
    </div>
  </div>
</template>

<style scoped>
.not-found-container {
  min-height: 70vh;
  display: flex;
  justify-content: center;
  align-items: center;
  position: relative;
  overflow: hidden;
  padding: 2rem;
}

.glow-effect {
  position: absolute;
  width: 400px;
  height: 400px;
  background: radial-gradient(circle, rgba(239, 68, 68, 0.08) 0%, rgba(0, 0, 0, 0) 70%);
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  pointer-events: none;
  z-index: 0;
}

.content-box {
  position: relative;
  z-index: 1;
  text-align: center;
  max-width: 450px;
  background: rgba(30, 41, 59, 0.4);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 1rem;
  padding: 3rem 2rem;
  box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.3);
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1rem;
}

.error-code {
  font-size: 6rem;
  font-weight: 900;
  margin: 0;
  line-height: 1;
  background: linear-gradient(135deg, #ef4444 0%, #b91c1c 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  letter-spacing: -0.05em;
}

.error-title {
  font-size: 1.5rem;
  font-weight: 750;
  margin: 0;
  color: var(--color-text-main, #fff);
}

.error-desc {
  font-size: 0.9rem;
  line-height: 1.5;
  color: var(--color-text-muted, #94a3b8);
  margin: 0 0 1rem 0;
}
</style>
