import type { IncomingMessage, ServerResponse } from "node:http";
import { createApp } from "../server/dist/app.js";

const app = createApp();

export default function handler(req: IncomingMessage, res: ServerResponse) {
  return app(req, res);
}
