import { Request } from "./types.js";
import { BadRequestError, PayloadTooLargeError } from "./error.js";

const BODY_LIMIT = 1024 * 1024; // 1MB

export function decorateRequest(request: Request) {
  let parsedQuery: Record<string, string> | null = null;

  Object.defineProperty(request, "query", {
    get() {
      if (parsedQuery) {
        return parsedQuery;
      }

      const url = new URL(request.url || "/", "http://localhost");

      parsedQuery = {};

      for (const [key, value] of url.searchParams.entries()) {
        parsedQuery[key] = value;
      }
      return parsedQuery;
    }
  })

  request.params = {} as never;
  request.body = null as never;
  request.context = {};

  return request;
}

export async function parseBody(request: Request) {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = [];

    let totalSize = 0;

    let completed = false;

    function cleanup() {
      request.off("data", onData);
      request.off("end", onEnd);
      request.off("error", onError);
    }

    function fail(error: Error) {
      if (completed) {
        return;
      }

      completed = true;

      cleanup();

      reject(error);
    }

    function success(data: unknown) {
      if (completed) {
        return;
      }

      completed = true;

      cleanup();

      resolve(data);
    }

    function onData(chunk: Buffer) {
      if (completed) {
        return;
      }

      totalSize += chunk.length;

      if (totalSize > BODY_LIMIT) {
        request.resume();

        fail(new PayloadTooLargeError());

        return;
      }

      chunks.push(chunk);
    }

    function onEnd() {
      if (completed) {
        return;
      }

      try {
        const raw = Buffer.concat(chunks).toString("utf-8");

        if (!raw) {
          success({});
          return;
        }

        const contentType = request.headers["content-type"] || "";

        if (contentType.includes("application/json")) {
          success(JSON.parse(raw));
          return;
        }

        success(raw);
      } catch {
        fail(new BadRequestError("Invalid JSON body"));
      }
    }

    function onError(error: Error) {
      fail(error);
    }

    request.on("data", onData);
    request.on("end", onEnd);
    request.on("error", onError);
  })
}
