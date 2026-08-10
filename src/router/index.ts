import { createRouter, createWebHistory } from 'vue-router'
import HomeView from '../views/HomeView.vue'
import { setupGuards } from './guards'

const routes = [
  {
    path: '/',
    name: 'home',
    component: HomeView,
  },
  {
    path: '/products',
    name: 'products',
    component: () => import('../views/ProductsView.vue'),
  },
  {
    path: '/register',
    name: 'register',
    component: () => import('../views/CustomerRegistrationView.vue'),
  },
  {
    path: '/dashboard',
    name: 'dashboard',
    component: () => import('../views/CustomerDashboardView.vue'),
    meta: { requiresAuth: true },
  },
  {
    path: '/profile/edit',
    name: 'profile-edit',
    component: () => import('../views/CustomerEditView.vue'),
    meta: { requiresAuth: true },
  },
  {
    path: '/contracts',
    name: 'contracts',
    component: () => import('../views/ContractsView.vue'),
    meta: { requiresAuth: true },
  },
  {
    path: '/invoices',
    name: 'invoices',
    component: () => import('../views/InvoiceView.vue'),
    meta: { requiresAuth: true },
  },
  {
    path: '/:pathMatch(.*)*',
    name: 'not-found',
    component: () => import('../views/NotFoundView.vue'),
  },
]

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes,
})

setupGuards(router)

export default router
