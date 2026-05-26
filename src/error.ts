export class HttpError extends Error {
  constructor(
    public statusCode: number,
    message: string
  ) {
    super(message);
  }
}

export class BodyTooLargeError
  extends HttpError {
  constructor() {
    super(413, "Body too large");
  }
}

export class BadRequestError
  extends HttpError {
  constructor(message = "Bad request") {
    super(400, message);
  }
}
