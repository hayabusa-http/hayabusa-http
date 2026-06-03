import http from "node:http";
import { Router } from "./router.js";
import { ErrorConstructor, ErrorHandler, Handler, Middleware, Reply, Request, RouteGeneric, PluginOptions, Plugin, AppLike, Hook, ErrorHook, HookType } from "./types.js";
import { decorateRequest, parseBody } from "./request.js";
import { decorateReply } from "./reply.js";

export class App implements AppLike {
  private router = new Router();

  /**
   * == Middleware part ==
   */
  private middlewares: Middleware[] = [];

  use(middleware: Middleware) {
    this.middlewares.push(middleware);
  }

  /**
   * == Error Handler part ==
   */
  private errorHandlers = new Map<ErrorConstructor, ErrorHandler>();

  setErrorHandler(errorClass: ErrorConstructor, handler: ErrorHandler) {
    this.errorHandlers.set(errorClass, handler);
  }

  /**
   * == Default Error Handler part ==
   */
  private defaultErrorHandler:
    | ErrorHandler
    | null = null;

  setDefaultErrorHandler(handler: ErrorHandler) {
    this.defaultErrorHandler = handler;
  }

  /**
   * == Plugin part ==
   * To resolve the invariant issue in TypeScript, it is defined as any as follows.
   */
  private plugins = new Set<Plugin<any>>();

  async usePlugin<T extends PluginOptions>(plugin: Plugin<T>, options: T = {} as T) {
    if (this.plugins.has(plugin)) {
      return;
    }

    this.plugins.add(plugin);

    await plugin(this, options);
  }

  /**
   * == Decoration part ==
   */
  private decorations = new Map<string, unknown>();

  decorate(name: string, value: unknown) {
    if (this.decorations.has(name)) {
      throw new Error(`Decoration ${name} already exists`);
    }

    this.decorations.set(name, value);
    Object.defineProperty(this, name, {
      value, writable: false, configurable: false, enumerable: true
    });
  }

  /**
   * == Hook part ==
   */
  private hooks: {
    onRequest: Hook[];
    preHandler: Hook[];
    onResponse: Hook[];
    onError: ErrorHook[];
  } = {
      onRequest: [],
      preHandler: [],
      onResponse: [],
      onError: [],
    };

  addHook(type: "onRequest" | "preHandler" | "onResponse", fn: Hook): void;
  addHook(type: "onError", fn: ErrorHook): void;
  addHook(type: HookType | "onError", fn: any) {
    this.hooks[type].push(fn);
  }

  private async runHooks(hooks: Hook[], request: Request, reply: Reply) {
    for (const hook of hooks) {
      if (reply.writableEnded) return;
      await hook(request, reply);
    }
  }

  private async runErrorHooks(error: Error, request: Request, reply: Reply) {
    for (const hook of this.hooks.onError) {
      await hook(error, request, reply);
    }
  }

  /**
   * == Router Setting ==
   */
  private register(method: string, path: string, middlewares: Middleware[], handler: Handler) {
    this.router.register(method, path, handler, middlewares);
  }

  get<T extends RouteGeneric = RouteGeneric>(path: string, handler: Handler<T>): void;

  get<T extends RouteGeneric = RouteGeneric>(path: string, ...handlers: [...Middleware[], Handler<T>]): void;

  get(path: string, ...handlers: (Middleware | Handler)[]) {
    const handler = handlers[handlers.length - 1] as Handler;
    const middlewares = handlers.slice(0, -1) as Middleware[];
    this.register("GET", path, middlewares, handler);
  }

  post<T extends RouteGeneric = RouteGeneric>(path: string, handler: Handler<T>): void;

  post<T extends RouteGeneric = RouteGeneric>(path: string, ...handlers: [...Middleware[], Handler<T>]): void;

  post(path: string, ...handlers: (Middleware | Handler)[]) {
    const handler = handlers[handlers.length - 1] as Handler;
    const middlewares = handlers.slice(0, -1) as Middleware[];
    this.register("POST", path, middlewares, handler);
  }

  put<T extends RouteGeneric = RouteGeneric>(path: string, handler: Handler<T>): void;

  put<T extends RouteGeneric = RouteGeneric>(path: string, ...handlers: [...Middleware[], Handler<T>]): void;

  put(path: string, ...handlers: (Middleware | Handler)[]) {
    const handler = handlers[handlers.length - 1] as Handler;
    const middlewares = handlers.slice(0, -1) as Middleware[];
    this.register("PUT", path, middlewares, handler);
  }

  patch<T extends RouteGeneric = RouteGeneric>(path: string, handler: Handler<T>): void;

  patch<T extends RouteGeneric = RouteGeneric>(path: string, ...handlers: [...Middleware[], Handler<T>]): void;

