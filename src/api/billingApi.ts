import http from './http'
import type { InvoiceRequest, InvoiceResponse } from '../types/invoice'

export const billingApi = {
  /**
   * Generate invoice details for a specific customer.
   * Endpoint: POST /v1/billing/invoices
   */
  async generateInvoice(data: InvoiceRequest): Promise<InvoiceResponse> {
    const response = await http.post<InvoiceResponse>('/v1/billing/invoices', data)
    return response.data
  },
}
