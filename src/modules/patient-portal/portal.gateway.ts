import {
  ConnectedSocket,
  OnGatewayConnection,
  OnGatewayDisconnect,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from "@nestjs/websockets";
import { Injectable, Logger, UnauthorizedException } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { JwtService } from "@nestjs/jwt";
import type { Server, Socket } from "socket.io";

import type { AuthJwtPayload } from "../auth/interfaces/auth-jwt-payload.interface";
import { getAllowedCorsOrigins } from "../../cors.config";
import { AppointmentStateService } from "../appointments/appointment-state.service";

type SubscribeAck = { ok: true } | { ok: false; error: string };

/**
 * User-scoped portal namespace: pushes appointment state + dashboard
 * invalidation hints so the patient dashboard refreshes without polling.
 */
@Injectable()
@WebSocketGateway({
  namespace: "/portal",
  cors: {
    origin: getAllowedCorsOrigins(),
    credentials: true,
  },
})
export class PortalGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server!: Server;

  private readonly logger = new Logger(PortalGateway.name);
  private readonly socketUsers = new Map<string, string>();

  constructor(
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    private readonly appointmentStateService: AppointmentStateService,
  ) {
    this.appointmentStateService.onTransition((event) => {
      const payload = {
        appointmentId: event.appointmentId,
        status: event.toStatus,
        occurredAt: event.occurredAt,
      };
      this.server?.to(userRoom(event.patientId)).emit("appointment.updated", payload);
      this.server?.to(userRoom(event.clinicianId)).emit("appointment.updated", payload);
      this.server?.to(userRoom(event.patientId)).emit("dashboard.invalidate", { scope: "all" });
      this.server?.to(userRoom(event.clinicianId)).emit("dashboard.invalidate", { scope: "all" });
    });
  }

  handleConnection(client: Socket): void {
    try {
      const user = this.authenticate(client);
      client.data.user = user;
      void client.join(userRoom(user.sub));
      this.socketUsers.set(client.id, user.sub);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unauthorized";
      this.logger.warn(`Portal socket rejected: ${message}`);
      client.emit("portal:error", { message: "Authentication failed" });
      client.disconnect(true);
    }
  }

  handleDisconnect(client: Socket): void {
    this.socketUsers.delete(client.id);
  }

  @SubscribeMessage("portal:subscribe")
  handleSubscribe(@ConnectedSocket() client: Socket): SubscribeAck {
    try {
      const user = this.requireUser(client);
      void client.join(userRoom(user.sub));
      return { ok: true };
    } catch (error) {
      const message = error instanceof Error ? error.message : "Subscribe failed";
      return { ok: false, error: message };
    }
  }

  /** Billing webhook handlers call this after invoice state changes. */
  emitDashboardInvalidate(userId: string, scope: "billing" | "journey" | "all" = "billing"): void {
    this.server?.to(userRoom(userId)).emit("dashboard.invalidate", { scope });
  }

  private requireUser(client: Socket): AuthJwtPayload {
    const user = client.data.user as AuthJwtPayload | undefined;
    if (!user) throw new UnauthorizedException("Unauthenticated socket");
    return user;
  }

  private authenticate(client: Socket): AuthJwtPayload {
    const fromAuth = typeof client.handshake.auth?.token === "string" ? client.handshake.auth.token : null;
    const fromHeader = typeof client.handshake.headers.authorization === "string"
      ? client.handshake.headers.authorization
      : null;
    const raw = fromAuth ?? fromHeader;
    const token = raw?.startsWith("Bearer ") ? raw.slice(7) : raw;
    if (!token) throw new UnauthorizedException("Missing bearer token");

    const secret = this.configService.get<string>("AUTH_JWT_SECRET") ?? "clink-dev-secret";
    return this.jwtService.verify<AuthJwtPayload>(token, { secret });
  }
}

function userRoom(userId: string): string {
  return `user:${userId}`;
}