  patch(path: string, ...handlers: (Middleware | Handler)[]) {
    const handler = handlers[handlers.length - 1] as Handler;
    const middlewares = handlers.slice(0, -1) as Middleware[];
    this.register("PATCH", path, middlewares, handler);
  }

  delete<T extends RouteGeneric = RouteGeneric>(path: string, handler: Handler<T>): void;

  delete<T extends RouteGeneric = RouteGeneric>(path: string, ...handlers: [...Middleware[], Handler<T>]): void;

  delete(path: string, ...handlers: (Middleware | Handler)[]) {
    const handler = handlers[handlers.length - 1] as Handler;
    const middlewares = handlers.slice(0, -1) as Middleware[];
    this.register("DELETE", path, middlewares, handler);
  }

  options<T extends RouteGeneric = RouteGeneric>(path: string, handler: Handler<T>): void;

  options<T extends RouteGeneric = RouteGeneric>(path: string, ...handlers: [...Middleware[], Handler<T>]): void;

  options(path: string, ...handlers: (Middleware | Handler)[]) {
    const handler = handlers[handlers.length - 1] as Handler;
    const middlewares = handlers.slice(0, -1) as Middleware[];
    this.register("OPTIONS", path, middlewares, handler);
  }

  head<T extends RouteGeneric = RouteGeneric>(path: string, handler: Handler<T>): void;

  head<T extends RouteGeneric = RouteGeneric>(path: string, ...handlers: [...Middleware[], Handler<T>]): void;

  head(path: string, ...handlers: (Middleware | Handler)[]) {
    const handler = handlers[handlers.length - 1] as Handler;
    const middlewares = handlers.slice(0, -1) as Middleware[];
    this.register("HEAD", path, middlewares, handler);
  }

  private async runMiddlewares(request: Request, reply: Reply, handler: Handler, routeMiddlewares: Middleware[]) {
    let index = -1;

    const stack = [...this.middlewares, ...routeMiddlewares];

    const dispatch = async (i: number): Promise<void> => {
      if (reply.writableEnded) {
        return;
      }

      if (i <= index) {
        throw new Error("next() called multiple times");
      }

      index = i;

      if (i === stack.length) {
        const result = await handler(request, reply);
        if (result !== undefined && !reply.writableEnded) {
          reply.send(result);
        }
        return;
      }

      const middleware = stack[i];
      let nextCalled = false;

      await middleware(request, reply, async () => {
        nextCalled = true;
        await dispatch(i + 1);
      });

      if (!nextCalled && !reply.writableEnded) {
        console.warn(`Middleware ${i} exited without next()`);
      }
    };

    await dispatch(0);
  }

  private async handleError(error: unknown, request: Request, reply: Reply) {
    const err = error instanceof Error
      ? error
      : new Error("Unknown error");

    try {
      for (const [errorClass, errorHandler] of this.errorHandlers) {
        if (err instanceof errorClass) {
          await errorHandler(err, request, reply);
          return;
        }
      }

      if (this.defaultErrorHandler) {
        await this.defaultErrorHandler(err, request, reply);
        return;
      }

      if (!reply.writableEnded) {
        reply.status(500).send({
          error: "Internal Server Error",
        });
      }
    } catch (fatalError) {
      console.error("fata error handler crash:", fatalError);

      if (!reply.writableEnded) {
        reply.status(500).send({
          error: "Fatal Internal Server Error",
        });
      }
    }
  }

  listen(port: number) {
    const server = http.createServer(
      async (req, res) => {
        const request = decorateRequest(req as Request);
        const reply = decorateReply(res as Reply);

        try {
          const method = request.method || "GET";
          const path = request.url?.split("?")[0] || "/";

          await this.runHooks(this.hooks.onRequest, request, reply);

          const match = this.router.find(method, path);
          if (!match) {
            reply.status(404).send({
              error: "Not Found",
            });

            return;
          }

          request.params = match.params;

          if (method !== "GET" && method !== "HEAD") {
            request.body = await parseBody(request);
          }

          await this.runHooks(this.hooks.preHandler, request, reply);

          await this.runMiddlewares(request, reply, match.handler, match.middlewares);

          await this.runHooks(this.hooks.onResponse, request, reply);
        } catch (error) {
          await this.handleError(error, request, reply);
        }
      }
    );

    server.on("clientError", (error, socket) => {
      console.error("Client error:", error);

      socket.end("HTTP/1.1 400 Bad Request\r\n\r\n");
    });

    process.on("unhandledRejection", error => {
      console.error("Unhandled Rejection:", error);
    });

    server.listen(port, () => {
      console.log(`Hayabusa Server listening on ${port}`);
    });
  }
}
