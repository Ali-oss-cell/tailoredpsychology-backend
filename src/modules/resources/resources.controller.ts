import { Body, Controller, Get, Param, Post, Query, UploadedFile, UseGuards, UseInterceptors } from "@nestjs/common";
import { ApiBearerAuth, ApiBody, ApiConsumes, ApiCreatedResponse, ApiOkResponse, ApiOperation, ApiTags } from "@nestjs/swagger";
import { FileInterceptor } from "@nestjs/platform-express";

import { CurrentUser } from "../auth/decorators/current-user.decorator";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import type { AuthJwtPayload } from "../auth/interfaces/auth-jwt-payload.interface";
import { ReferralDocumentDto } from "./dto/referral-document.dto";
import { GetReferralQueueQueryDto } from "./dto/get-referral-queue-query.dto";
import { ReferralQueueItemDto } from "./dto/referral-queue-item.dto";
import { ReferralReviewActionDto } from "./dto/referral-review-action.dto";
import { UploadReferralMetadataDto } from "./dto/upload-referral-metadata.dto";
import { ResourcesService } from "./resources.service";

@ApiTags("documents", "ops")
@Controller()
export class ResourcesController {
  constructor(private readonly resourcesService: ResourcesService) {}

  @Post("documents/referrals")
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @UseInterceptors(FileInterceptor("file"))
  @ApiConsumes("multipart/form-data")
  @ApiBody({
    schema: {
      type: "object",
      properties: {
        file: { type: "string", format: "binary" },
        sourceType: { type: "string" },
        referralDate: { type: "string" },
        notes: { type: "string" },
      },
      required: ["file"],
    },
  })
  @ApiOperation({ summary: "Upload referral PDF and create document metadata" })
  @ApiCreatedResponse({ type: ReferralDocumentDto })
  uploadReferral(
    @CurrentUser() user: AuthJwtPayload,
    @UploadedFile() file: Express.Multer.File | undefined,
    @Body() metadata: UploadReferralMetadataDto,
  ): Promise<ReferralDocumentDto> {
    return this.resourcesService.uploadReferral(user, file, metadata);
  }

  @Get("ops/referrals")
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: "List referral verification queue for admin/practice_manager" })
  @ApiOkResponse({ type: [ReferralQueueItemDto] })
  listReferralQueue(
    @CurrentUser() user: AuthJwtPayload,
    @Query() query: GetReferralQueueQueryDto,
  ): Promise<ReferralQueueItemDto[]> {
    return this.resourcesService.listReferralQueue(user, query);
  }

  @Post("ops/referrals/:id/approve")
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: "Approve referral for onboarding eligibility" })
  @ApiCreatedResponse({ type: ReferralQueueItemDto })
  approveReferral(
    @CurrentUser() user: AuthJwtPayload,
    @Param("id") id: string,
    @Body() dto: ReferralReviewActionDto,
  ): Promise<ReferralQueueItemDto> {
    return this.resourcesService.approveReferral(user, id, dto.reason, dto.notes);
  }

  @Post("ops/referrals/:id/reject")
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: "Reject referral with reason" })
  @ApiCreatedResponse({ type: ReferralQueueItemDto })
  rejectReferral(
    @CurrentUser() user: AuthJwtPayload,
    @Param("id") id: string,
    @Body() dto: ReferralReviewActionDto,
  ): Promise<ReferralQueueItemDto> {
    return this.resourcesService.rejectReferral(user, id, dto.reason, dto.notes);
  }

  @Post("ops/referrals/:id/request-info")
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: "Request additional referral information" })
  @ApiCreatedResponse({ type: ReferralQueueItemDto })
  requestReferralInfo(
    @CurrentUser() user: AuthJwtPayload,
    @Param("id") id: string,
    @Body() dto: ReferralReviewActionDto,
  ): Promise<ReferralQueueItemDto> {
    return this.resourcesService.requestReferralInfo(user, id, dto.reason, dto.notes);
  }
}
