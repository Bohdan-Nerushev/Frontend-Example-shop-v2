export enum Brand {
  GMX = 'GMX',
  WEB_DE = 'WEB_DE',
  MAIL_COM = 'MAIL_COM',
}

export enum CustomerStatus {
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE',
}

export enum ContractStatus {
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE',
}

export enum KnownErrorCode {
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  CUSTOMER_NOT_FOUND = 'CUSTOMER_NOT_FOUND',
  PRODUCT_NOT_FOUND = 'PRODUCT_NOT_FOUND',
  CONTRACT_NOT_FOUND = 'CONTRACT_NOT_FOUND',
  CONTRACT_NOT_ACTIVE = 'CONTRACT_NOT_ACTIVE',
  BRAND_MISMATCH = 'BRAND_MISMATCH',
  DATABASE_ERROR = 'DATABASE_ERROR',
  UNEXPECTED_ERROR = 'UNEXPECTED_ERROR',
}

export interface ApiErrorResponse {
  code: string
  message: string
  timestamp: string
  details?: string[]
}

export class ApiError extends Error {
  public readonly code: string
  public readonly timestamp: string
  public readonly status: number
  public readonly details?: string[]

  constructor(status: number, response: ApiErrorResponse) {
    super(response.message)
    this.name = 'ApiError'
    this.status = status
    this.code = response.code
    this.timestamp = response.timestamp
    this.details = response.details

    // Set the prototype explicitly to restore correct prototype chain
    Object.setPrototypeOf(this, ApiError.prototype)
  }
}
