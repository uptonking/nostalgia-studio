export class ApiError extends Error {
  statusCode: number;

  constructor(statusCode: number, message: string) {
    super(message);
    this.statusCode = statusCode;
  }
}

export class ServerError extends Error {
  constructor(message = 'Internal Server Error') {
    super(message);
    this.name = this.constructor.name;
  }
}

export class ForbiddenError extends ServerError {
  constructor(message) {
    super(`You are not the author of this ${message}`);
  }
}

export class NotFoundError extends ServerError {
  constructor(property, message = '') {
    super(`${property} Not Found ${message}`);
  }
}

export class UnauthorizedError extends ServerError {
  constructor() {
    super('You need to login first!');
  }
}

export class ValidationError extends ServerError {
  constructor(message) {
    super(`Validation failed ${message}`);
  }
}

export class FieldRequiredError extends ValidationError {
  constructor(field) {
    super(`${field} is required`);
  }
}

export class AlreadyTakenError extends ValidationError {
  constructor(property, message = '') {
    super(`${property} already exists.. ${message}`);
  }
}
