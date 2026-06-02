import { Handler } from "./types.js";

interface Route {
  method: string;
  handler: Handler;
  regex: RegExp;
  keys: string[];
}

interface MatchResult {
  handler: Handler;
  params: Record<string, string>;
}

class RadixNode {
  segment: string;
  children = new Map<string, RadixNode>;
  paramChild?: RadixNode;
  paramName?: string;
  handler?: Handler;

  constructor(segment: string) {
    this.segment = segment;
  }
}

export class Router {
  private trees = new Map<string, RadixNode>;

  constructor() {
    this.trees.set("GET", new RadixNode(""));
    this.trees.set("POST", new RadixNode(""));
    this.trees.set("PUT", new RadixNode(""));
    this.trees.set("PATCH", new RadixNode(""));
    this.trees.set("DELETE", new RadixNode(""));
    this.trees.set("OPTIONS", new RadixNode(""));
    this.trees.set("HEAD", new RadixNode(""));
  }

  register(method: string, path: string, handler: Handler) {
    const root = this.trees.get(method);
    if (!root) {
      throw new Error(`Unknown method ${method}`);
    }

    const segments = path.split("/").filter(Boolean);
    let node = root;

    for (const segment of segments) {
      if (segment.startsWith(":")) {
        if (!node.paramChild) {
          node.paramChild = new RadixNode("*");
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

    node.handler = handler;
  }

  find(method: string, path: string): MatchResult | null {
    const root = this.trees.get(method);
    if (!root) {
      return null;
    }

    const segments = path.split("/").filter(Boolean);

    let node = root;

    const params: Record<string, string> = {};

    for (const segment of segments) {
      const staticChild = node.children.get(segment);
      if (staticChild) {
        node = staticChild;
        continue;
      }

      if (node.paramChild) {
        params[node.paramChild.paramName!] = segment;

        node = node.paramChild;
        continue;
      }

      return null;
    }

    if (!node.handler) {
      return null;
    }

    return {
      handler: node.handler,
      params,
    };
  }
}
