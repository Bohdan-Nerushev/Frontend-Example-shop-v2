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

  /**
   * Download the invoice as a PDF binary for a specific customer.
   * Endpoint: GET /v1/billing/invoices/pdf?customerId=...
   * Returns a Blob containing the PDF and the suggested filename.
   */
  async downloadInvoicePdf(customerId: string): Promise<{ blob: Blob; filename: string }> {
    const response = await http.get('/v1/billing/invoices/pdf', {
      params: { customerId },
      responseType: 'blob',
    })

    // Extract filename from Content-Disposition: attachment; filename="invoice_max_mustermann_1234567890.pdf"
    const disposition: string = response.headers['content-disposition'] || ''
    const filenameMatch = disposition.match(/filename="([^"]+)"/)
    const filename = filenameMatch ? filenameMatch[1] : `invoice_${Date.now()}.pdf`

    return { blob: response.data as Blob, filename }
  },
}
