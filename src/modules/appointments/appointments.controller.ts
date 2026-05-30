import { Body, Controller, Get, Param, Post, Query, UseGuards } from "@nestjs/common";
import { ApiBearerAuth, ApiCreatedResponse, ApiOkResponse, ApiOperation, ApiTags } from "@nestjs/swagger";

import { CurrentUser } from "../auth/decorators/current-user.decorator";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import type { AuthJwtPayload } from "../auth/interfaces/auth-jwt-payload.interface";
import { BookingRequestCreatedResponseDto } from "./dto/booking-request-created-response.dto";
import { BookingRequestStatusDto } from "./dto/booking-request-status.dto";
import { AppointmentsService } from "./appointments.service";
import { AssignIntakeQueueItemDto } from "./dto/assign-intake-queue-item.dto";
import { AppointmentDetailsDto } from "./dto/appointment-details.dto";
import { ChatMessageDto } from "./dto/chat-message.dto";
import { ChatWindowDto } from "./dto/chat-window.dto";
import { ClinicianAvailabilityResponseDto } from "./dto/clinician-availability-response.dto";
import { CreateChatMessageDto } from "./dto/create-chat-message.dto";
import { CreateBookingRequestDto } from "./dto/create-booking-request.dto";
import { CreateMoodCheckinDto } from "./dto/create-mood-checkin.dto";
import { CreateJoinAttemptDto } from "./dto/create-join-attempt.dto";
import { CreateJoinSessionDto } from "./dto/create-join-session.dto";
import { IntakeAssignableClinicianDto } from "./dto/intake-assignable-clinician.dto";
import { GetClinicianAvailabilityQueryDto } from "./dto/get-clinician-availability-query.dto";
import { GetIntakeQueueQueryDto } from "./dto/get-intake-queue-query.dto";
import { IntakeDraftDto } from "./dto/intake-draft.dto";
import { IntakeDraftSavedResponseDto } from "./dto/intake-draft-saved-response.dto";
import { IntakeQueueItemDto } from "./dto/intake-queue-item.dto";
import { JoinAttemptDecisionDto } from "./dto/join-attempt-decision.dto";
import { JoinSessionTokenDto } from "./dto/join-session-token.dto";
import { ManageAppointmentDto } from "./dto/manage-appointment.dto";
import { SaveIntakeDraftDto } from "./dto/save-intake-draft.dto";
import { SaveTelehealthReadinessDto } from "./dto/save-telehealth-readiness.dto";
import { TelehealthSessionWindowDto } from "./dto/telehealth-session-window.dto";
import { TelehealthReadinessDto } from "./dto/telehealth-readiness.dto";
import { MoodCheckinItemDto, MoodCheckinsListResponseDto } from "./dto/mood-checkin-item.dto";
import { PatientAppointmentsListResponseDto } from "./dto/patient-appointment-summary.dto";
import { PatientJourneyTimelineDto } from "./dto/patient-journey-timeline.dto";
import { PsychologistPreSessionWorkspaceDto } from "./dto/psychologist-pre-session-workspace.dto";
import { OpsInsightsDto } from "./dto/ops-insights.dto";
import { GetPsychologistWorkspaceQueryDto } from "./dto/get-psychologist-workspace-query.dto";
import { ReadinessReminderDispatchDto } from "./dto/readiness-reminder-dispatch.dto";
import { TelehealthInsightsDto } from "./dto/telehealth-insights.dto";
import { PatientCareClinicianDto } from "./dto/patient-care-clinician.dto";
import { SessionSummaryDto } from "./dto/session-summary.dto";
import { SessionDetailDto } from "./dto/session-detail.dto";

@ApiTags("appointments")
@Controller()
export class AppointmentsController {
  constructor(private readonly appointmentsService: AppointmentsService) {}

  @Get("clinicians/availability")
  @ApiOperation({ summary: "Get clinician slots for a date window" })
  @ApiOkResponse({ type: [ClinicianAvailabilityResponseDto] })
  async getAvailability(@Query() query: GetClinicianAvailabilityQueryDto): Promise<ClinicianAvailabilityResponseDto[]> {
    return this.appointmentsService.getClinicianAvailability(query);
  }

