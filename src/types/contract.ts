import { ContractStatus } from './api'

export interface PurchaseRequest {
  productId: string // UUID format
}

export interface ContractResponse {
  id: string // UUID format
  customerId: string // UUID format
  productId: string // UUID format
  creationDate: string // YYYY-MM-DD format
  status: ContractStatus
}
