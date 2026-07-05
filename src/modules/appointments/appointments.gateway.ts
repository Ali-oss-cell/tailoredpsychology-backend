import {
  ConnectedSocket,
  MessageBody,
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
import { AppointmentStateService } from "./appointment-state.service";
import { AppointmentsService } from "./appointments.service";
import { CreateChatMessageDto } from "./dto/create-chat-message.dto";

type JoinRoomPayload = { appointmentId: string };
type SendMessagePayload = { appointmentId: string; message: string };
type ErrorAck = { ok: false; error: string };

@Injectable()
@WebSocketGateway({
  namespace: "/chat",
  cors: {
    origin: getAllowedCorsOrigins(),
    credentials: true,
  },
})
export class AppointmentsGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server!: Server;

  private readonly logger = new Logger(AppointmentsGateway.name);
  private readonly socketRooms = new Map<string, string>();

  constructor(
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    private readonly appointmentsService: AppointmentsService,
    private readonly appointmentStateService: AppointmentStateService,
  ) {
    // Real-time state propagation: anyone in the appointment room (join screen,
    // pre-session chat) sees status flips without polling.
    this.appointmentStateService.onTransition((event) => {
      this.server?.to(event.appointmentId).emit("appointment:state", event);
    });
  }

  handleConnection(client: Socket): void {
    try {
      const user = this.authenticate(client);
      client.data.user = user;
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unauthorized";
      this.logger.warn(`Socket rejected: ${message}`);
      client.emit("chat:error", { code: "UNAUTHORIZED", message: "Authentication failed" });
      client.disconnect(true);
    }
  }

  handleDisconnect(client: Socket): void {
    const user = client.data.user as AuthJwtPayload | undefined;
    const appointmentId = this.socketRooms.get(client.id);
    if (!user || !appointmentId) {
      return;
    }

    void client.leave(appointmentId);
    void this.appointmentsService.leaveChatPresence(user, appointmentId).then((presence) => {
      this.server.to(appointmentId).emit("chat:presence", presence);
    });
    this.socketRooms.delete(client.id);
  }

  @SubscribeMessage("chat:join")
  async handleJoin(@ConnectedSocket() client: Socket, @MessageBody() payload: JoinRoomPayload) {
    try {
      const user = this.requireUser(client);
      const appointmentId = payload?.appointmentId;
      if (!appointmentId) {
        throw new UnauthorizedException("appointmentId is required");
      }

      const previousRoom = this.socketRooms.get(client.id);
      if (previousRoom && previousRoom !== appointmentId) {
        void client.leave(previousRoom);
        const leftPresence = await this.appointmentsService.leaveChatPresence(user, previousRoom);
        this.server.to(previousRoom).emit("chat:presence", leftPresence);
      }

      const window = await this.appointmentsService.getChatWindowState(user, appointmentId);
      const messages = await this.appointmentsService.getChatHistory(user, appointmentId);
      void client.join(appointmentId);
      this.socketRooms.set(client.id, appointmentId);

      const presence = await this.appointmentsService.joinChatPresence(user, appointmentId);
      this.server.to(appointmentId).emit("chat:presence", presence);
      this.server.to(appointmentId).emit("chat:window", window);

      return { ok: true, appointmentId, window, messages, presence };
    } catch (error) {
      const message = error instanceof Error ? error.message : "Join failed";
      return { ok: false, error: message } satisfies ErrorAck;
    }
  }

  @SubscribeMessage("chat:send")
  async handleSend(@ConnectedSocket() client: Socket, @MessageBody() payload: SendMessagePayload) {
    try {
      const user = this.requireUser(client);
      const appointmentId = payload?.appointmentId;
      if (!appointmentId || !payload?.message) {
        throw new UnauthorizedException("appointmentId and message are required");
      }

      const message = await this.appointmentsService.addChatMessage(user, appointmentId, payload as CreateChatMessageDto);
      const window = await this.appointmentsService.getChatWindowState(user, appointmentId);
      this.server.to(appointmentId).emit("chat:message", message);
      this.server.to(appointmentId).emit("chat:window", window);
      return { ok: true, message, window };
    } catch (error) {
      const message = error instanceof Error ? error.message : "Send failed";
      return { ok: false, error: message } satisfies ErrorAck;
    }
  }

  private requireUser(client: Socket): AuthJwtPayload {
    const user = client.data.user as AuthJwtPayload | undefined;
    if (!user) {
      throw new UnauthorizedException("Unauthenticated socket");
    }
    return user;
  }

  private authenticate(client: Socket): AuthJwtPayload {
    const fromAuth = typeof client.handshake.auth?.token === "string" ? client.handshake.auth.token : null;
    const fromHeader = typeof client.handshake.headers.authorization === "string"
      ? client.handshake.headers.authorization
      : null;
    const raw = fromAuth ?? fromHeader;
    const token = raw?.startsWith("Bearer ") ? raw.slice(7) : raw;
    if (!token) {
      throw new UnauthorizedException("Missing bearer token");
    }

    const secret = this.configService.get<string>("AUTH_JWT_SECRET") ?? "clink-dev-secret";
    return this.jwtService.verify<AuthJwtPayload>(token, { secret });
  }
}