  @Post("booking-requests")
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: "Create a booking request for selected slot" })
  @ApiCreatedResponse({ type: BookingRequestCreatedResponseDto })
  createBookingRequest(
    @CurrentUser() user: AuthJwtPayload,
    @Body() dto: CreateBookingRequestDto,
  ): Promise<BookingRequestCreatedResponseDto> {
    return this.appointmentsService.createBookingRequest(user, dto);
  }

  @Get("booking-requests/:id/status")
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: "Get current status for a booking request" })
  @ApiOkResponse({ type: BookingRequestStatusDto })
  getBookingRequestStatus(
    @CurrentUser() user: AuthJwtPayload,
    @Param("id") id: string,
  ): Promise<BookingRequestStatusDto> {
    return this.appointmentsService.getBookingRequestStatus(user, id);
  }

  @Get("appointments/:id/pre-session-window")
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: "Get T-30 pre-session chat window state for appointment" })
  @ApiOkResponse({ type: TelehealthSessionWindowDto })
  getPreSessionWindow(@CurrentUser() user: AuthJwtPayload, @Param("id") id: string): Promise<TelehealthSessionWindowDto> {
    return this.appointmentsService.getPreSessionWindow(user, id);
  }

  @Get("appointments/:id")
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: "Get appointment details for management and join surfaces" })
  @ApiOkResponse({ type: AppointmentDetailsDto })
  getAppointmentDetails(@CurrentUser() user: AuthJwtPayload, @Param("id") id: string): Promise<AppointmentDetailsDto> {
    return this.appointmentsService.getAppointmentDetails(user, id);
  }

  @Post("appointments/:id/manage")
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: "Manage appointment as owner patient (cancel or reschedule)" })
  @ApiCreatedResponse({ type: AppointmentDetailsDto })
  manageAppointment(
    @CurrentUser() user: AuthJwtPayload,
    @Param("id") id: string,
    @Body() dto: ManageAppointmentDto,
  ): Promise<AppointmentDetailsDto> {
    return this.appointmentsService.manageAppointment(user, id, dto);
  }

  @Get("appointments/:id/readiness")
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: "Get telehealth pre-session readiness checklist for appointment" })
  @ApiOkResponse({ type: TelehealthReadinessDto })
  getTelehealthReadiness(@CurrentUser() user: AuthJwtPayload, @Param("id") id: string): Promise<TelehealthReadinessDto> {
    return this.appointmentsService.getTelehealthReadiness(user, id);
  }

  @Post("appointments/:id/readiness")
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: "Save telehealth pre-session readiness results for appointment" })
  @ApiCreatedResponse({ type: TelehealthReadinessDto })
  saveTelehealthReadiness(
    @CurrentUser() user: AuthJwtPayload,
    @Param("id") id: string,
    @Body() dto: SaveTelehealthReadinessDto,
  ): Promise<TelehealthReadinessDto> {
    return this.appointmentsService.saveTelehealthReadiness(user, id, dto);
  }

  @Get("appointments/:id/chat-window")
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: "Get pre-session chat window status for appointment" })
  @ApiOkResponse({ type: ChatWindowDto })
  getChatWindow(@CurrentUser() user: AuthJwtPayload, @Param("id") id: string): Promise<ChatWindowDto> {
    return this.appointmentsService.getChatWindow(user, id);
  }

  @Get("appointments/:id/chat/messages")
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: "List appointment pre-session chat messages" })
  @ApiOkResponse({ type: ChatMessageDto, isArray: true })
  getChatMessages(@CurrentUser() user: AuthJwtPayload, @Param("id") id: string): Promise<ChatMessageDto[]> {
    return this.appointmentsService.getChatHistory(user, id);
  }

  @Post("appointments/:id/chat/messages")
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: "Post message to appointment pre-session chat" })
  @ApiCreatedResponse({ type: ChatMessageDto })
  postChatMessage(
    @CurrentUser() user: AuthJwtPayload,
    @Param("id") id: string,
    @Body() dto: CreateChatMessageDto,
  ): Promise<ChatMessageDto> {
    return this.appointmentsService.addChatMessage(user, id, dto);
  }

  @Post("appointments/:id/join-attempt")
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: "Evaluate and record pre-join gate decision for appointment" })
  @ApiCreatedResponse({ type: JoinAttemptDecisionDto })
  createJoinAttempt(
    @CurrentUser() user: AuthJwtPayload,
    @Param("id") id: string,
    @Body() dto: CreateJoinAttemptDto,
  ): Promise<JoinAttemptDecisionDto> {
    return this.appointmentsService.createJoinAttempt(user, id, dto);
  }

  @Post("appointments/:id/join-session")
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: "Create short-lived Twilio join token scoped to appointment" })
  @ApiCreatedResponse({ type: JoinSessionTokenDto })
  createJoinSession(
    @CurrentUser() user: AuthJwtPayload,
    @Param("id") id: string,
    @Body() dto: CreateJoinSessionDto,
  ): Promise<JoinSessionTokenDto> {
    return this.appointmentsService.createJoinSession(user, id, dto);
  }

  @Get("patients/:id/intake-latest")
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: "Get latest cross-device intake draft for patient" })
  @ApiOkResponse({ type: IntakeDraftDto })
  getLatestIntakeDraft(@CurrentUser() user: AuthJwtPayload, @Param("id") id: string): Promise<IntakeDraftDto> {
    return this.appointmentsService.getLatestIntakeDraft(user, id);
  }

  @Post("patients/:id/intake-delta")
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: "Save intake draft delta with version conflict protection" })
  @ApiCreatedResponse({ type: IntakeDraftSavedResponseDto })
  saveIntakeDelta(
    @CurrentUser() user: AuthJwtPayload,
    @Param("id") id: string,
    @Body() dto: SaveIntakeDraftDto,
  ): Promise<IntakeDraftSavedResponseDto> {
    return this.appointmentsService.saveIntakeDraftDelta(user, id, dto);
  }

  @Post("patients/:id/intake-draft/commit")
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: "Commit current intake draft version after final review/submission" })
  @ApiCreatedResponse({ type: IntakeDraftSavedResponseDto })
  commitIntakeDraft(
    @CurrentUser() user: AuthJwtPayload,
    @Param("id") id: string,
  ): Promise<IntakeDraftSavedResponseDto> {
    return this.appointmentsService.commitIntakeDraft(user, id);
  }

  @Get("ops/intake-queue")
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: "Get intake triage queue for operations roles" })
  @ApiOkResponse({ type: [IntakeQueueItemDto] })
  getIntakeQueue(
    @CurrentUser() user: AuthJwtPayload,
    @Query() query: GetIntakeQueueQueryDto,
  ): Promise<IntakeQueueItemDto[]> {
    return this.appointmentsService.getIntakeQueue(user, query);
  }

  @Get("ops/intake-queue/assignable-clinicians")
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: "List assignable active clinicians for intake queue triage" })
  @ApiOkResponse({ type: [IntakeAssignableClinicianDto] })
  getAssignableClinicians(@CurrentUser() user: AuthJwtPayload): Promise<IntakeAssignableClinicianDto[]> {
    return this.appointmentsService.getAssignableClinicians(user);
  }

  @Post("ops/intake-queue/:id/assign")
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: "Assign intake queue item to clinician" })
  @ApiCreatedResponse({ type: IntakeQueueItemDto })
  assignIntakeQueueItem(
    @CurrentUser() user: AuthJwtPayload,
    @Param("id") id: string,
    @Body() dto: AssignIntakeQueueItemDto,
  ): Promise<IntakeQueueItemDto> {
    return this.appointmentsService.assignIntakeQueueItem(user, id, dto.assignedClinicianId);
  }

  @Get("patients/me/care-team")
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: "List psychologists linked to the authenticated patient via appointments (care team)" })
  @ApiOkResponse({ type: [PatientCareClinicianDto] })
  getMyCareTeam(@CurrentUser() user: AuthJwtPayload): Promise<PatientCareClinicianDto[]> {
    return this.appointmentsService.getPatientCareTeam(user);
  }

  @Get("patients/:id/journey-timeline")
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: "Get patient journey timeline projection" })
  @ApiOkResponse({ type: PatientJourneyTimelineDto })
  getPatientJourneyTimeline(
    @CurrentUser() user: AuthJwtPayload,
    @Param("id") id: string,
  ): Promise<PatientJourneyTimelineDto> {
    return this.appointmentsService.getPatientJourneyTimeline(user, id);
  }

  @Get("patients/:id/appointments")
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: "List patient appointments (upcoming and past)" })
  @ApiOkResponse({ type: PatientAppointmentsListResponseDto })
  getPatientAppointments(@CurrentUser() user: AuthJwtPayload, @Param("id") id: string): Promise<PatientAppointmentsListResponseDto> {
    return this.appointmentsService.getPatientAppointmentsList(user, id);
  }

  @Get("patients/:id/sessions")
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: "List session history for owner patient (or ops roles)" })
  @ApiOkResponse({ type: [SessionSummaryDto] })
  getPatientSessions(@CurrentUser() user: AuthJwtPayload, @Param("id") id: string): Promise<SessionSummaryDto[]> {
    return this.appointmentsService.getPatientSessions(user, id);
  }

  @Get("patients/:id/mood-checkins")
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: "List recent mood check-ins for patient" })
  @ApiOkResponse({ type: MoodCheckinsListResponseDto })
  getMoodCheckins(
    @CurrentUser() user: AuthJwtPayload,
    @Param("id") id: string,
    @Query("limit") limit?: string,
  ): Promise<MoodCheckinsListResponseDto> {
    const parsed = limit ? Number.parseInt(limit, 10) : 14;
    return this.appointmentsService.getMoodCheckins(user, id, Number.isNaN(parsed) ? 14 : parsed);
  }

  @Post("patients/:id/mood-checkins")
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: "Record a mood check-in for the owner patient" })
  @ApiCreatedResponse({ type: MoodCheckinItemDto })
  createMoodCheckin(
    @CurrentUser() user: AuthJwtPayload,
    @Param("id") id: string,
    @Body() dto: CreateMoodCheckinDto,
  ): Promise<MoodCheckinItemDto> {
    return this.appointmentsService.createMoodCheckin(user, id, dto);
  }

  @Get("psychologists/:id/pre-session-workspace")
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: "Get psychologist pre-session workspace summary" })
  @ApiOkResponse({ type: PsychologistPreSessionWorkspaceDto })
  getPsychologistPreSessionWorkspace(
    @CurrentUser() user: AuthJwtPayload,
    @Param("id") id: string,
    @Query() query: GetPsychologistWorkspaceQueryDto,
  ): Promise<PsychologistPreSessionWorkspaceDto> {
    return this.appointmentsService.getPsychologistPreSessionWorkspace(user, id, query);
  }

  @Get("psychologists/:id/sessions")
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: "List session history for assigned psychologist (or ops roles)" })
  @ApiOkResponse({ type: [SessionSummaryDto] })
  getPsychologistSessions(@CurrentUser() user: AuthJwtPayload, @Param("id") id: string): Promise<SessionSummaryDto[]> {
    return this.appointmentsService.getPsychologistSessions(user, id);
  }

  @Get("sessions/:id")
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: "Get normalized session detail for owner patient, assigned psychologist, or ops roles" })
  @ApiOkResponse({ type: SessionDetailDto })
  getSessionDetail(@CurrentUser() user: AuthJwtPayload, @Param("id") id: string): Promise<SessionDetailDto> {
    return this.appointmentsService.getSessionDetail(user, id);
  }

  @Get("ops/insights")
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: "Get ops insight aggregates for manager/admin dashboards" })
  @ApiOkResponse({ type: OpsInsightsDto })
  getOpsInsights(@CurrentUser() user: AuthJwtPayload): Promise<OpsInsightsDto> {
    return this.appointmentsService.getOpsInsights(user);
  }

  @Get("ops/telehealth-insights")
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: "Get telehealth join funnel and reliability KPIs" })
  @ApiOkResponse({ type: TelehealthInsightsDto })
  getTelehealthInsights(@CurrentUser() user: AuthJwtPayload): Promise<TelehealthInsightsDto> {
    return this.appointmentsService.getTelehealthInsights(user);
  }

  @Post("ops/readiness-reminders/dispatch")
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: "Dispatch T-30/T-10 readiness reminders for upcoming telehealth sessions" })
  @ApiCreatedResponse({ type: ReadinessReminderDispatchDto })
  dispatchReadinessReminders(@CurrentUser() user: AuthJwtPayload): Promise<ReadinessReminderDispatchDto> {
    return this.appointmentsService.dispatchReadinessReminders(user);
  }
}
