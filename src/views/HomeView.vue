<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import AppButton from '../components/common/AppButton.vue'
import AppSelect from '../components/common/AppSelect.vue'
import { Brand } from '../types/api'

const router = useRouter()
const selectedBrand = ref<Brand>(Brand.GMX)

const brandOptions = [
  { label: 'GMX Mail', value: Brand.GMX },
  { label: 'WEB.DE', value: Brand.WEB_DE },
  { label: 'Mail.com', value: Brand.MAIL_COM },
]

const viewProducts = () => {
  router.push({
    name: 'products',
    query: { brand: selectedBrand.value },
  })
}

const goToRegister = () => {
  router.push({ name: 'register' })
}

const goToDashboard = () => {
  router.push({ name: 'dashboard' })
}
</script>

<template>
  <div class="home-hero">
    <div class="hero-bg-glow"></div>
    
    <div class="hero-container">
      <header class="hero-header">
        <h1 class="hero-title">
          Welcome to <span class="text-gradient">Mail & Media</span>
        </h1>
        <p class="hero-subtitle">
          Choose your provider, purchase professional mail subscriptions, and manage your contracts in one modern dashboard.
        </p>
      </header>

      <!-- Main Selection Card -->
      <main class="hero-card">
        <div class="card-section">
          <label class="section-label">Select Your Email Provider</label>
          <AppSelect
            v-model="selectedBrand"
            :options="brandOptions"
            style="margin-top: 0.5rem;"
          />
        </div>

        <div class="card-actions">
          <AppButton variant="primary" style="width: 100%;" @click="viewProducts">
            Explore Subscriptions
          </AppButton>
        </div>
      </main>

      <!-- Secondary Actions -->
      <footer class="hero-footer">
        <div class="footer-card" @click="goToRegister">
          <div class="footer-card-icon">📝</div>
          <div>
            <h4 class="footer-card-title">New Customer?</h4>
            <p class="footer-card-desc">Register a new profile and join our ecosystem.</p>
          </div>
        </div>

        <div class="footer-card" @click="goToDashboard">
          <div class="footer-card-icon">🔒</div>
          <div>
            <h4 class="footer-card-title">Customer Portal</h4>
            <p class="footer-card-desc">Access your dashboard, invoices, and active services.</p>
          </div>
        </div>
      </footer>
    </div>
  </div>
</template>

<style scoped>
.home-hero {
  position: relative;
  min-height: 80vh;
  display: flex;
  justify-content: center;
  align-items: center;
  overflow: hidden;
  padding: 2rem 1.5rem;
}

.hero-bg-glow {
  position: absolute;
  top: 20%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 500px;
  height: 500px;
  background: radial-gradient(circle, rgba(56, 189, 248, 0.15) 0%, rgba(0, 0, 0, 0) 70%);
  z-index: 0;
  pointer-events: none;
}

.hero-container {
  position: relative;
  z-index: 1;
  max-width: 680px;
  width: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2.5rem;
}

.hero-header {
  text-align: center;
}

.hero-title {
  font-size: 3rem;
  font-weight: 850;
  letter-spacing: -0.03em;
  line-height: 1.15;
  margin: 0 0 1rem 0;
  color: var(--color-text-main, #fff);
}

.text-gradient {
  background: linear-gradient(135deg, #38bdf8 0%, #0284c7 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
}

.hero-subtitle {
  font-size: 1.1rem;
  line-height: 1.6;
  color: var(--color-text-muted, #94a3b8);
  margin: 0;
}

.hero-card {
  background: rgba(30, 41, 59, 0.4);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 1rem;
  padding: 2rem;
  width: 100%;
  box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.3);
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.section-label {
  font-size: 0.85rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: var(--color-text-muted, #64748b);
}

.hero-footer {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1.5rem;
  width: 100%;
}

.footer-card {
  background: rgba(30, 41, 59, 0.25);
  border: 1px solid rgba(255, 255, 255, 0.05);
  border-radius: 0.75rem;
  padding: 1.25rem;
  display: flex;
  align-items: flex-start;
  gap: 1rem;
  cursor: pointer;
  transition: transform 0.2s, border-color 0.2s, background-color 0.2s;
}

.footer-card:hover {
  transform: translateY(-2px);
  border-color: rgba(56, 189, 248, 0.3);
  background: rgba(30, 41, 59, 0.4);
}

.footer-card-icon {
  font-size: 1.5rem;
  line-height: 1;
}

.footer-card-title {
  margin: 0 0 0.25rem 0;
  font-size: 0.95rem;
  font-weight: 700;
  color: var(--color-text-main, #fff);
}

.footer-card-desc {
  margin: 0;
  font-size: 0.8rem;
  line-height: 1.4;
  color: var(--color-text-muted, #94a3b8);
}

@media (max-width: 640px) {
  .hero-title {
    font-size: 2.25rem;
  }
  .hero-footer {
    grid-template-columns: 1fr;
  }
}
</style>
