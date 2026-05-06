"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AppointmentsController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const current_user_decorator_1 = require("../auth/decorators/current-user.decorator");
const jwt_auth_guard_1 = require("../auth/guards/jwt-auth.guard");
const booking_request_created_response_dto_1 = require("./dto/booking-request-created-response.dto");
const booking_request_status_dto_1 = require("./dto/booking-request-status.dto");
const appointments_service_1 = require("./appointments.service");
const assign_intake_queue_item_dto_1 = require("./dto/assign-intake-queue-item.dto");
const appointment_details_dto_1 = require("./dto/appointment-details.dto");
const chat_message_dto_1 = require("./dto/chat-message.dto");
const chat_window_dto_1 = require("./dto/chat-window.dto");
const clinician_availability_response_dto_1 = require("./dto/clinician-availability-response.dto");
const create_chat_message_dto_1 = require("./dto/create-chat-message.dto");
const create_booking_request_dto_1 = require("./dto/create-booking-request.dto");
const create_mood_checkin_dto_1 = require("./dto/create-mood-checkin.dto");
const create_join_attempt_dto_1 = require("./dto/create-join-attempt.dto");
const create_join_session_dto_1 = require("./dto/create-join-session.dto");
const intake_assignable_clinician_dto_1 = require("./dto/intake-assignable-clinician.dto");
const get_clinician_availability_query_dto_1 = require("./dto/get-clinician-availability-query.dto");
const get_intake_queue_query_dto_1 = require("./dto/get-intake-queue-query.dto");
const intake_draft_dto_1 = require("./dto/intake-draft.dto");
const intake_draft_saved_response_dto_1 = require("./dto/intake-draft-saved-response.dto");
const intake_queue_item_dto_1 = require("./dto/intake-queue-item.dto");
const join_attempt_decision_dto_1 = require("./dto/join-attempt-decision.dto");
const join_session_token_dto_1 = require("./dto/join-session-token.dto");
const manage_appointment_dto_1 = require("./dto/manage-appointment.dto");
const save_intake_draft_dto_1 = require("./dto/save-intake-draft.dto");
const save_telehealth_readiness_dto_1 = require("./dto/save-telehealth-readiness.dto");
const telehealth_session_window_dto_1 = require("./dto/telehealth-session-window.dto");
const telehealth_readiness_dto_1 = require("./dto/telehealth-readiness.dto");
const mood_checkin_item_dto_1 = require("./dto/mood-checkin-item.dto");
const patient_appointment_summary_dto_1 = require("./dto/patient-appointment-summary.dto");
const patient_journey_timeline_dto_1 = require("./dto/patient-journey-timeline.dto");
const psychologist_pre_session_workspace_dto_1 = require("./dto/psychologist-pre-session-workspace.dto");
const ops_insights_dto_1 = require("./dto/ops-insights.dto");
const get_psychologist_workspace_query_dto_1 = require("./dto/get-psychologist-workspace-query.dto");
const readiness_reminder_dispatch_dto_1 = require("./dto/readiness-reminder-dispatch.dto");
const telehealth_insights_dto_1 = require("./dto/telehealth-insights.dto");
const patient_care_clinician_dto_1 = require("./dto/patient-care-clinician.dto");
const session_summary_dto_1 = require("./dto/session-summary.dto");
const session_detail_dto_1 = require("./dto/session-detail.dto");
let AppointmentsController = class AppointmentsController {
    appointmentsService;
    constructor(appointmentsService) {
        this.appointmentsService = appointmentsService;
    }
    async getAvailability(query) {
        return this.appointmentsService.getClinicianAvailability(query);
    }
    createBookingRequest(user, dto) {
        return this.appointmentsService.createBookingRequest(user, dto);
    }
    getBookingRequestStatus(user, id) {
        return this.appointmentsService.getBookingRequestStatus(user, id);
    }
    getPreSessionWindow(user, id) {
        return this.appointmentsService.getPreSessionWindow(user, id);
    }
    getAppointmentDetails(user, id) {
        return this.appointmentsService.getAppointmentDetails(user, id);
    }
    manageAppointment(user, id, dto) {
        return this.appointmentsService.manageAppointment(user, id, dto);
    }
    getTelehealthReadiness(user, id) {
        return this.appointmentsService.getTelehealthReadiness(user, id);
    }
    saveTelehealthReadiness(user, id, dto) {
        return this.appointmentsService.saveTelehealthReadiness(user, id, dto);
    }
    getChatWindow(user, id) {
        return this.appointmentsService.getChatWindow(user, id);
    }
    postChatMessage(user, id, dto) {
        return this.appointmentsService.addChatMessage(user, id, dto);
    }
    createJoinAttempt(user, id, dto) {
        return this.appointmentsService.createJoinAttempt(user, id, dto);
    }
    createJoinSession(user, id, dto) {
        return this.appointmentsService.createJoinSession(user, id, dto);
    }
    getLatestIntakeDraft(user, id) {
        return this.appointmentsService.getLatestIntakeDraft(user, id);
    }
    saveIntakeDelta(user, id, dto) {
        return this.appointmentsService.saveIntakeDraftDelta(user, id, dto);
    }
    commitIntakeDraft(user, id) {
        return this.appointmentsService.commitIntakeDraft(user, id);
    }
    getIntakeQueue(user, query) {
        return this.appointmentsService.getIntakeQueue(user, query);
    }
    getAssignableClinicians(user) {
        return this.appointmentsService.getAssignableClinicians(user);
    }
    assignIntakeQueueItem(user, id, dto) {
        return this.appointmentsService.assignIntakeQueueItem(user, id, dto.assignedClinicianId);
    }
    getMyCareTeam(user) {
        return this.appointmentsService.getPatientCareTeam(user);
    }
    getPatientJourneyTimeline(user, id) {
        return this.appointmentsService.getPatientJourneyTimeline(user, id);
    }
    getPatientAppointments(user, id) {
        return this.appointmentsService.getPatientAppointmentsList(user, id);
    }
    getPatientSessions(user, id) {
        return this.appointmentsService.getPatientSessions(user, id);
    }
    getMoodCheckins(user, id, limit) {
        const parsed = limit ? Number.parseInt(limit, 10) : 14;
        return this.appointmentsService.getMoodCheckins(user, id, Number.isNaN(parsed) ? 14 : parsed);
    }
    createMoodCheckin(user, id, dto) {
        return this.appointmentsService.createMoodCheckin(user, id, dto);
    }
    getPsychologistPreSessionWorkspace(user, id, query) {
        return this.appointmentsService.getPsychologistPreSessionWorkspace(user, id, query);
    }
    getPsychologistSessions(user, id) {
        return this.appointmentsService.getPsychologistSessions(user, id);
    }
    getSessionDetail(user, id) {
        return this.appointmentsService.getSessionDetail(user, id);
    }
    getOpsInsights(user) {
        return this.appointmentsService.getOpsInsights(user);
    }
    getTelehealthInsights(user) {
        return this.appointmentsService.getTelehealthInsights(user);
    }
    dispatchReadinessReminders(user) {
        return this.appointmentsService.dispatchReadinessReminders(user);
    }
};
exports.AppointmentsController = AppointmentsController;
__decorate([
    (0, common_1.Get)("clinicians/availability"),
    (0, swagger_1.ApiOperation)({ summary: "Get clinician slots for a date window" }),
    (0, swagger_1.ApiOkResponse)({ type: [clinician_availability_response_dto_1.ClinicianAvailabilityResponseDto] }),
    __param(0, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [get_clinician_availability_query_dto_1.GetClinicianAvailabilityQueryDto]),
    __metadata("design:returntype", Promise)
], AppointmentsController.prototype, "getAvailability", null);
__decorate([
    (0, common_1.Post)("booking-requests"),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, swagger_1.ApiBearerAuth)(),
    (0, swagger_1.ApiOperation)({ summary: "Create a booking request for selected slot" }),
    (0, swagger_1.ApiCreatedResponse)({ type: booking_request_created_response_dto_1.BookingRequestCreatedResponseDto }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, create_booking_request_dto_1.CreateBookingRequestDto]),
    __metadata("design:returntype", Promise)
], AppointmentsController.prototype, "createBookingRequest", null);
__decorate([
    (0, common_1.Get)("booking-requests/:id/status"),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, swagger_1.ApiBearerAuth)(),
    (0, swagger_1.ApiOperation)({ summary: "Get current status for a booking request" }),
    (0, swagger_1.ApiOkResponse)({ type: booking_request_status_dto_1.BookingRequestStatusDto }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)("id")),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", Promise)
], AppointmentsController.prototype, "getBookingRequestStatus", null);
__decorate([
    (0, common_1.Get)("appointments/:id/pre-session-window"),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, swagger_1.ApiBearerAuth)(),
    (0, swagger_1.ApiOperation)({ summary: "Get T-30 pre-session chat window state for appointment" }),
    (0, swagger_1.ApiOkResponse)({ type: telehealth_session_window_dto_1.TelehealthSessionWindowDto }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)("id")),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", Promise)
], AppointmentsController.prototype, "getPreSessionWindow", null);
__decorate([
    (0, common_1.Get)("appointments/:id"),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, swagger_1.ApiBearerAuth)(),
    (0, swagger_1.ApiOperation)({ summary: "Get appointment details for management and join surfaces" }),
    (0, swagger_1.ApiOkResponse)({ type: appointment_details_dto_1.AppointmentDetailsDto }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)("id")),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", Promise)
], AppointmentsController.prototype, "getAppointmentDetails", null);
__decorate([
    (0, common_1.Post)("appointments/:id/manage"),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, swagger_1.ApiBearerAuth)(),
    (0, swagger_1.ApiOperation)({ summary: "Manage appointment as owner patient (cancel or reschedule)" }),
    (0, swagger_1.ApiCreatedResponse)({ type: appointment_details_dto_1.AppointmentDetailsDto }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)("id")),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, manage_appointment_dto_1.ManageAppointmentDto]),
    __metadata("design:returntype", Promise)
], AppointmentsController.prototype, "manageAppointment", null);
__decorate([
    (0, common_1.Get)("appointments/:id/readiness"),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, swagger_1.ApiBearerAuth)(),
    (0, swagger_1.ApiOperation)({ summary: "Get telehealth pre-session readiness checklist for appointment" }),
    (0, swagger_1.ApiOkResponse)({ type: telehealth_readiness_dto_1.TelehealthReadinessDto }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)("id")),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", Promise)
], AppointmentsController.prototype, "getTelehealthReadiness", null);
__decorate([
    (0, common_1.Post)("appointments/:id/readiness"),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, swagger_1.ApiBearerAuth)(),
    (0, swagger_1.ApiOperation)({ summary: "Save telehealth pre-session readiness results for appointment" }),
    (0, swagger_1.ApiCreatedResponse)({ type: telehealth_readiness_dto_1.TelehealthReadinessDto }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)("id")),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, save_telehealth_readiness_dto_1.SaveTelehealthReadinessDto]),
    __metadata("design:returntype", Promise)
], AppointmentsController.prototype, "saveTelehealthReadiness", null);
__decorate([
    (0, common_1.Get)("appointments/:id/chat-window"),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, swagger_1.ApiBearerAuth)(),
    (0, swagger_1.ApiOperation)({ summary: "Get pre-session chat window status for appointment" }),
    (0, swagger_1.ApiOkResponse)({ type: chat_window_dto_1.ChatWindowDto }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)("id")),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", Promise)
], AppointmentsController.prototype, "getChatWindow", null);
__decorate([
    (0, common_1.Post)("appointments/:id/chat/messages"),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, swagger_1.ApiBearerAuth)(),
    (0, swagger_1.ApiOperation)({ summary: "Post message to appointment pre-session chat" }),
    (0, swagger_1.ApiCreatedResponse)({ type: chat_message_dto_1.ChatMessageDto }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)("id")),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, create_chat_message_dto_1.CreateChatMessageDto]),
    __metadata("design:returntype", Promise)
], AppointmentsController.prototype, "postChatMessage", null);
__decorate([
    (0, common_1.Post)("appointments/:id/join-attempt"),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, swagger_1.ApiBearerAuth)(),
    (0, swagger_1.ApiOperation)({ summary: "Evaluate and record pre-join gate decision for appointment" }),
    (0, swagger_1.ApiCreatedResponse)({ type: join_attempt_decision_dto_1.JoinAttemptDecisionDto }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)("id")),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, create_join_attempt_dto_1.CreateJoinAttemptDto]),
    __metadata("design:returntype", Promise)
], AppointmentsController.prototype, "createJoinAttempt", null);
__decorate([
    (0, common_1.Post)("appointments/:id/join-session"),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, swagger_1.ApiBearerAuth)(),
    (0, swagger_1.ApiOperation)({ summary: "Create short-lived Twilio join token scoped to appointment" }),
    (0, swagger_1.ApiCreatedResponse)({ type: join_session_token_dto_1.JoinSessionTokenDto }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)("id")),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, create_join_session_dto_1.CreateJoinSessionDto]),
    __metadata("design:returntype", Promise)
], AppointmentsController.prototype, "createJoinSession", null);
__decorate([
    (0, common_1.Get)("patients/:id/intake-latest"),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, swagger_1.ApiBearerAuth)(),
    (0, swagger_1.ApiOperation)({ summary: "Get latest cross-device intake draft for patient" }),
    (0, swagger_1.ApiOkResponse)({ type: intake_draft_dto_1.IntakeDraftDto }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)("id")),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", Promise)
], AppointmentsController.prototype, "getLatestIntakeDraft", null);
__decorate([
    (0, common_1.Post)("patients/:id/intake-delta"),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, swagger_1.ApiBearerAuth)(),
    (0, swagger_1.ApiOperation)({ summary: "Save intake draft delta with version conflict protection" }),
    (0, swagger_1.ApiCreatedResponse)({ type: intake_draft_saved_response_dto_1.IntakeDraftSavedResponseDto }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)("id")),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, save_intake_draft_dto_1.SaveIntakeDraftDto]),
    __metadata("design:returntype", Promise)
], AppointmentsController.prototype, "saveIntakeDelta", null);
__decorate([
    (0, common_1.Post)("patients/:id/intake-draft/commit"),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, swagger_1.ApiBearerAuth)(),
    (0, swagger_1.ApiOperation)({ summary: "Commit current intake draft version after final review/submission" }),
    (0, swagger_1.ApiCreatedResponse)({ type: intake_draft_saved_response_dto_1.IntakeDraftSavedResponseDto }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)("id")),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", Promise)
], AppointmentsController.prototype, "commitIntakeDraft", null);
__decorate([
    (0, common_1.Get)("ops/intake-queue"),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, swagger_1.ApiBearerAuth)(),
    (0, swagger_1.ApiOperation)({ summary: "Get intake triage queue for operations roles" }),
    (0, swagger_1.ApiOkResponse)({ type: [intake_queue_item_dto_1.IntakeQueueItemDto] }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, get_intake_queue_query_dto_1.GetIntakeQueueQueryDto]),
    __metadata("design:returntype", Promise)
], AppointmentsController.prototype, "getIntakeQueue", null);
__decorate([
    (0, common_1.Get)("ops/intake-queue/assignable-clinicians"),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, swagger_1.ApiBearerAuth)(),
    (0, swagger_1.ApiOperation)({ summary: "List assignable active clinicians for intake queue triage" }),
    (0, swagger_1.ApiOkResponse)({ type: [intake_assignable_clinician_dto_1.IntakeAssignableClinicianDto] }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], AppointmentsController.prototype, "getAssignableClinicians", null);
