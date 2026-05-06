import { Body, Controller, Get, Param, Post, UseGuards } from "@nestjs/common";
import { ApiBearerAuth, ApiCreatedResponse, ApiOkResponse, ApiOperation, ApiTags } from "@nestjs/swagger";

import { CurrentUser } from "./decorators/current-user.decorator";
import { CreatePatientDataRequestDto } from "./dto/create-patient-data-request.dto";
import { PatientDataRequestActionDto } from "./dto/patient-data-request-action.dto";
import { PatientDataRequestDto } from "./dto/patient-data-request.dto";
import { JwtAuthGuard } from "./guards/jwt-auth.guard";
import type { AuthJwtPayload } from "./interfaces/auth-jwt-payload.interface";
import { PatientDataRequestsService } from "./patient-data-requests.service";

@ApiTags("patient-data-requests")
@Controller()
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class PatientDataRequestsController {
  constructor(private readonly requestsService: PatientDataRequestsService) {}

  @Post("patients/me/data-requests")
  @ApiOperation({ summary: "Create patient data access/correction request" })
  @ApiCreatedResponse({ type: PatientDataRequestDto })
  createOwnRequest(
    @CurrentUser() user: AuthJwtPayload,
    @Body() dto: CreatePatientDataRequestDto,
  ): Promise<PatientDataRequestDto> {
    return this.requestsService.createForPatient(user, dto);
  }

  @Get("patients/me/data-requests")
  @ApiOperation({ summary: "List own data access/correction requests" })
  @ApiOkResponse({ type: [PatientDataRequestDto] })
  listOwnRequests(@CurrentUser() user: AuthJwtPayload): Promise<PatientDataRequestDto[]> {
    return this.requestsService.listForPatient(user);
  }

  @Get("patients/me/data-requests/:id")
  @ApiOperation({ summary: "Get own data request details" })
  @ApiOkResponse({ type: PatientDataRequestDto })
  getOwnRequest(@CurrentUser() user: AuthJwtPayload, @Param("id") requestId: string): Promise<PatientDataRequestDto> {
    return this.requestsService.getForPatient(user, requestId);
  }

  @Get("admin/patient-data-requests")
  @ApiOperation({ summary: "List patient data requests queue for admin/practice_manager" })
  @ApiOkResponse({ type: [PatientDataRequestDto] })
  listOpsQueue(@CurrentUser() user: AuthJwtPayload): Promise<PatientDataRequestDto[]> {
    return this.requestsService.listForOps(user);
  }

  @Post("admin/patient-data-requests/:id/actions")
  @ApiOperation({ summary: "Apply triage action for patient data request" })
  @ApiCreatedResponse({ type: PatientDataRequestDto })
  applyOpsAction(
    @CurrentUser() user: AuthJwtPayload,
    @Param("id") requestId: string,
    @Body() dto: PatientDataRequestActionDto,
  ): Promise<PatientDataRequestDto> {
    return this.requestsService.applyAction(user, requestId, dto);
  }
}
