import { Handler } from "./types.js";

interface Route {
  method: string;
  handler: Handler;
  regex: RegExp;
  keys: string[];
}

export class Router {
  private routes: Route[] = [];

  register(method: string, path: string, handler: Handler) {
    const { regex, keys } = this.compile(path);
    this.routes.push({
      method,
      handler,
      regex,
      keys
    });
  }

  find(method: string, path: string) {
    for (const route of this.routes) {
      if (route.method !== method) {
        continue;
      }

      const match = route.regex.exec(path);
      if (!match) {
        continue;
      }

      const params: Record<string, string> = {};

      for (let i = 0; i < route.keys.length; i++) {
        params[route.keys[i]] = match[i + 1];
      }

      return {
        handler: route.handler,
        params
      };
    }

    return null;
  }

  private compile(path: string) {
    const keys: string[] = [];

    const pattern = path
      .split("/")
      .map(part => {
        if (part.startsWith(":")) {
          keys.push(part.slice(1));
          return "([^/]+)";
        }

        return part.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      }).join("/");

    return {
      regex: new RegExp(`^${pattern}$`),
      keys,
    };
  }
}