__decorate([
    (0, common_1.Post)("ops/intake-queue/:id/assign"),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, swagger_1.ApiBearerAuth)(),
    (0, swagger_1.ApiOperation)({ summary: "Assign intake queue item to clinician" }),
    (0, swagger_1.ApiCreatedResponse)({ type: intake_queue_item_dto_1.IntakeQueueItemDto }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)("id")),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, assign_intake_queue_item_dto_1.AssignIntakeQueueItemDto]),
    __metadata("design:returntype", Promise)
], AppointmentsController.prototype, "assignIntakeQueueItem", null);
__decorate([
    (0, common_1.Get)("patients/me/care-team"),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, swagger_1.ApiBearerAuth)(),
    (0, swagger_1.ApiOperation)({ summary: "List psychologists linked to the authenticated patient via appointments (care team)" }),
    (0, swagger_1.ApiOkResponse)({ type: [patient_care_clinician_dto_1.PatientCareClinicianDto] }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], AppointmentsController.prototype, "getMyCareTeam", null);
__decorate([
    (0, common_1.Get)("patients/:id/journey-timeline"),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, swagger_1.ApiBearerAuth)(),
    (0, swagger_1.ApiOperation)({ summary: "Get patient journey timeline projection" }),
    (0, swagger_1.ApiOkResponse)({ type: patient_journey_timeline_dto_1.PatientJourneyTimelineDto }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)("id")),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", Promise)
], AppointmentsController.prototype, "getPatientJourneyTimeline", null);
__decorate([
    (0, common_1.Get)("patients/:id/appointments"),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, swagger_1.ApiBearerAuth)(),
    (0, swagger_1.ApiOperation)({ summary: "List patient appointments (upcoming and past)" }),
    (0, swagger_1.ApiOkResponse)({ type: patient_appointment_summary_dto_1.PatientAppointmentsListResponseDto }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)("id")),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", Promise)
], AppointmentsController.prototype, "getPatientAppointments", null);
__decorate([
    (0, common_1.Get)("patients/:id/sessions"),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, swagger_1.ApiBearerAuth)(),
    (0, swagger_1.ApiOperation)({ summary: "List session history for owner patient (or ops roles)" }),
    (0, swagger_1.ApiOkResponse)({ type: [session_summary_dto_1.SessionSummaryDto] }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)("id")),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", Promise)
], AppointmentsController.prototype, "getPatientSessions", null);
__decorate([
    (0, common_1.Get)("patients/:id/mood-checkins"),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, swagger_1.ApiBearerAuth)(),
    (0, swagger_1.ApiOperation)({ summary: "List recent mood check-ins for patient" }),
    (0, swagger_1.ApiOkResponse)({ type: mood_checkin_item_dto_1.MoodCheckinsListResponseDto }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)("id")),
    __param(2, (0, common_1.Query)("limit")),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, String]),
    __metadata("design:returntype", Promise)
], AppointmentsController.prototype, "getMoodCheckins", null);
__decorate([
    (0, common_1.Post)("patients/:id/mood-checkins"),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, swagger_1.ApiBearerAuth)(),
    (0, swagger_1.ApiOperation)({ summary: "Record a mood check-in for the owner patient" }),
    (0, swagger_1.ApiCreatedResponse)({ type: mood_checkin_item_dto_1.MoodCheckinItemDto }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)("id")),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, create_mood_checkin_dto_1.CreateMoodCheckinDto]),
    __metadata("design:returntype", Promise)
], AppointmentsController.prototype, "createMoodCheckin", null);
__decorate([
    (0, common_1.Get)("psychologists/:id/pre-session-workspace"),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, swagger_1.ApiBearerAuth)(),
    (0, swagger_1.ApiOperation)({ summary: "Get psychologist pre-session workspace summary" }),
    (0, swagger_1.ApiOkResponse)({ type: psychologist_pre_session_workspace_dto_1.PsychologistPreSessionWorkspaceDto }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)("id")),
    __param(2, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, get_psychologist_workspace_query_dto_1.GetPsychologistWorkspaceQueryDto]),
    __metadata("design:returntype", Promise)
], AppointmentsController.prototype, "getPsychologistPreSessionWorkspace", null);
__decorate([
    (0, common_1.Get)("psychologists/:id/sessions"),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, swagger_1.ApiBearerAuth)(),
    (0, swagger_1.ApiOperation)({ summary: "List session history for assigned psychologist (or ops roles)" }),
    (0, swagger_1.ApiOkResponse)({ type: [session_summary_dto_1.SessionSummaryDto] }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)("id")),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", Promise)
], AppointmentsController.prototype, "getPsychologistSessions", null);
__decorate([
    (0, common_1.Get)("sessions/:id"),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, swagger_1.ApiBearerAuth)(),
    (0, swagger_1.ApiOperation)({ summary: "Get normalized session detail for owner patient, assigned psychologist, or ops roles" }),
    (0, swagger_1.ApiOkResponse)({ type: session_detail_dto_1.SessionDetailDto }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)("id")),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", Promise)
], AppointmentsController.prototype, "getSessionDetail", null);
__decorate([
    (0, common_1.Get)("ops/insights"),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, swagger_1.ApiBearerAuth)(),
    (0, swagger_1.ApiOperation)({ summary: "Get ops insight aggregates for manager/admin dashboards" }),
    (0, swagger_1.ApiOkResponse)({ type: ops_insights_dto_1.OpsInsightsDto }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], AppointmentsController.prototype, "getOpsInsights", null);
__decorate([
    (0, common_1.Get)("ops/telehealth-insights"),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, swagger_1.ApiBearerAuth)(),
    (0, swagger_1.ApiOperation)({ summary: "Get telehealth join funnel and reliability KPIs" }),
    (0, swagger_1.ApiOkResponse)({ type: telehealth_insights_dto_1.TelehealthInsightsDto }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], AppointmentsController.prototype, "getTelehealthInsights", null);
__decorate([
    (0, common_1.Post)("ops/readiness-reminders/dispatch"),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, swagger_1.ApiBearerAuth)(),
    (0, swagger_1.ApiOperation)({ summary: "Dispatch T-30/T-10 readiness reminders for upcoming telehealth sessions" }),
    (0, swagger_1.ApiCreatedResponse)({ type: readiness_reminder_dispatch_dto_1.ReadinessReminderDispatchDto }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], AppointmentsController.prototype, "dispatchReadinessReminders", null);
exports.AppointmentsController = AppointmentsController = __decorate([
    (0, swagger_1.ApiTags)("appointments"),
    (0, common_1.Controller)(),
    __metadata("design:paramtypes", [appointments_service_1.AppointmentsService])
], AppointmentsController);
//# sourceMappingURL=appointments.controller.js.map