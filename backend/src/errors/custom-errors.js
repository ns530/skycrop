class AppError extends Error {
  constructor(code, message, statusCode = 500, details = {}) {
    super(message);
    this.code = code;
    this.statusCode = statusCode;
    this.details = details;
    this.name = this.constructor.name;
    Error.captureStackTrace(this, this.constructor);
  }
}

class ValidationError extends AppError {
  constructor(message = 'Validation error', details = {}) {
    super('VALIDATIONERROR', message, 400, details);
  }
}

class NotFoundError extends AppError {
  constructor(message = 'Resource not found', details = {}) {
    super('NOTFOUND', message, 404, details);
  }
}

class UnauthorizedError extends AppError {
  constructor(message = 'Unauthorized', details = {}) {
    super('UNAUTHORIZED', message, 401, details);
  }
}

class ForbiddenError extends AppError {
  constructor(message = 'Forbidden', details = {}) {
    super('FORBIDDEN', message, 403, details);
  }
}

class ConflictError extends AppError {
  constructor(message = 'Conflict', details = {}) {
    super('CONFLICT', message, 409, details);
  }
}

class BusinessError extends AppError {
  constructor(code = 'BUSINESSERROR', message = 'Business rule violated', details = {}) {
    super(code, message, 422, details);
  }
}

module.exports = {
  AppError,
  ValidationError,
  NotFoundError,
  UnauthorizedError,
  ForbiddenError,
  ConflictError,
  BusinessError,
};
