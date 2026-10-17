import { Brand } from './api'
import type { AddressResponse } from './customer'

export interface InvoiceRequest {
  customerId: string // UUID format
}

export interface InvoiceItemResponse {
  productId: string // UUID format
  productName: string
  contractId: string // UUID format
  contractCreationDate: string // YYYY-MM-DD format
  setupFee: number // BigDecimal on backend
  monthlyFee: number // BigDecimal on backend
}

export interface InvoiceResponse {
  brand: Brand
  invoiceDate: string // YYYY-MM-DD format
  customerId: string // UUID format
  address: AddressResponse
  invoiceAddress: AddressResponse
  items: InvoiceItemResponse[]
  totalSetupFee: number // BigDecimal on backend
  totalMonthlyFee: number // BigDecimal on backend
  discount: number // BigDecimal on backend
  totalAmount: number // BigDecimal on backend
}
