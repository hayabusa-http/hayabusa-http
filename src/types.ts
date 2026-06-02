import { IncomingMessage, ServerResponse } from 'node:http';

export interface RequestContext {
  [key: string]: unknown;
}

export interface Request<T extends RouteGeneric = RouteGeneric> extends IncomingMessage {
  query: T["Query"];
  params: T["Params"];
  body: T["Body"];
  context: RequestContext;
}

export interface Reply extends ServerResponse {
  json: (data: unknown) => void;
  send: (data: unknown) => void;
  status: (code: number) => Reply;
}

export type Handler<T extends RouteGeneric = RouteGeneric> = (reqest: Request<T>, reply: Reply) => unknown | Promise<unknown>;

export type ErrorHandler = (error: Error, request: Request, reply: Reply) => unknown | Promise<unknown>;

export type ErrorConstructor = new (...args: any[]) => Error;

export type NextFunction = () => Promise<void>;

export type Middleware = (
  request: Request,
  reply: Reply,
  next: NextFunction
) => unknown | Promise<unknown>;

export interface RouteGeneric {
  Params?: Record<string, string>;
  Query?: Record<string, unknown>;
  Body?: unknown;
}
