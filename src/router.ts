import { Handler } from "./types.js";

interface Route {
  method: string;
  handler: Handler;
  parts: string[];
}

export class Router {
  private routes: Route[] = [];

  register(method: string, path: string, handler: Handler) {
    this.routes.push({
      method,
      handler,
      parts: this.split(path),
    });
  }

  find(method: string, path: string) {
    const target = this.split(path);

    for (const route of this.routes) {
      if (route.method !== method) {
        continue;
      }

      if (route.parts.length !== target.length) {
        continue;
      }

      const params: Record<string, string> = {};

      let matched = true;

      for (let i = 0; i < route.parts.length; i++) {
        const routePart = route.parts[i];
        const targetPart = target[i];

        if (routePart.startsWith(":")) {
          const key = routePart.slice(1);
          params[key] = targetPart;
          continue;
        }

        if (routePart !== targetPart) {
          matched = false;
          break;
        }
      }

      if (matched) {
        return {
          handler: route.handler,
          params,
        };
      }
    }

    return null;
  }

  private split(path: string) {
    return path
      .split("/")
      .filter(Boolean);
  }
}
