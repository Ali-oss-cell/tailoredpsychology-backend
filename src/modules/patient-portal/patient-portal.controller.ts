import { Controller, Get, Header, UseGuards } from "@nestjs/common";
import { ApiBearerAuth, ApiOkResponse, ApiOperation, ApiTags } from "@nestjs/swagger";

import { CurrentUser } from "../auth/decorators/current-user.decorator";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import type { AuthJwtPayload } from "../auth/interfaces/auth-jwt-payload.interface";
import { PatientDashboardDto } from "./dto/patient-dashboard.dto";
import { PatientPortalService } from "./patient-portal.service";

@ApiTags("patient-portal")
@Controller()
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class PatientPortalController {
  constructor(private readonly patientPortalService: PatientPortalService) {}

  @Get("patients/me/dashboard")
  @Header("Cache-Control", "private, no-store")
  @ApiOperation({ summary: "Consolidated patient dashboard snapshot (session, journey, billing) in one call" })
  @ApiOkResponse({ type: PatientDashboardDto })
  getDashboard(@CurrentUser() user: AuthJwtPayload): Promise<PatientDashboardDto> {
    return this.patientPortalService.getDashboard(user);
  }
}
