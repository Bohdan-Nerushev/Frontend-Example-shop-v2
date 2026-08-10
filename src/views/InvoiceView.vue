<script setup lang="ts">
import { onMounted, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useContractStore } from '../stores/contract.store'
import { useCustomerStore } from '../stores/customer.store'
import { useNotification } from '../composables/useNotification'
import InvoiceItemRow from '../components/invoice/InvoiceItemRow.vue'
import InvoiceSummary from '../components/invoice/InvoiceSummary.vue'
import AppButton from '../components/common/AppButton.vue'
import AppSpinner from '../components/common/AppSpinner.vue'
import AppEmptyState from '../components/common/AppEmptyState.vue'
import AppAlert from '../components/common/AppAlert.vue'

const router = useRouter()
const contractStore = useContractStore()
const customerStore = useCustomerStore()
const notification = useNotification()

// Get generated invoice from store
const invoice = computed(() => {
  return contractStore.invoices[0] || null
})

onMounted(async () => {
  if (!customerStore.customer) {
    await customerStore.fetchCustomerProfile()
  }
  
  if (!customerStore.customer) {
    // Redirect to dashboard if profile not found
    router.push({ name: 'dashboard' })
  }
})

const handleGenerateInvoice = async () => {
  try {
    await contractStore.fetchInvoices()
    if (invoice.value) {
      notification.success('Invoice generated successfully!')
    }
  } catch (e) {
    console.error('Invoice generation failed', e)
  }
}
</script>

<template>
  <div class="invoice-view">
    <header class="invoice-header">
      <div>
        <h1 class="view-title">Billing & Invoices</h1>
        <p class="view-subtitle">Generate and inspect your monthly subscription billing summaries.</p>
      </div>
      <AppButton
        v-if="invoice"
        variant="secondary"
        :loading="contractStore.loading"
        @click="handleGenerateInvoice"
      >
        🔄 Recalculate Invoice
      </AppButton>
    </header>

    <!-- LOADING STATE -->
    <div v-if="contractStore.loading && !invoice" class="spinner-container">
      <AppSpinner size="lg" />
      <span class="loading-text">Generating invoice details...</span>
    </div>

    <template v-else>
      <!-- ERROR STATE -->
      <AppAlert v-if="contractStore.error" type="error" :message="contractStore.error" style="margin-bottom: 2rem;" />

      <!-- EMPTY STATE (NO INVOICE GENERATED YET) -->
      <AppEmptyState
        v-if="!invoice"
        message="No invoice generated for the current billing period."
      >
        <template #actions>
          <AppButton variant="primary" :loading="contractStore.loading" @click="handleGenerateInvoice">
            Generate Current Invoice
          </AppButton>
        </template>
      </AppEmptyState>

      <!-- INVOICE DISPLAY STATE -->
      <div v-else class="invoice-paper">
        <!-- Invoice Header metadata -->
        <div class="paper-top">
          <div class="brand-badge">{{ invoice.brand }} INVOICE</div>
          <div class="meta-date">Date: <strong>{{ invoice.invoiceDate }}</strong></div>
        </div>

        <!-- Address details -->
        <div class="addresses-grid">
          <div class="addr-box">
            <span class="addr-title">Customer Address</span>
            <p class="addr-content">
              <strong>{{ customerStore.customer?.firstName }} {{ customerStore.customer?.lastName }}</strong><br />
              {{ invoice.address.street }} {{ invoice.address.number }}<br />
              {{ invoice.address.postcode }} {{ invoice.address.city }}<br />
              {{ invoice.address.country }}
            </p>
          </div>
          <div class="addr-box">
            <span class="addr-title">Billing Destination</span>
            <p class="addr-content">
              <strong>{{ customerStore.customer?.firstName }} {{ customerStore.customer?.lastName }}</strong><br />
              {{ invoice.invoiceAddress.street }} {{ invoice.invoiceAddress.number }}<br />
              {{ invoice.invoiceAddress.postcode }} {{ invoice.invoiceAddress.city }}<br />
              {{ invoice.invoiceAddress.country }}
            </p>
          </div>
        </div>

        <!-- Items Table -->
        <div class="table-container">
          <table class="invoice-table">
            <thead>
              <tr>
                <th>Service Plan</th>
                <th>Contract ID</th>
                <th>Purchased Date</th>
                <th class="text-right">Setup Fee</th>
                <th class="text-right">Monthly Fee</th>
              </tr>
            </thead>
            <tbody>
              <!-- Renders empty notification if no items in invoice -->
              <tr v-if="invoice.items.length === 0">
                <td colspan="5" class="empty-table-cell">
                  No active services found for this billing period.
                </td>
              </tr>
              <InvoiceItemRow
                v-else
                v-for="item in invoice.items"
                :key="item.contractId"
                :item="item"
              />
            </tbody>
          </table>
        </div>

        <!-- Summary section -->
        <div class="summary-wrapper">
          <InvoiceSummary
            :total-setup-fee="invoice.totalSetupFee"
            :total-monthly-fee="invoice.totalMonthlyFee"
            :discount="invoice.discount"
            :total-amount="invoice.totalAmount"
          />
        </div>
      </div>
    </template>
  </div>
