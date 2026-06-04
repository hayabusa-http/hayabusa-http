<p align="center">
  <img width="500" height="500" alt="Image" src="https://github.com/user-attachments/assets/6ecfddbc-8bf7-48f4-ae05-8d40c97807e7" />
</p>

Hayabusa is built for flexibility. Like LEGO bricks, you can assemble and customize it to perfectly match your own workflow or your company's architecture. Rather than forcing specific libraries or patterns, Hayabusa gives developers the freedom to choose the tools they prefer and integrate them seamlessly.

Need a backend framework that is lighter, faster, and easier to customize than Express? Hayabusa is the right choice.

## Table of Contents

- [Installation](#installation-setup)

## Core

- [Server Creation and Startup](#server-creation-and-startup)
- [GET method](#get-method)
- [POST method](#post-method)
- [PUT method](#put-method)
- [PATCH method](#patch-method)
- [DELETE method](#delete-method)
- [Param](#param)
- [Query](#query)
- [Wildcard](#wildcard)

### Middleware

- [Global Middleware](#global-middleware)
  - [Authentication Example](#authentication-example)
- [Route Middleware](#route-middleware)

### Error Handling

- [Error Handling](#error-handling)
  - [Custom Error Handler](#custom-error-handler)
  - [Default Error Handler](#default-error-handler)
- [Errors](#errors)
  - [Hayabusa Error](#hayabusa-error)
  - [4XX Errors](#4xx-errors)
  - [5XX Errors](#5xx-errors)

### Extensions

- [Using Decoration](#using-decoration)
  - [Global Decoration](#global-decoration)
  - [Request Decoration](#request-decoration)
  - [Reply Decoration](#reply-decoration)
- [Using Plugin](#using-plugin)
- [Using context](#using-context)
  - [Set Context](#set-context)
  - [Read Context](#read-context)
  - [JWT Example](#jwt-example)

### Lifecycle

- [Hook system](#hook-system)
  - [onRequest](#onrequest)
  - [preHandler](#prehandler)
  - [onResponse](#onresponse)
  - [onError](#onerror)
- [Using NotFoundHandler](#using-notfoundhandler)
- [Graceful Shutdown](#graceful-shutdown)
  - [Database Shutdown](#database-shutdown)
  - [Redis Shutdown](#redis-shutdown)
  - [Logger Flush](#logger-flush)
  - [Automatic Signal Handling](#automatic-signal-handling)

## Real-World Examples

- [Using Bigint in Hayabusa](#using-bigint-in-hayabusa)
- [CORS](#cors)
- [Cookie](#cookie)
  - [Read Cookie](#read-cookie)
  - [Write Cookie](#write-cookie)
  - [Real World examples - JWT](#real-world-examples---jwt)

## Installation & Setup

```bash
npm init -y
npm i -D typescript tsx @types/node
npm i @hayabusa-http/hayabusa-http
npx tsc —init
```

- Hayabusa is ESM-only. Therefore, your package.json must contain the following setting: `"type": "module"`

```json
{
  "name": "my-hayabusa-app",
  "version": "1.0.0",
  "type": "module",
  "scripts": {
    "dev": "tsx watch src/server.ts",
    "build": "tsc",
    "start": "node dist/server.js"
  },
  "dependencies": {
    "@hayabusa-http/hayabusa-http": "^0.1.1"
  },
  "devDependencies": {
    "@types/node": "^25.0.0",
    "tsx": "^4.22.3",
    "typescript": "^6.0.0"
  }
}
```

- Notice!!! :
  - Hayabusa relies on Node.js packages, so you must include `"node"` in the `types` array of your tsconfig file.
- Set up a basic `tsconfig.json`. You can modify the configuration to suit your own needs and coding style.

```json
{
  "compilerOptions": {
    "target": "ES2022",

    "module": "NodeNext",
    "moduleResolution": "NodeNext",
    "types": [
      "node"
    ],
    "rootDir": "src",
    "outDir": "dist",

    "strict": true,

    "esModuleInterop": true,
    "skipLibCheck": true,

    "declaration": false
  },

  "include": [
    "src"
  ]
}
```

- `mkdir src`

```ts
//src/server.ts
import { App } from "@hayabusa-http/hayabusa-http";

const app = new App();
app.get("/", async () => {
  return {
    hello: true
  }
});

app.listen(3000);
```

## Core

### Server Creation and Startup

- The default JSON body size limit is 1MB.
  - However, if you need to accept larger payloads, you can configure a custom limit.
  - The value can be customized as long as it remains within the range supported by Javascript's number type.
  - In practice, though, there is rarely a need to change this setting, as most web servers also use a default limit of around 1MB for JSON request bodies.
- You can specify the port when creating the server.

```ts
const app = new App();
//or Customize Json Body Size
const app = new App({ bodyLimit: 5 * 1024 * 1024}); //5MB Body size, default size is 1MB

app.listen(3000);
```

### GET method

```ts
app.get("/hello", async () => {
  return {
    ok: true,
  };
});
```

### POST method

- To use request body data, specify the expected fields in the Body object, as demonstrated in the example below.

```ts
app.post<{ Body: { name: string; nation: string; } }>("/hayabusa", async (req) => {
  return {
    method: "POST",
    body: req.body,
  };
});
```

### PUT method

- Similar to POST requests, body data can be accessed by defining its structure in the Body object, as demonstrated in the example.

```ts
app.put<{ Query: { id: string; }; Body: { name: string; nation: string; } }>("/hayabusa/:id", async (req) => {
  return {
    method: "PUT",
    body: req.body,
  };
});
```

### PATCH method

- Similar to POST requests, body data can be accessed by defining its structure in the Body object, as demonstrated in the example.

```ts
app.patch<{ Query: { id: string; }; Body: { nation: string; } }>("/hayabusa/:id", async (req) => {
  return {
    method: "PATCH",
    body: req.body,
  };
});
```

### DELETE method

```ts
app.delete<{ Query: { id: string; }; }("/hayabusa/:id", async (req) => {
  return {
    method: "DELETE",
    param: req.params.id,
  };
});
```

### Param

- Regardless of the number of route parameters, they are all available through the Params object.
- To define a route parameter, use the :parameter syntax in the URL.
- This tells the framework which parts of the path should be treated as parameters.

```ts
app.get<{ Params: { id: string; } }>(
  "/hayabusa/:id",
  async (req) => {
    return {
      id: req.params.id,
    };
  }
);
```

### Query

- This example uses multiple route parameters and query string values together.
- Query string parameters are automatically available through the Query object, so there is no need to define them in the route URL.
- You can access any query string value directly from the Query object and use it as needed, as demonstrated below.

```ts
app.get<{ Params: { id: string; callId: string; }, Query: { page: string; size: string; } }>(
  "/hayabusa/:id/call/:callId",
  async (req) => {
    return {
      id: req.params.id,
      callId: req.params.callId,
      page: req.query.page,
      size: req.query.size,
    }
  }
);
```

### Wildcard

- Notice!!
  - The wildcard must be the last segment.
  - It must not be in the middle of the URL.

#### Wildcard Example

- Wildcards can be retrieved from the params variable.
- The names of wildcards included in the written URL are automatically inferred.

```ts
app.get("/wildcard/test/*wildcard", async (req) => {
  return {
    wildcard: req.params.wildcard
  }
});
```

### Global Middleware

- Global middleware runs for every request.
- It is useful for logging, authentication, CORS, rate limiting, and request preprocessing.
- Middleware execution order follows the registration order.

```ts
app.use(async (req, reply, next) => {
  const start = performance.now();

  await next();

  const end = performance.now();

  console.log(
    `${req.method} ${req.url} ${end - start}ms`
  );
});
```

#### Authentication Example

```ts
app.use(async (req, reply, next) => {
  const auth =
    req.headers.authorization;

  if (!auth) {
    reply.status(401).send({
      error: "Unauthorized"
    });

    return;
  }

  // Token Parsing and Validation...

  await next();
});
```

### Route Middleware

- Route middleware only runs for the routes where it is explicitly attached.
- Multiple route middlewares can be chained together.

```ts
const authMiddleware: Middleware =
  async (req, reply, next) => {
    const auth =
      req.headers.authorization;

    if (!auth) {
      reply.status(401).send({
        error: "Unauthorized",
      });

      return;
    }

    await next();
  };

app.get(
  "/admin",
  authMiddleware,
  async () => {
    return {
      admin: true,
    };
  }
);

// Multiple Route Middlewares
app.get(
  "/admin",
  authMiddleware,
  permissionMiddleware,
  async () => {
    return {
      success: true
    };
  }
);
```

### Error Handling

- Hayabusa supports:
  - Custom error handlers
  - Default error handler
  - HTTP errors
  - User-defined errors

#### Custom Error Handler

```ts
app.setErrorHandler(
  BadRequestError,
  (error, req, reply) => {
    reply.status(400).send({
      error: error.message,
    });
  }
);
```

#### Default Error Handler

```ts
app.setDefaultErrorHandler(
  (error, req, reply) => {
    console.error(error);

    reply.status(500).send({
      error: "Something went wrong",
    });
  }
);
```

### Errors

- Hayabusa comes with many build-in error types.
- In most cases, developers can use these predefined errors directly without writing any additional implementations.

#### Hayabusa Error

```ts
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
```

#### 4XX Errors

```ts
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
```

#### 5XX Errors

```ts
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
```

### Using Decoration

- Decorations allow global objects or services to be attached to the application instance.

```ts
app.decorate("config", {
  jwtSecret:
    process.env.JWT_SECRET
});
```

#### Global Decoration

```ts
export const loggerPlugin: Plugin =
  async (app) => {
    app.decorate("logger", {
      info(message: string) {
        console.log(
          `[INFO] ${message}`
        );
      }
    });
  };

await app.usePlugin(
  loggerPlugin
);

app.get("/", async () => {
  const logger =
    (app as any).logger;

  logger.info("hello");

  return {
    success: true
  };
});
```

#### Request Decoration

- Hayabusa currently does not provide a built-in request decoration API.
- Instead, use the request context.

```ts
app.use(async (req, reply, next) => {
  req.context.user = {
    id: 1,
    email: "user@email.com"
  };

  await next();
});
```

#### Reply Decoration

- Hayabusa currently does not provide a built-in reply decoration API.
- if needed, reply behavior can be customized through middleware.

```ts
app.use(async (req, reply, next) => {
  const originalSend =
    reply.send;

  reply.send = (payload) => {
    console.log(
      "Response:",
      payload
    );

    return originalSend.call(
      reply,
      payload
    );
  };

  await next();
});
```

### Using Plugin

- Plugins allow reusable functionality to be packaged and shared.

```ts
export const loggerPlugin: Plugin =
  async (app) => {
    app.decorate("logger", {
      info(message: string) {
        console.log(
          `[INFO] ${message}`
        );
      }
    });
  };

await app.usePlugin(
  loggerPlugin
);
```

### Using context

- The request context allows data sharing across middleware, hooks, and route handlers.

#### Set Context

```ts
app.use(async (req, reply, next) => {
  req.context.user = {
    id: 1,
    email: "user@email.com"
  };

  await next();
});
```

#### Read Context

```ts
app.get("/me", async (req) => {
  return req.context.user;
});
```

#### JWT Example

```ts
const authMiddleware:
  Middleware =
  async (
    req,
    reply,
    next
  ) => {
    const auth =
      req.headers.authorization;

    if (!auth) {
      reply.status(401).send({
        error: "Unauthorized",
      });

      return;
    }

    const [, token] =
      auth.split(" ");

    req.context.token =
      token;

    await next();
  };

app.get(
  "/jwt-test",
  authMiddleware,
  async (req) => {
    return {
      token:
        req.context.token
    };
  }
);
```

### Hook system

- Hooks provide lifecycle interception points.
- Available hooks:
  - onRequest
  - preHandler
  - onResponse
  - onError

#### onRequest

- Runs immediately after receiving a request.

```ts
app.addHook(
  "onRequest",
  async (req) => {
    req.context.startTime =
      performance.now();

    console.log(
      `[REQ] ${req.method} ${req.url}`
    );
  }
);
```

#### preHandler

- Runs after routing but before middleware and handlers.

```ts
app.addHook(
  "preHandler",
  async (req, reply) => {
    if (
      req.url?.startsWith(
        "/admin"
      )
    ) {
      if (
        !req.headers.authorization
      ) {
        reply.status(401).send({
          error:
            "Unauthorized"
        });
      }
    }
  }
);
```

#### onResponse

- Runs after a successful response.

```ts
app.addHook(
  "onResponse",
  async (req) => {
    console.log(
      `Response completed: ${req.url}`
    );
  }
);
```

#### onError

- Runs whenever an error occurs.

```ts
app.addHook(
  "onError",
  async (err, req) => {
    console.error(
      `[ERROR HOOK] ${err.message} at ${req.url}`
    );
  }
);
```

### Using NotFoundHandler

- Customize the response returned when no route matches.

```ts
app.setNotFoundHandler(
  async (req, reply) => {
    reply.status(404).send({
      success: false,
      path: req.url,
      message:
        "Route not found"
    });
  }
);
```

### Graceful Shutdown

- Graceful shutdown allows cleanup before the server exits.
- Typical use cases:
  - Closing database connections
  - Closing Redis connections
  - Flushing logs
  - Releasing external resources

#### Database Shutdown

```ts
app.addShutdownHook(
  async () => {
    await db.destroy();

    console.log(
      "Database connection closed"
    );
  }
);
```

#### Redis Shutdown

```ts
app.addShutdownHook(
  async () => {
    await redis.quit();
  }
);
```

#### Logger Flush

```ts
app.addShutdownHook(
  async () => {
    await logger.flush();
  }
);
```

#### Automatic Signal Handling

- Hayabusa automatically listens for :
  - SIGINT
  - SIGTERM
- When either signals is received:

1. Shutdown hooks execute.
2. HTTP server stops accepting new requests.
3. Process exits safely.

- No Additional configuration is required.

## Real-World Examples

- Explore a variety of practical examples commonly used in web development.

### Using Bigint in Hayabusa

```ts
app.use(async (req, reply, next) => {
  const originalSend = reply.send;

  reply.send = (payload) => {
    if (typeof payload === "object") {
      payload = JSON.parse(
        JSON.stringify(
          payload,
          (_, value) =>
            typeof value === "bigint"
              ? value.toString()
              : value
        )
      );
    }

    return originalSend.call(reply, payload);
  };

  await next();
});
```

### CORS

- During development, you can use the following middleware to enable CORS.

```ts
app.use(async (req, reply, next) => {
  const origin = req.headers.origin;

  if (!origin) {
    await next();
    return;
  }

  const allowedOrigin =
    process.env.FRONTEND_ORIGIN;

  if (origin !== allowedOrigin) {
    reply.status(403).send({
      error: "Not allowed by CORS",
    });
    return;
  }

  reply.setHeader(
    "Access-Control-Allow-Origin",
    origin
  );

  reply.setHeader(
    "Access-Control-Allow-Credentials",
    "true"
  );

  reply.setHeader(
    "Access-Control-Allow-Methods",
    "GET,POST,PUT,PATCH,DELETE,OPTIONS"
  );

  reply.setHeader(
    "Access-Control-Allow-Headers",
    "Content-Type,Authorization"
  );

  if (req.method === "OPTIONS") {
    reply.status(204).send("");
    return;
  }

  await next();
});
```

- For production, you can configure it as follows.

```ts
const allowedOrigins = [
  "https://toexic.org",
  "https://admin.toexic.org",
];
app.use(async (req, reply, next) => {
  const origin = req.headers.origin;

  if (!origin) {
    await next();
    return;
  }

  if (!allowedOrigins.includes(origin)) {
    reply.status(403).send({
      error: "Not allowed by CORS",
    });
    return;
  }

  reply.setHeader(
    "Access-Control-Allow-Origin",
    origin
  );

  reply.setHeader(
    "Access-Control-Allow-Credentials",
    "true"
  );

  if (req.method === "OPTIONS") {
    reply.status(204).send("");
    return;
  }

  await next();
});
```

### Cookie

#### Read Cookie

- GET /cookie
- Cookie : session=abc123; theme=dark

```ts
app.get("/cookie", async (req) => {
  return {
    cookie: req.headers.cookie
  };
});
```

- The cookie will contain the following values.

```json
{
  "cookie": "session=abc123; theme=dark"
}
```

#### Write Cookie

```ts
app.get("/login", async (req, reply) => {
  reply.setHeader(
    "Set-Cookie",
    "session=abc123; HttpOnly; Path=/"
  );

  return {
    success: true
  };
});
```

- Response Headers :
  - Set-Cookie: session=abc123; HttpOnly; Path=/

#### Real World examples - JWT

- JWT login

```ts
app.post("/login", async (req, reply) => {
  const token = "jwt-token";

  reply.setHeader(
    "Set-Cookie",
    [
      `access_token=${token}; HttpOnly; Path=/; SameSite=Lax`
    ]
  );

  return {
    success: true
  };
});
```

- JWT logout

```ts
app.post("/logout", async (req, reply) => {
  reply.setHeader(
    "Set-Cookie",
    "access_token=; Max-Age=0; Path=/"
  );

  return {
    success: true
  };
});
```

- Get member infromation routes

```ts
function parseCookies(cookieHeader?: string) {
  const result: Record<string, string> = {};

  if (!cookieHeader) {
    return result;
  }

  for (const cookie of cookieHeader.split(";")) {
    const [key, value] = cookie.trim().split("=");

    result[key] = value;
  }

  return result;
}

app.get("/me", async (req) => {
  const cookies = parseCookies(
    req.headers.cookie
  );

  return {
    session: cookies.session
  };
});
```
