export class ApiError extends Error {
  /**
   * @param {number} statusCode 
   * @param {string} message 
   * @param {any} [details] 
   */
  constructor(statusCode, message, details = null) {
    super(message)
    this.statusCode = statusCode
    this.details = details
    this.name = this.constructor.name
    Error.captureStackTrace(this, this.constructor)
  }
}

export class BadRequestError extends ApiError {
  constructor(message = 'Geçersiz istek parametreleri', details = null) {
    super(400, message, details)
  }
}

export class UnauthorizedError extends ApiError {
  constructor(message = 'Oturum açmanız gerekiyor', details = null) {
    super(401, message, details)
  }
}

export class ForbiddenError extends ApiError {
  constructor(message = 'Bu işlem için yetkiniz bulunmuyor', details = null) {
    super(403, message, details)
  }
}

export class NotFoundError extends ApiError {
  constructor(message = 'İstenen kaynak bulunamadı', details = null) {
    super(404, message, details)
  }
}

export class ConflictError extends ApiError {
  constructor(message = 'Kayıt zaten mevcut veya çakışma var', details = null) {
    super(409, message, details)
  }
}

export class ValidationError extends ApiError {
  constructor(message = 'Doğrulama hatası', details = null) {
    super(422, message, details)
  }
}