</template>

<style scoped>
.invoice-view {
  max-width: 900px;
  margin: 2rem auto;
  padding: 0 1.5rem;
  width: 100%;
}

.invoice-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  border-bottom: 1px solid var(--color-border, #333);
  padding-bottom: 1.5rem;
  margin-bottom: 2rem;
  flex-wrap: wrap;
  gap: 1.5rem;
}

.view-title {
  font-size: 2.25rem;
  font-weight: 800;
  color: var(--color-text-main, #fff);
  margin: 0 0 0.5rem 0;
}

.view-subtitle {
  font-size: 0.95rem;
  color: var(--color-text-muted, #94a3b8);
  margin: 0;
}

.spinner-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 1rem;
  padding: 8rem 0;
}

.loading-text {
  font-size: 0.9rem;
  color: var(--color-text-muted, #94a3b8);
}

/* Invoice Paper styles */
.invoice-paper {
  background-color: var(--color-bg-card, #1e1e1e);
  border: 1px solid var(--color-border, #333);
  border-radius: 0.75rem;
  padding: 2.5rem;
  box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.3);
  display: flex;
  flex-direction: column;
  gap: 2rem;
}

.paper-top {
  display: flex;
  justify-content: space-between;
  align-items: center;
  border-bottom: 1px solid rgba(255, 255, 255, 0.05);
  padding-bottom: 1rem;
}

.brand-badge {
  font-size: 0.85rem;
  font-weight: 750;
  color: var(--color-primary, #38bdf8);
  background-color: rgba(56, 189, 248, 0.08);
  padding: 0.25rem 0.75rem;
  border-radius: 4px;
  letter-spacing: 0.05em;
}

.meta-date {
  font-size: 0.875rem;
  color: var(--color-text-muted);
}

.addresses-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 2rem;
}

.addr-box {
  background-color: rgba(255, 255, 255, 0.01);
  border: 1px solid rgba(255, 255, 255, 0.03);
  padding: 1.25rem;
  border-radius: 6px;
}

.addr-title {
  font-size: 0.75rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: var(--color-text-muted, #888);
  display: block;
  margin-bottom: 0.5rem;
}

.addr-content {
  font-size: 0.875rem;
  line-height: 1.5;
  margin: 0;
  color: var(--color-text-main, #eee);
}

.table-container {
  overflow-x: auto;
}

.invoice-table {
  width: 100%;
  border-collapse: collapse;
  border: 1px solid var(--color-border, #333);
}

.invoice-table th {
  background-color: rgba(255, 255, 255, 0.02);
  border-bottom: 2px solid var(--color-border, #333);
  padding: 0.75rem 1rem;
  font-size: 0.75rem;
  font-weight: 700;
  text-transform: uppercase;
  color: var(--color-text-muted, #888);
  text-align: left;
}

.invoice-table th.text-right {
  text-align: right;
}

.empty-table-cell {
  text-align: center;
  padding: 2rem !important;
  color: var(--color-text-muted);
  font-style: italic;
}

.summary-wrapper {
  display: flex;
  justify-content: flex-end;
}

@media (max-width: 640px) {
  .invoice-paper {
    padding: 1.5rem;
  }
  .addresses-grid {
    grid-template-columns: 1fr;
    gap: 1rem;
  }
  .invoice-header {
    flex-direction: column;
    align-items: stretch;
  }
}
</style>
