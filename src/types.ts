import { IncomingMessage, ServerResponse } from 'node:http';

export interface Request extends IncomingMessage {
  query?: Record<string, string>;
  params?: Record<string, string>;
  body?: any;
}

export interface Reply extends ServerResponse {
  json: (data: unknown) => void;
  send: (data: unknown) => void;
  status: (code: number) => Reply;
}

export type Handler = (reqest: Request, reply: Reply) => unknown | Promise<unknown>;

export type ErrorHandler = (error: Error, request: Request, reply: Reply) => unknown | Promise<unknown>;

export type ErrorConstructor = new (...args: any[]) => Error;
