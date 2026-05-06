import { Body, Controller, Get, Param, Patch, Post, UseGuards } from "@nestjs/common";
import { ApiBearerAuth, ApiCreatedResponse, ApiOkResponse, ApiOperation, ApiTags } from "@nestjs/swagger";

import { CurrentUser } from "../auth/decorators/current-user.decorator";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import type { AuthJwtPayload } from "../auth/interfaces/auth-jwt-payload.interface";
import { CreateSecurityIncidentDto } from "./dto/create-security-incident.dto";
import { SecurityIncidentDto } from "./dto/security-incident.dto";
import { UpdateSecurityIncidentDto } from "./dto/update-security-incident.dto";
import { SecurityIncidentsService } from "./security-incidents.service";

@ApiTags("security-incidents")
@Controller("admin/security-incidents")
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class SecurityIncidentsController {
  constructor(private readonly incidentsService: SecurityIncidentsService) {}

  @Post()
  @ApiOperation({ summary: "Create security incident register entry (admin only)" })
  @ApiCreatedResponse({ type: SecurityIncidentDto })
  create(
    @CurrentUser() user: AuthJwtPayload,
    @Body() dto: CreateSecurityIncidentDto,
  ): Promise<SecurityIncidentDto> {
    return this.incidentsService.create(user, dto);
  }

  @Get()
  @ApiOperation({ summary: "List security incidents (admin only)" })
  @ApiOkResponse({ type: [SecurityIncidentDto] })
  list(@CurrentUser() user: AuthJwtPayload): Promise<SecurityIncidentDto[]> {
    return this.incidentsService.list(user);
  }

  @Patch(":id")
  @ApiOperation({ summary: "Update security incident state (admin only)" })
  @ApiOkResponse({ type: SecurityIncidentDto })
  update(
    @CurrentUser() user: AuthJwtPayload,
    @Param("id") incidentId: string,
    @Body() dto: UpdateSecurityIncidentDto,
  ): Promise<SecurityIncidentDto> {
    return this.incidentsService.update(user, incidentId, dto);
  }
}
