import { IoAdapter } from "@nestjs/platform-socket.io";
import type { INestApplicationContext } from "@nestjs/common";
import type { ServerOptions } from "socket.io";

import { getAllowedCorsOrigins } from "./cors.config";

export class SocketIoAdapter extends IoAdapter {
  constructor(private readonly app: INestApplicationContext) {
    super(app);
  }

  createIOServer(port: number, options?: ServerOptions) {
    return super.createIOServer(port, {
      ...options,
      cors: {
        origin: getAllowedCorsOrigins(),
        credentials: true,
      },
      transports: ["polling", "websocket"],
      pingInterval: 25_000,
      pingTimeout: 20_000,
    });
  }
}
