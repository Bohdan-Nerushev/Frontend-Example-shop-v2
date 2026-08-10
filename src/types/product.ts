import { Brand } from './api'

export interface ProductResponse {
  id: string // UUID format
  name: string
  brand: Brand
  setupFee: number // BigDecimal on backend
  monthlyFee: number // BigDecimal on backend
  storageSize: number // Long (bytes) on backend
}
