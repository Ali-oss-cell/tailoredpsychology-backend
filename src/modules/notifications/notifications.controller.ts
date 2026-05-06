import { Body, Controller, Get, NotFoundException, Param, Patch, Post, UseGuards } from "@nestjs/common";
import { ApiBearerAuth, ApiOkResponse, ApiOperation, ApiTags } from "@nestjs/swagger";
import { ConfigService } from "@nestjs/config";
import { JwtService } from "@nestjs/jwt";

import { CurrentUser } from "../auth/decorators/current-user.decorator";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import type { AuthJwtPayload } from "../auth/interfaces/auth-jwt-payload.interface";
import { NotificationDto } from "./dto/notification.dto";
import { NotificationPreferenceDto } from "./dto/notification-preference.dto";
import { NotificationsService } from "./notifications.service";

@ApiTags("notifications")
@Controller("notifications")
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class NotificationsController {
  constructor(
    private readonly notificationsService: NotificationsService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  @Get()
  @ApiOperation({ summary: "List in-app notifications for current user" })
  @ApiOkResponse({ type: [NotificationDto] })
  async list(@CurrentUser() user: AuthJwtPayload): Promise<NotificationDto[]> {
    return this.notificationsService.listForUser(user.sub);
  }

  @Post("mark-all-read")
  @ApiOperation({ summary: "Mark all in-app notifications as read for current user" })
  @ApiOkResponse({
    schema: { properties: { updated: { type: "number" } } },
  })
  async markAllRead(@CurrentUser() user: AuthJwtPayload): Promise<{ updated: number }> {
    return this.notificationsService.markAllRead(user.sub);
  }

  @Patch(":id/read")
  @ApiOperation({ summary: "Mark a notification as read" })
  @ApiOkResponse({ type: NotificationDto })
  async markRead(@CurrentUser() user: AuthJwtPayload, @Param("id") id: string): Promise<NotificationDto> {
    const updated = await this.notificationsService.markRead(user.sub, id);
    if (!updated) throw new NotFoundException("Notification not found");
    return updated;
  }

  @Patch(":id/unread")
  @ApiOperation({ summary: "Mark a notification as unread" })
  @ApiOkResponse({ type: NotificationDto })
  async markUnread(@CurrentUser() user: AuthJwtPayload, @Param("id") id: string): Promise<NotificationDto> {
    const updated = await this.notificationsService.markUnread(user.sub, id);
    if (!updated) throw new NotFoundException("Notification not found");
    return updated;
  }

  @Get("preferences")
  @ApiOperation({ summary: "Get notification preferences for current user" })
  @ApiOkResponse({ type: NotificationPreferenceDto })
  async getPreferences(@CurrentUser() user: AuthJwtPayload): Promise<NotificationPreferenceDto> {
    return this.notificationsService.getPreferences(user.sub);
  }

  @Post("preferences")
  @ApiOperation({ summary: "Update notification preferences for current user" })
  @ApiOkResponse({ type: NotificationPreferenceDto })
  updatePreferences(
    @CurrentUser() user: AuthJwtPayload,
    @Body() dto: NotificationPreferenceDto,
  ): Promise<NotificationPreferenceDto> {
    return this.notificationsService.updatePreferences(user.sub, dto);
  }

  @Get("stream-token")
  @ApiOperation({ summary: "Generate short-lived notification stream token for socket subscribe" })
  @ApiOkResponse({
    schema: {
      properties: {
        socketToken: { type: "string" },
        expiresInSeconds: { type: "number" },
      },
    },
  })
  async streamToken(@CurrentUser() user: AuthJwtPayload): Promise<{ socketToken: string; expiresInSeconds: number }> {
    const expiresInSeconds = 300;
    const secret = this.configService.get<string>("AUTH_JWT_SECRET") ?? "clink-dev-secret";
    const socketToken = await this.jwtService.signAsync(
      {
        sub: user.sub,
        email: user.email,
        role: user.role,
        displayName: user.displayName,
        tokenType: "notification_stream",
      },
      { expiresIn: `${expiresInSeconds}s`, secret },
    );
    return { socketToken, expiresInSeconds };
  }

  @Get(":id")
  @ApiOperation({ summary: "Get a single in-app notification for the current user" })
  @ApiOkResponse({ type: NotificationDto })
  async getOne(@CurrentUser() user: AuthJwtPayload, @Param("id") id: string): Promise<NotificationDto> {
    const found = await this.notificationsService.findForUser(user.sub, id);
    if (!found) throw new NotFoundException("Notification not found");
    return found;
  }
}
