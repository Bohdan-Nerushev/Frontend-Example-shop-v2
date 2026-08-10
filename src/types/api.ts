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
  CUSTOMER_NOT_FOUND = 'CUSTOMER_NOT_FOUND',
  CUSTOMER_NOT_ACTIVE = 'CUSTOMER_NOT_ACTIVE',
  CUSTOMER_VALIDATION_ERROR = 'CUSTOMER_VALIDATION_ERROR',
  PRODUCT_NOT_FOUND = 'PRODUCT_NOT_FOUND',
  PRODUCT_VALIDATION_ERROR = 'PRODUCT_VALIDATION_ERROR',
  CONTRACT_NOT_FOUND = 'CONTRACT_NOT_FOUND',
  CONTRACT_VALIDATION_ERROR = 'CONTRACT_VALIDATION_ERROR',
  BRAND_MISMATCH = 'BRAND_MISMATCH',
  INVALID_DISCOUNT = 'INVALID_DISCOUNT',
  INVOICE_VALIDATION_ERROR = 'INVOICE_VALIDATION_ERROR',
  REQUEST_VALIDATION_ERROR = 'REQUEST_VALIDATION_ERROR',
  CONSTRAINT_VIOLATION = 'CONSTRAINT_VIOLATION',
  MISSING_PARAMETER = 'MISSING_PARAMETER',
  TYPE_MISMATCH = 'TYPE_MISMATCH',
  RESOURCE_NOT_FOUND = 'RESOURCE_NOT_FOUND',
  INTERNAL_ERROR = 'INTERNAL_ERROR',
}

export interface ApiErrorResponse {
  correlationId: string
  errorCode: string
  message: string
  timestamp: string
}

export class ApiError extends Error {
  public readonly correlationId: string
  public readonly errorCode: string
  public readonly timestamp: string
  public readonly status: number

  constructor(status: number, response: ApiErrorResponse) {
    super(response.message)
    this.name = 'ApiError'
    this.status = status
    this.correlationId = response.correlationId
    this.errorCode = response.errorCode
    this.timestamp = response.timestamp

    // Set the prototype explicitly to restore correct prototype chain
    Object.setPrototypeOf(this, ApiError.prototype)
  }
}
