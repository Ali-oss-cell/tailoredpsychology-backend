import { Controller, Get, Header, UseGuards } from "@nestjs/common";
import { ApiBearerAuth, ApiOkResponse, ApiOperation, ApiTags } from "@nestjs/swagger";

import { CurrentUser } from "../auth/decorators/current-user.decorator";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import type { AuthJwtPayload } from "../auth/interfaces/auth-jwt-payload.interface";
import { PsychologistDashboardDto } from "./dto/psychologist-dashboard.dto";
import { PsychologistPortalService } from "./psychologist-portal.service";

@ApiTags("psychologist-portal")
@Controller()
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class PsychologistPortalController {
  constructor(private readonly psychologistPortalService: PsychologistPortalService) {}

  @Get("psychologists/me/dashboard")
  @Header("Cache-Control", "private, no-store")
  @ApiOperation({ summary: "Consolidated psychologist dashboard snapshot in one call" })
  @ApiOkResponse({ type: PsychologistDashboardDto })
  getDashboard(@CurrentUser() user: AuthJwtPayload): Promise<PsychologistDashboardDto> {
    return this.psychologistPortalService.getDashboard(user);
  }
}
