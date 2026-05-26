import { Reply } from "./types.js";

export function decorateReply(reply: Reply) {
  reply.status = function (code: number) {
    this.statusCode = code;
    return this;
  }

  reply.json = function (data: unknown) {
    if (this.writableEnded) {
      return;
    }

    this.setHeader("content-type", "application/json");
    this.end(JSON.stringify(data));
  };

  reply.send = function (data: unknown) {
    if (this.writableEnded) {
      return;
    }

    if (typeof data === "object") {
      return this.json(data);
    }

    this.end(String(data));
  };

  return reply;
}
