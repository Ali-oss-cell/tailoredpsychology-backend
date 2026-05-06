import { ConnectedSocket, OnGatewayConnection, OnGatewayDisconnect, SubscribeMessage, WebSocketGateway } from "@nestjs/websockets";
import { Injectable, UnauthorizedException } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { JwtService } from "@nestjs/jwt";
import type { Socket } from "socket.io";

import type { AuthJwtPayload } from "../auth/interfaces/auth-jwt-payload.interface";
import { NotificationsService } from "./notifications.service";

type SubscribeAck = { ok: true } | { ok: false; error: string };

@Injectable()
@WebSocketGateway({
  namespace: "/notifications",
  cors: { origin: "*" },
})
export class NotificationsGateway implements OnGatewayConnection, OnGatewayDisconnect {
  private readonly socketUsers = new Map<string, string>();

  constructor(
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    private readonly notificationsService: NotificationsService,
  ) {}

  handleConnection(client: Socket): void {
    try {
      const user = this.authenticate(client);
      client.data.user = user;
      this.socketUsers.set(client.id, user.sub);
    } catch {
      client.emit("notifications:error", { message: "Authentication failed" });
      client.disconnect(true);
    }
  }

  handleDisconnect(client: Socket): void {
    const userId = this.socketUsers.get(client.id);
    if (!userId) return;
    this.notificationsService.unsubscribe(userId, client.id);
    this.socketUsers.delete(client.id);
  }

  @SubscribeMessage("notifications:subscribe")
  handleSubscribe(@ConnectedSocket() client: Socket): SubscribeAck {
    try {
      const user = this.requireUser(client);
      this.notificationsService.subscribe(user.sub, client.id, (notification) => {
        client.emit("notifications:new", notification);
      });
      return { ok: true };
    } catch (error) {
      const message = error instanceof Error ? error.message : "Subscribe failed";
      return { ok: false, error: message };
    }
  }

  private requireUser(client: Socket): AuthJwtPayload {
    const user = client.data.user as AuthJwtPayload | undefined;
    if (!user) throw new UnauthorizedException("Unauthenticated socket");
    return user;
  }

  private authenticate(client: Socket): AuthJwtPayload {
    const fromAuth = typeof client.handshake.auth?.token === "string" ? client.handshake.auth.token : null;
    const raw = fromAuth;
    const token = raw?.startsWith("Bearer ") ? raw.slice(7) : raw;
    if (!token) throw new UnauthorizedException("Missing bearer token");
    const secret = this.configService.get<string>("AUTH_JWT_SECRET") ?? "clink-dev-secret";
    const payload = this.jwtService.verify<AuthJwtPayload & { tokenType?: string }>(token, { secret });
    if (payload.tokenType !== "notification_stream") {
      throw new UnauthorizedException("Invalid stream token");
    }
    return {
      sub: payload.sub,
      email: payload.email,
      role: payload.role,
      displayName: payload.displayName,
    };
  }
}
