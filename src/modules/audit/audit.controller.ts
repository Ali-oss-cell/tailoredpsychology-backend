import { Controller, ForbiddenException, Get, Query, UseGuards } from "@nestjs/common";
import { ApiBearerAuth, ApiOkResponse, ApiOperation, ApiTags } from "@nestjs/swagger";

import { CurrentUser } from "../auth/decorators/current-user.decorator";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import type { AuthJwtPayload } from "../auth/interfaces/auth-jwt-payload.interface";
import { AuditEventDto } from "./dto/audit-event.dto";
import { GetAuditEventsQueryDto } from "./dto/get-audit-events-query.dto";
import { AuditService } from "./audit.service";

@ApiTags("audit")
@Controller("audit")
export class AuditController {
  constructor(private readonly auditService: AuditService) {}

  @Get("events")
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: "List audit events with optional filters" })
  @ApiOkResponse({ type: [AuditEventDto] })
  async listEvents(@CurrentUser() user: AuthJwtPayload, @Query() query: GetAuditEventsQueryDto): Promise<AuditEventDto[]> {
    if (user.role !== "admin" && user.role !== "practice_manager") {
      throw new ForbiddenException("Only admin and practice_manager can read audit events");
    }
    return this.auditService.listEvents(query);
  }
}
