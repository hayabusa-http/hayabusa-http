import http from "node:http";
import { Router } from "./router.js";
import { ErrorConstructor, ErrorHandler, Handler, Reply, Request } from "./types.js";
import { decorateRequest, parseBody } from "./request.js";
import { decorateReply } from "./reply.js";

export class App {
  private router = new Router();

  private errorHandlers = new Map<ErrorConstructor, ErrorHandler>();

  private defaultErrorHandler:
    | ErrorHandler
    | null = null;

  private register(method: string, path: string, handler: Handler) {
    this.router.register(method, path, handler);
  }

  get(path: string, handler: Handler) {
    this.register("GET", path, handler);
  }

  post(path: string, handler: Handler) {
    this.register("POST", path, handler);
  }

  put(path: string, handler: Handler) {
    this.register("PUT", path, handler);
  }

  patch(path: string, handler: Handler) {
    this.register("PATCH", path, handler);
  }

  delete(path: string, handler: Handler) {
    this.register("DELETE", path, handler);
  }

  options(path: string, handler: Handler) {
    this.register("OPTIONS", path, handler);
  }

  head(path: string, handler: Handler) {
    this.register("HEAD", path, handler);
  }

  setErrorHandler(errorClass: ErrorConstructor, handler: ErrorHandler) {
    this.errorHandlers.set(errorClass, handler);
  }

  setDefaultErrorHandler(handler: ErrorHandler) {
    this.defaultErrorHandler = handler;
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

          const result = await match.handler(request, reply);

          if (result !== undefined && !reply.writableEnded) {
            reply.send(result);
          }
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
