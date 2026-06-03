import { IncomingMessage, ServerResponse } from 'node:http';

export interface RequestContext {
  [key: string]: unknown;
}

export interface RouteGeneric {
  Params?: Record<string, string>;
  Query?: Record<string, unknown>;
  Body?: unknown;
}

type ParamsType<T extends RouteGeneric> =
  T["Params"] extends Record<string, string>
  ? T["Params"]
  : Record<string, string>;

type QueryType<T extends RouteGeneric> =
  T["Query"] extends Record<string, unknown>
  ? T["Query"]
  : Record<string, unknown>;

type BodyType<T extends RouteGeneric> =
  T["Body"] extends unknown
  ? T["Body"]
  : unknown;

export interface Request<T extends RouteGeneric = RouteGeneric> extends IncomingMessage {
  query: QueryType<T>;
  params: ParamsType<T>;
  body: BodyType<T>;
  context: RequestContext;
}

export interface Reply extends ServerResponse {
  json: (data: unknown) => void;
  send: (data: unknown) => void;
  status: (code: number) => Reply;
}

export type Handler<T extends RouteGeneric = RouteGeneric> = (
  request: Request<T>, reply: Reply
) => unknown | Promise<unknown>;

export type ErrorHandler = (
  error: Error, request: Request, reply: Reply
) => unknown | Promise<unknown>;

export type ErrorConstructor = new (...args: any[]) => Error;

export type NextFunction = () => Promise<void>;

export type Middleware = (
  request: Request,
  reply: Reply,
  next: NextFunction
) => unknown | Promise<unknown>;

export interface PluginOptions {
  [key: string]: unknown;
}

export interface AppLike {
  use: (middleware: Middleware) => void;
  decorate(name: string, value: unknown): void;
}

export type Plugin<T extends PluginOptions = PluginOptions> = (
  app: AppLike, options: T
) => void | Promise<void>;

export type HookType =
  | "onRequest"
  | "preHandler"
  | "onResponse";

export type Hook = (request: Request, reply: Reply) => unknown | Promise<unknown>;

export type ErrorHook = (error: Error, request: Request, reply: Reply) => unknown | Promise<unknown>;

export interface AppOptions {
  bodyLimit?: number;
}

export type NotFoundHandler = (request: Request, reply: Reply) => unknown | Promise<unknown>;

export type ShutdownHook = () => void | Promise<void>;
