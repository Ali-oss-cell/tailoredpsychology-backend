import { Controller, Get, Header, Param, Post, Res, UseGuards } from "@nestjs/common";
import { ApiBearerAuth, ApiCreatedResponse, ApiOkResponse, ApiOperation, ApiProduces, ApiTags } from "@nestjs/swagger";
import type { Response } from "express";

import { CurrentUser } from "../auth/decorators/current-user.decorator";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import type { AuthJwtPayload } from "../auth/interfaces/auth-jwt-payload.interface";
import { CreateDataExportResponseDto } from "./dto/create-data-export-response.dto";
import { DataExportStatusDto } from "./dto/data-export-status.dto";
import { ExportsService } from "./exports.service";

@ApiTags("exports")
@Controller()
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class ExportsController {
  constructor(private readonly exportsService: ExportsService) {}

  @Post("patients/me/data-export")
  @ApiOperation({ summary: "Request asynchronous patient data export job (PDF package)" })
  @ApiCreatedResponse({ type: CreateDataExportResponseDto })
  createExport(@CurrentUser() user: AuthJwtPayload): Promise<CreateDataExportResponseDto> {
    return this.exportsService.createPatientDataExport(user);
  }

  @Get("patients/me/data-export/:jobId")
  @ApiOperation({ summary: "Get patient data export job status" })
  @ApiOkResponse({ type: DataExportStatusDto })
  getExportStatus(@CurrentUser() user: AuthJwtPayload, @Param("jobId") jobId: string): Promise<DataExportStatusDto> {
    return this.exportsService.getPatientDataExportStatus(user, jobId);
  }

  @Get("patients/me/data-export/:jobId/download")
  @ApiOperation({ summary: "Download generated patient data export file" })
  @ApiProduces("application/pdf")
  @Header("Cache-Control", "no-store")
  async downloadExport(@CurrentUser() user: AuthJwtPayload, @Param("jobId") jobId: string, @Res() res: Response): Promise<void> {
    const { buffer, fileName, contentType } = await this.exportsService.getPatientDataExportDownload(user, jobId);
    res.setHeader("Content-Type", contentType);
    res.setHeader("Content-Disposition", `attachment; filename="${fileName}"`);
    res.send(buffer);
  }

  @Post("psychologists/:id/patients/:patientId/data-export")
  @ApiOperation({ summary: "Request asynchronous patient data export job by assigned psychologist" })
  @ApiCreatedResponse({ type: CreateDataExportResponseDto })
  createPsychologistExport(
    @CurrentUser() user: AuthJwtPayload,
    @Param("id") psychologistId: string,
    @Param("patientId") patientId: string,
  ): Promise<CreateDataExportResponseDto> {
    return this.exportsService.createPsychologistPatientDataExport(user, psychologistId, patientId);
  }

  @Get("psychologists/:id/patients/:patientId/data-export/:jobId")
  @ApiOperation({ summary: "Get psychologist-requested patient export status" })
  @ApiOkResponse({ type: DataExportStatusDto })
  getPsychologistExportStatus(
    @CurrentUser() user: AuthJwtPayload,
    @Param("id") psychologistId: string,
    @Param("patientId") patientId: string,
    @Param("jobId") jobId: string,
  ): Promise<DataExportStatusDto> {
    return this.exportsService.getPsychologistPatientDataExportStatus(user, psychologistId, patientId, jobId);
  }

  @Get("psychologists/:id/patients/:patientId/data-export/:jobId/download")
  @ApiOperation({ summary: "Download psychologist-requested patient export PDF" })
  @ApiProduces("application/pdf")
  @Header("Cache-Control", "no-store")
  async downloadPsychologistExport(
    @CurrentUser() user: AuthJwtPayload,
    @Param("id") psychologistId: string,
    @Param("patientId") patientId: string,
    @Param("jobId") jobId: string,
    @Res() res: Response,
  ): Promise<void> {
    const { buffer, fileName, contentType } = await this.exportsService.getPsychologistPatientDataExportDownload(
      user,
      psychologistId,
      patientId,
      jobId,
    );
    res.setHeader("Content-Type", contentType);
    res.setHeader("Content-Disposition", `attachment; filename="${fileName}"`);
    res.send(buffer);
  }
}
