import http from './http'
import type { PurchaseRequest, ContractResponse } from '../types/contract'

export const contractApi = {
  /**
   * Fetch all contracts of the customer.
   * Endpoint: GET /v1/shop/contracts/{customerId}
   */
  async getContracts(customerId: string): Promise<ContractResponse[]> {
    const response = await http.get<ContractResponse[]>(`/v1/shop/contracts/${customerId}`)
    return response.data
  },

  /**
   * Purchase a new product subscription (creates a contract).
   * Endpoint: POST /v1/shop/customers/{customerId}/purchases
   */
  async purchaseProduct(customerId: string, data: PurchaseRequest): Promise<ContractResponse> {
    const response = await http.post<ContractResponse>(`/v1/shop/customers/${customerId}/purchases`, data)
    return response.data
  },

  /**
   * Activate a specific contract subscription.
   * Endpoint: PUT /v1/contracts/{contractId}/{customerId}/activate
   */
  async activateContract(contractId: string, customerId: string): Promise<ContractResponse> {
    const response = await http.put<ContractResponse>(`/v1/contracts/${contractId}/${customerId}/activate`)
    return response.data
  },
}
