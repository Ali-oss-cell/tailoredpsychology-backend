import { Body, Controller, ForbiddenException, Get, Post, UseGuards } from "@nestjs/common";
import { ApiBearerAuth, ApiCreatedResponse, ApiOkResponse, ApiOperation, ApiTags } from "@nestjs/swagger";

import { CurrentUser } from "../auth/decorators/current-user.decorator";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import type { AuthJwtPayload } from "../auth/interfaces/auth-jwt-payload.interface";
import { AnalyticsEventDto } from "./dto/analytics-event.dto";
import { CreateAnalyticsEventDto } from "./dto/create-analytics-event.dto";
import { AnalyticsService } from "./analytics.service";

@ApiTags("analytics")
@Controller("analytics")
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class AnalyticsController {
  constructor(private readonly analyticsService: AnalyticsService) {}

  @Post("events")
  @ApiOperation({ summary: "Record analytics event" })
  @ApiCreatedResponse({ type: AnalyticsEventDto })
  createEvent(@CurrentUser() user: AuthJwtPayload, @Body() dto: CreateAnalyticsEventDto): Promise<AnalyticsEventDto> {
    const payload: CreateAnalyticsEventDto = {
      ...dto,
      actorUserId: dto.actorUserId || user.sub,
      actorRole: dto.actorRole || user.role,
    };
    return this.analyticsService.recordEvent(payload);
  }

  @Get("events")
  @ApiOperation({ summary: "List analytics events (ops/admin access)" })
  @ApiOkResponse({ type: [AnalyticsEventDto] })
  listEvents(@CurrentUser() user: AuthJwtPayload): Promise<AnalyticsEventDto[]> {
    if (user.role !== "admin" && user.role !== "practice_manager") {
      throw new ForbiddenException("Only admin and practice_manager can read analytics events");
    }
    return this.analyticsService.listEvents();
  }
}
