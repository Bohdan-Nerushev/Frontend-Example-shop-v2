import http from './http'
import type { CustomerRequest, CustomerResponse, AddressRequest, CommunicationDetails } from '../types/customer'

export const customerApi = {
  /**
   * Get current logged-in customer's details.
   * Endpoint: GET /v1/shop/customers/me
   */
  async getCustomer(): Promise<CustomerResponse> {
    const response = await http.get<CustomerResponse>('/v1/shop/customers/me')
    return response.data
  },

  /**
   * Register a new customer.
   * Endpoint: POST /v1/shop/customers
   */
  async registerCustomer(data: CustomerRequest): Promise<CustomerResponse> {
    const response = await http.post<CustomerResponse>('/v1/shop/customers', data)
    return response.data
  },

  /**
   * Update the logged-in customer's main address.
   * Endpoint: PUT /v1/customers/{customerId}/address
   */
  async updateAddress(customerId: string, data: AddressRequest): Promise<CustomerResponse> {
    const response = await http.put<CustomerResponse>(`/v1/customers/${customerId}/address`, data)
    return response.data
  },

  /**
   * Update the logged-in customer's invoice address.
   * Endpoint: PUT /v1/customers/{customerId}/invoice-address
   */
  async updateInvoiceAddress(customerId: string, data: AddressRequest): Promise<CustomerResponse> {
    const response = await http.put<CustomerResponse>(`/v1/customers/${customerId}/invoice-address`, data)
    return response.data
  },

  /**
   * Update the logged-in customer's communication details (phone/email).
   * Endpoint: PUT /v1/customers/{customerId}/communication-details
   */
  async updateCommunicationDetails(customerId: string, data: CommunicationDetails): Promise<CustomerResponse> {
    const response = await http.put<CustomerResponse>(`/v1/customers/${customerId}/communication-details`, data)
    return response.data
  },
}
