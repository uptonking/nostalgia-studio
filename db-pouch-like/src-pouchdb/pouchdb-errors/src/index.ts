export class PouchError extends Error {
  status: number;
  error: boolean;
  reason: string;

  constructor(status: number, error: string, reason: string) {
    super();
    this.status = status;
    this.name = error;
    this.message = reason;
    this.error = true;
  }

  toString() {
    return JSON.stringify({
      status: this.status,
      name: this.name,
      message: this.message,
      reason: this.reason,
    });
  }
}

const UNAUTHORIZED = new PouchError(
  401,
  'unauthorized',
  'Name or password is incorrect.',
);
const MISSING_BULK_DOCS = new PouchError(
  400,
  'bad_request',
  "Missing JSON list of 'docs'",
);
const MISSING_DOC = new PouchError(404, 'not_found', 'missing');
const REV_CONFLICT = new PouchError(
  409,
  'conflict',
  'Document update conflict',
);
const INVALID_ID = new PouchError(
  400,
  'bad_request',
  '_id field must contain a string',
);
const MISSING_ID = new PouchError(
  412,
  'missing_id',
  '_id is required for puts',
);
const RESERVED_ID = new PouchError(
  400,
  'bad_request',
  'Only reserved document ids may start with underscore.',
);
const NOT_OPEN = new PouchError(
  412,
  'precondition_failed',
  'Database not open',
);
const UNKNOWN_ERROR = new PouchError(
  500,
  'unknown_error',
  'Database encountered an unknown error',
);
const BAD_ARG = new PouchError(500, 'badarg', 'Some query argument is invalid');
const INVALID_REQUEST = new PouchError(
  400,
  'invalid_request',
  'Request was invalid',
);
const QUERY_PARSE_ERROR = new PouchError(
  400,
  'query_parse_error',
  'Some query parameter is invalid',
);
const DOC_VALIDATION = new PouchError(
  500,
  'doc_validation',
  'Bad special document member',
);
const BAD_REQUEST = new PouchError(
  400,
  'bad_request',
  'Something wrong with the request',
);
const NOT_AN_OBJECT = new PouchError(
  400,
  'bad_request',
  'Document must be a JSON object',
);
const DB_MISSING = new PouchError(404, 'not_found', 'Database not found');
const IDB_ERROR = new PouchError(500, 'indexed_db_went_bad', 'unknown');
const WSQ_ERROR = new PouchError(500, 'web_sql_went_bad', 'unknown');
const LDB_ERROR = new PouchError(500, 'levelDB_went_went_bad', 'unknown');
const FORBIDDEN = new PouchError(
  403,
  'forbidden',
  'Forbidden by design doc validate_doc_update function',
);
const INVALID_REV = new PouchError(400, 'bad_request', 'Invalid rev format');
const FILE_EXISTS = new PouchError(
  412,
  'file_exists',
  'The database could not be created, the file already exists.',
);
const MISSING_STUB = new PouchError(
  412,
  'missing_stub',
  "A pre-existing attachment stub wasn't found",
);
const INVALID_URL = new PouchError(
  413,
  'invalid_url',
  'Provided URL is invalid',
);

// todo migrate to class extends
function createError(
  error: PouchError,
  reason?: string,
  message?: string,
): PouchError {
  function CustomPouchError(reason?: string) {
    // inherit error properties from our parent error manually
    // so as to allow proper JSON parsing.
    const names = Object.getOwnPropertyNames(error);
    for (let i = 0, len = names.length; i < len; i++) {
      // @ts-expect-error fix-types
      if (typeof error[names[i]] !== 'function') {
        // @ts-expect-error fix-types
        this[names[i]] = error[names[i]];
      }
    }

    // @ts-expect-error fix-types
    if (this.stack === undefined) {
      // @ts-expect-error fix-types
      this.stack = new Error().stack;
    }

    if (reason !== undefined) {
      // @ts-expect-error fix-types
      this.reason = reason;
    }
  }
  CustomPouchError.prototype = PouchError.prototype;

  // @ts-expect-error fix-types
  return new CustomPouchError(reason);
}

function generateErrorFromResponse(err: Record<string, any>) {
  if (typeof err !== 'object') {
    const data = err;
    err = UNKNOWN_ERROR;
    err.data = data;
  }

  if ('error' in err && err.error === 'conflict') {
    err.name = 'conflict';
    err.status = 409;
  }

  if (!('name' in err)) {
    err.name = err.error || 'unknown';
  }

  if (!('status' in err)) {
    err.status = 500;
  }

  if (!('message' in err)) {
    err.message = err.message || err.reason;
  }

  if (!('stack' in err)) {
    err.stack = new Error().stack;
  }

  return err;
}

export {
  UNAUTHORIZED,
  MISSING_BULK_DOCS,
  MISSING_DOC,
  REV_CONFLICT,
  INVALID_ID,
  MISSING_ID,
  RESERVED_ID,
  NOT_OPEN,
  UNKNOWN_ERROR,
  BAD_ARG,
  INVALID_REQUEST,
  QUERY_PARSE_ERROR,
  DOC_VALIDATION,
  BAD_REQUEST,
  NOT_AN_OBJECT,
  DB_MISSING,
  WSQ_ERROR,
  LDB_ERROR,
  FORBIDDEN,
  INVALID_REV,
  FILE_EXISTS,
  MISSING_STUB,
  IDB_ERROR,
  INVALID_URL,
  createError,
  generateErrorFromResponse,
};
