import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from "@nestjs/common";
import { FileInterceptor } from "@nestjs/platform-express";
import { ApiBearerAuth, ApiBody, ApiConsumes, ApiCreatedResponse, ApiOkResponse, ApiOperation, ApiTags } from "@nestjs/swagger";
import { memoryStorage } from "multer";

import { CurrentUser } from "../auth/decorators/current-user.decorator";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import type { AuthJwtPayload } from "../auth/interfaces/auth-jwt-payload.interface";
import { CreatePsychologistNoteDto } from "./dto/create-psychologist-note.dto";
import { PsychologistNoteDto } from "./dto/psychologist-note.dto";
import { PsychologistPatientContextDto } from "./dto/psychologist-patient-context.dto";
import { PsychologistProfileDto } from "./dto/psychologist-profile.dto";
import { PsychologistReferralDto } from "./dto/psychologist-referral.dto";
import { SessionVideoAccessDto } from "./dto/session-video-access.dto";
import { SessionVideoItemDto } from "./dto/session-video-item.dto";
import { UpdatePsychologistNoteDto } from "./dto/update-psychologist-note.dto";
import { UpdatePsychologistProfileDto } from "./dto/update-psychologist-profile.dto";
import { PsychologistNotesService } from "./psychologist-notes.service";

@ApiTags("psychologist-notes")
@Controller()
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class PsychologistNotesController {
  constructor(private readonly notesService: PsychologistNotesService) {}

  @Get("psychologists/:id/notes")
  @ApiOperation({ summary: "List psychologist notes queue" })
  @ApiOkResponse({ type: [PsychologistNoteDto] })
  listNotes(@CurrentUser() user: AuthJwtPayload, @Param("id") id: string): Promise<PsychologistNoteDto[]> {
    return this.notesService.listNotes(user, id);
  }

  @Get("psychologists/:id/notes/:noteId")
  @ApiOperation({ summary: "Get psychologist note detail" })
  @ApiOkResponse({ type: PsychologistNoteDto })
  getNote(
    @CurrentUser() user: AuthJwtPayload,
    @Param("id") id: string,
    @Param("noteId") noteId: string,
  ): Promise<PsychologistNoteDto> {
    return this.notesService.getNote(user, id, noteId);
  }

  @Post("psychologists/:id/notes")
  @ApiOperation({ summary: "Create psychologist note" })
  @ApiCreatedResponse({ type: PsychologistNoteDto })
  createNote(
    @CurrentUser() user: AuthJwtPayload,
    @Param("id") id: string,
    @Body() dto: CreatePsychologistNoteDto,
  ): Promise<PsychologistNoteDto> {
    return this.notesService.createNote(user, id, dto);
  }

  @Patch("psychologists/:id/notes/:noteId")
  @ApiOperation({ summary: "Update psychologist note (draft/ready_for_signoff only)" })
  @ApiOkResponse({ type: PsychologistNoteDto })
  updateNote(
    @CurrentUser() user: AuthJwtPayload,
    @Param("id") id: string,
    @Param("noteId") noteId: string,
    @Body() dto: UpdatePsychologistNoteDto,
  ): Promise<PsychologistNoteDto> {
    return this.notesService.updateNote(user, id, noteId, dto);
  }

  @Post("psychologists/:id/notes/:noteId/sign")
  @ApiOperation({ summary: "Sign psychologist note and lock edits" })
  @ApiCreatedResponse({ type: PsychologistNoteDto })
  signNote(
    @CurrentUser() user: AuthJwtPayload,
    @Param("id") id: string,
    @Param("noteId") noteId: string,
  ): Promise<PsychologistNoteDto> {
    return this.notesService.signNote(user, id, noteId);
  }

  @Get("psychologists/:id/patients/:patientId/context")
  @ApiOperation({ summary: "Get psychologist patient context packet" })
  @ApiOkResponse({ type: PsychologistPatientContextDto })
  getPatientContext(
    @CurrentUser() user: AuthJwtPayload,
    @Param("id") id: string,
    @Param("patientId") patientId: string,
  ): Promise<PsychologistPatientContextDto> {
    return this.notesService.getPatientContext(user, id, patientId);
  }

  @Get("psychologists/:id/referrals")
  @ApiOperation({ summary: "List referrals relevant to assigned psychologist patients" })
  @ApiOkResponse({ type: [PsychologistReferralDto] })
  listPsychologistReferrals(
    @CurrentUser() user: AuthJwtPayload,
    @Param("id") id: string,
  ): Promise<PsychologistReferralDto[]> {
    return this.notesService.listPsychologistReferrals(user, id);
  }

  @Get("psychologists/me/profile")
  @ApiOperation({ summary: "Get psychologist own profile details" })
  @ApiOkResponse({ type: PsychologistProfileDto })
  getMyProfile(@CurrentUser() user: AuthJwtPayload): Promise<PsychologistProfileDto> {
    return this.notesService.getMyProfile(user);
  }

  @Patch("psychologists/me/profile")
  @ApiOperation({ summary: "Update psychologist own profile details" })
  @ApiOkResponse({ type: PsychologistProfileDto })
  updateMyProfile(
    @CurrentUser() user: AuthJwtPayload,
    @Body() dto: UpdatePsychologistProfileDto,
  ): Promise<PsychologistProfileDto> {
    return this.notesService.updateMyProfile(user, dto);
  }

  @Post("psychologists/me/profile/avatar")
  @UseInterceptors(
    FileInterceptor("file", {
      storage: memoryStorage(),
      limits: { fileSize: 2 * 1024 * 1024 },
      fileFilter: (_req, file, cb) => {
        const ok = ["image/jpeg", "image/png", "image/webp"].includes(file.mimetype);
        cb(
          ok ? null : (new BadRequestException("Only JPEG, PNG, or WebP images are allowed (max 2MB).") as Error),
          ok,
        );
      },
    }),
  )
  @ApiConsumes("multipart/form-data")
  @ApiBody({
    schema: {
      type: "object",
      properties: { file: { type: "string", format: "binary" } },
      required: ["file"],
    },
  })
  @ApiOperation({ summary: "Upload profile photo (JPEG/PNG/WebP, max 2MB); replaces patient-facing image" })
  @ApiOkResponse({ type: PsychologistProfileDto })
  uploadMyProfileAvatar(
    @CurrentUser() user: AuthJwtPayload,
    @UploadedFile() file: Express.Multer.File | undefined,
  ): Promise<PsychologistProfileDto> {
    return this.notesService.uploadMyProfileAvatar(user, file);
  }

  @Get("psychologists/:id/session-videos")
  @ApiOperation({ summary: "List session videos for psychologist" })
  @ApiOkResponse({ type: [SessionVideoItemDto] })
  listPsychologistSessionVideos(
    @CurrentUser() user: AuthJwtPayload,
    @Param("id") id: string,
  ): Promise<SessionVideoItemDto[]> {
    return this.notesService.listSessionVideosForPsychologist(user, id);
  }

  @Get("patients/:id/session-videos")
  @ApiOperation({ summary: "List session videos for patient" })
  @ApiOkResponse({ type: [SessionVideoItemDto] })
  listPatientSessionVideos(
    @CurrentUser() user: AuthJwtPayload,
    @Param("id") id: string,
  ): Promise<SessionVideoItemDto[]> {
    return this.notesService.listSessionVideosForPatient(user, id);
  }

  @Get("session-videos/:videoId/access")
  @ApiOperation({ summary: "Request short-lived access token for session video download" })
  @ApiOkResponse({ type: SessionVideoAccessDto })
  requestVideoAccess(
    @CurrentUser() user: AuthJwtPayload,
    @Param("videoId") videoId: string,
  ): Promise<SessionVideoAccessDto> {
    return this.notesService.requestSessionVideoAccess(user, videoId);
  }
}
