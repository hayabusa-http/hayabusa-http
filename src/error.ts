/**
 * == Hayabusa Error ==
 */
export class RouteNotFoundError extends Error {
  constructor(message = "Route Not Found") {
    super(message);
  }
}

export class DuplicateRouteError extends Error {
  constructor(message = "Route Already Exists") {
    super(message);
  }
}

export class DuplicateDecorationError extends Error {
  constructor(message = "Decoration Already Exists") {
    super(message);
  }
}

export class PluginAlreadyRegisteredError extends Error {
  constructor(message = "Plugin Already Registered") {
    super(message);
  }
}

export class MiddlewareExecutionError extends Error {
  constructor(message = "Middleware Execution Failed") {
    super(message);
  }
}

export class InvalidRouteParameterError extends Error {
  constructor(message = "Invalid Route Parameter") {
    super(message);
  }
}

/**
 * == Http Error ==
 */
export class HttpError extends Error {
  statusCode: number;

  constructor(
    statusCode: number,
    message: string,
  ) {
    super(message);

    this.name = this.constructor.name;
    this.statusCode = statusCode;

    Error.captureStackTrace?.(this, this.constructor);
  }
}

/**
 * == 4XX Error ==
 */
export class BadRequestError
  extends HttpError {
  constructor(message = "Bad request") {
    super(400, message);
  }
}
export class UnauthorizedError extends HttpError {
  constructor(message = "Unauthorized") {
    super(401, message);
  }
}

export class PaymentRequiredError extends HttpError {
  constructor(message = "Payment Required") {
    super(402, message);
  }
}

export class ForbiddenError extends HttpError {
  constructor(message = "Forbidden") {
    super(403, message);
  }
}

export class NotFoundError extends HttpError {
  constructor(message = "Not Found") {
    super(404, message);
  }
}

export class MethodNotAllowedError extends HttpError {
  constructor(message = "Method Not Allowed") {
    super(405, message);
  }
}

export class NotAcceptableError extends HttpError {
  constructor(message = "Not Acceptable") {
    super(406, message);
  }
}

export class ProxyAuthenticationRequiredError extends HttpError {
  constructor(message = "Proxy Authentication Required") {
    super(407, message);
  }
}

export class RequestTimeoutError extends HttpError {
  constructor(message = "Request Timeout") {
    super(408, message);
  }
}

export class ConflictError extends HttpError {
  constructor(message = "Conflict") {
    super(409, message);
  }
}

export class GoneError extends HttpError {
  constructor(message = "Gone") {
    super(410, message);
  }
}

export class LengthRequiredError extends HttpError {
  constructor(message = "Length Required") {
    super(411, message);
  }
}

export class PreconditionFailedError extends HttpError {
  constructor(message = "Precondition Failed") {
    super(412, message);
  }
}

export class PayloadTooLargeError extends HttpError {
  constructor(message = "Payload Too Large") {
    super(413, message);
  }
}

export class URITooLongError extends HttpError {
  constructor(message = "URI Too Long") {
    super(414, message);
  }
}

export class UnsupportedMediaTypeError extends HttpError {
  constructor(message = "Unsupported Media Type") {
    super(415, message);
  }
}

export class UnprocessableEntityError extends HttpError {
  constructor(message = "Unprocessable Entity") {
    super(422, message);
  }
}

export class TooManyRequestsError extends HttpError {
  constructor(message = "Too Many Requests") {
    super(429, message);
  }
}

/**
 * == 5XX Error ==
 */
export class InternalServerError extends HttpError {
  constructor(message = "Internal Server Error") {
    super(500, message);
  }
}

export class NotImplementedError extends HttpError {
  constructor(message = "Not Implemented") {
    super(501, message);
  }
}

export class BadGatewayError extends HttpError {
  constructor(message = "Bad Gateway") {
    super(502, message);
  }
}

export class ServiceUnavailableError extends HttpError {
  constructor(message = "Service Unavailable") {
    super(503, message);
  }
}

export class GatewayTimeoutError extends HttpError {
  constructor(message = "Gateway Timeout") {
    super(504, message);
  }
}
