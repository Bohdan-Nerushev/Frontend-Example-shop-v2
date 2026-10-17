import http from './http'
import type { ProductResponse } from '../types/product'
import type { Brand } from '../types/api'

export const shopApi = {
  /**
   * Fetch all available products from the store, optionally filtered by brand.
   * Endpoint: GET /v1/shop/products
   */
  async getProducts(brand?: Brand): Promise<ProductResponse[]> {
    const response = await http.get<ProductResponse[]>('/v1/shop/products', {
      params: brand ? { brand } : {},
    })
    return response.data
  },
}
