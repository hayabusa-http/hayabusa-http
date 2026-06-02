import { Handler, Middleware } from "./types.js";

interface Route {
  handler: Handler;
  middlewares: Middleware[];
}

interface MatchResult {
  handler: Handler;
  middlewares: Middleware[];
  params: Record<string, string>;
}

class RadixNode {
  segment: string;
  children = new Map<string, RadixNode>();
  paramChild?: RadixNode;
  paramName?: string;
  wildcardChild?: RadixNode;
  wildcardName?: string;
  route?: Route;

  constructor(segment: string) {
    this.segment = segment;
  }
}

export class Router {
  private trees = new Map<string, RadixNode>();

  constructor() {
    this.trees.set("GET", new RadixNode(""));
    this.trees.set("POST", new RadixNode(""));
    this.trees.set("PUT", new RadixNode(""));
    this.trees.set("PATCH", new RadixNode(""));
    this.trees.set("DELETE", new RadixNode(""));
    this.trees.set("OPTIONS", new RadixNode(""));
    this.trees.set("HEAD", new RadixNode(""));
  }

  register(method: string, path: string, handler: Handler, middlewares: Middleware[]) {
    const root = this.trees.get(method);
    if (!root) {
      throw new Error(`Unknown method ${method}`);
    }

    const segments = path.split("/").filter(Boolean);
    let node = root;

    for (let i = 0; i < segments.length; i++) {
      const segment = segments[i];

      if (segment.startsWith("*")) {
        if (i !== segments.length - 1) {
          throw new Error("Wildcard must be the last segment");
        }

        const name = segment.slice(1) || "wildcard";
        if (!node.wildcardChild) {
          node.wildcardChild = new RadixNode("*");
          node.wildcardChild.wildcardName = name;
        }

        node = node.wildcardChild;
        break;
      }

      if (segment.startsWith(":")) {
        if (!node.paramChild) {
          node.paramChild = new RadixNode(":");
          node.paramChild.paramName = segment.slice(1);
        }
        node = node.paramChild;
        continue;
      }

      let child = node.children.get(segment);
      if (!child) {
        child = new RadixNode(segment);
        node.children.set(segment, child);
      }

      node = child;
    }

    node.route = {
      handler,
      middlewares,
    };
  }

  find(method: string, path: string): MatchResult | null {
    const root = this.trees.get(method);
    if (!root) {
      return null;
    }

    const segments = path.split("/").filter(Boolean);

    let node = root;

    const params: Record<string, string> = {};

    for (let i = 0; i < segments.length; i++) {
      const staticChild = node.children.get(segments[i]);
      if (staticChild) {
        node = staticChild;
        continue;
      }

      if (node.paramChild) {
        params[node.paramChild.paramName!] = segments[i];

        node = node.paramChild;
        continue;
      }

      if (node.wildcardChild) {
        params[node.wildcardChild.wildcardName!] = segments.slice(i).join("/");
        node = node.wildcardChild;
        break;
      }

      return null;
    }

    if (!node.route) {
      return null;
    }

    return {
      handler: node.route.handler,
      middlewares: node.route.middlewares,
      params,
    };
  }
}
