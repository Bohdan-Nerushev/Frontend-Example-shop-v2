import { Brand, CustomerStatus } from './api'

export interface AddressRequest {
  street: string
  number: string
  postcode: string
  city: string
  country: string
}

export interface AddressResponse {
  street: string
  number: string
  postcode: string
  city: string
  country: string
}

export interface CommunicationDetails {
  email: string
  telephone: string
}

export interface CustomerRequest {
  firstName: string
  lastName: string
  birthDate: string // YYYY-MM-DD format
  address: AddressRequest
  invoiceAddress: AddressRequest | null
  communicationDetails: CommunicationDetails
  brand: Brand
  password: string
}

export interface CustomerResponse {
  id: string // UUID format
  firstName: string
  lastName: string
  birthDate: string // YYYY-MM-DD format
  address: AddressResponse
  invoiceAddress: AddressResponse | null
  communicationDetails: CommunicationDetails
  brand: Brand
  status: CustomerStatus
}
