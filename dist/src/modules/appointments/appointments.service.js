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
Object.defineProperty(exports, "__esModule", { value: true });
exports.AppointmentsService = void 0;
const common_1 = require("@nestjs/common");
const node_crypto_1 = require("node:crypto");
const audit_service_1 = require("../audit/audit.service");
const analytics_service_1 = require("../analytics/analytics.service");
const database_service_1 = require("../core/database.service");
const prisma_service_1 = require("../prisma/prisma.service");
const notifications_service_1 = require("../notifications/notifications.service");
const users_service_1 = require("../users/users.service");
const twilio_token_service_1 = require("./twilio-token.service");
function toMillis(value) {
    if (value instanceof Date)
        return value.getTime();
    const parsed = new Date(value).getTime();
    return Number.isNaN(parsed) ? 0 : parsed;
}
/** Patient self-service reschedule policy (ops roles use looser minimum lead). */
const RESCHEDULE_PATIENT_MIN_LEAD_FROM_NOW_MS = 60 * 60 * 1000;
const RESCHEDULE_OPS_MIN_LEAD_FROM_NOW_MS = 5 * 60 * 1000;
const RESCHEDULE_LOCK_WITHIN_ORIGINAL_START_MS = 2 * 60 * 60 * 1000;
const RESCHEDULE_MAX_DAYS_AHEAD = 180;
const CLINICIANS = [
    { clinicianId: "clinician_001", clinicianName: "Avery Mitchell" },
    { clinicianId: "clinician_002", clinicianName: "Jordan Nguyen" },
    { clinicianId: "clinician_003", clinicianName: "Samira Khan" },
];
/**
 * When `psychologist_profile_bio.profile_image_url` is unset, patients still see a distinct face
 * for each seeded bookable clinician (booking + care-team). Replaced by DB URL when a psychologist sets one.
 */
const BOOKING_SEED_CLINICIAN_PORTRAIT_URLS = {
    clinician_001: "https://i.pravatar.cc/300?u=clink-clinician-001",
    clinician_002: "https://i.pravatar.cc/300?u=clink-clinician-002",
    clinician_003: "https://i.pravatar.cc/300?u=clink-clinician-003",
};
let AppointmentsService = class AppointmentsService {
    auditService;
    analyticsService;
    notificationsService;
    databaseService;
    prisma;
    twilioTokenService;
    usersService;
    bookingRequests = new Map();
    idempotency = new Map();
    bookingCounter = 1;
    appointments = new Map();
    chatMessages = new Map();
    chatPresence = new Map();
    chatMessageCounter = 1;
    intakeDrafts = new Map();
    intakeQueueAssignments = new Map();
    telehealthReadiness = new Map();
    moodCheckins = new Map();
    moodCheckinCounter = 1;
    seedPromise = null;
    constructor(auditService, analyticsService, notificationsService, databaseService, prisma, twilioTokenService, usersService) {
        this.auditService = auditService;
        this.analyticsService = analyticsService;
        this.notificationsService = notificationsService;
        this.databaseService = databaseService;
        this.prisma = prisma;
        this.twilioTokenService = twilioTokenService;
        this.usersService = usersService;
        const now = new Date();
        const openApptStart = new Date(now.getTime() + 15 * 60 * 1000);
        const lockedApptStart = new Date(now.getTime() + 2 * 60 * 60 * 1000);
        const closedApptStart = new Date(now.getTime() - 2 * 60 * 60 * 1000);
        const manageApptStart = new Date(now.getTime() + 3 * 60 * 60 * 1000);
        this.appointments.set("appt_open_001", {
            appointmentId: "appt_open_001",
            patientId: "user_patient_001",
            clinicianId: "clinician_001",
            scheduledStartAt: openApptStart.toISOString(),
            scheduledEndAt: new Date(openApptStart.getTime() + 50 * 60 * 1000).toISOString(),
            status: "scheduled",
            chatWindowOpenAt: new Date(openApptStart.getTime() - 30 * 60 * 1000).toISOString(),
            chatWindowCloseAt: new Date(openApptStart.getTime() + 50 * 60 * 1000).toISOString(),
        });
        this.appointments.set("appt_locked_001", {
            appointmentId: "appt_locked_001",
            patientId: "user_patient_001",
            clinicianId: "clinician_002",
            scheduledStartAt: lockedApptStart.toISOString(),
            scheduledEndAt: new Date(lockedApptStart.getTime() + 50 * 60 * 1000).toISOString(),
            status: "scheduled",
            chatWindowOpenAt: new Date(lockedApptStart.getTime() - 30 * 60 * 1000).toISOString(),
            chatWindowCloseAt: new Date(lockedApptStart.getTime() + 50 * 60 * 1000).toISOString(),
        });
        this.appointments.set("appt_closed_001", {
            appointmentId: "appt_closed_001",
            patientId: "user_patient_001",
            clinicianId: "clinician_003",
            scheduledStartAt: closedApptStart.toISOString(),
            scheduledEndAt: new Date(closedApptStart.getTime() + 50 * 60 * 1000).toISOString(),
            status: "completed",
            chatWindowOpenAt: new Date(closedApptStart.getTime() - 30 * 60 * 1000).toISOString(),
            chatWindowCloseAt: new Date(closedApptStart.getTime() + 50 * 60 * 1000).toISOString(),
        });
        this.appointments.set("appt_manage_001", {
            appointmentId: "appt_manage_001",
            patientId: "user_patient_001",
            clinicianId: "clinician_001",
            scheduledStartAt: manageApptStart.toISOString(),
            scheduledEndAt: new Date(manageApptStart.getTime() + 50 * 60 * 1000).toISOString(),
            status: "scheduled",
            chatWindowOpenAt: new Date(manageApptStart.getTime() - 30 * 60 * 1000).toISOString(),
            chatWindowCloseAt: new Date(manageApptStart.getTime() + 50 * 60 * 1000).toISOString(),
        });
        const nowIso = new Date().toISOString();
        const demoIntakeData = (fullName, email) => ({
            patientIdentity: {
                fullName,
                dateOfBirth: "1990-04-15",
                mobile: "0400000111",
                email,
                suburb: "Sydney",
                state: "NSW",
                preferredContactMethod: "sms",
            },
            consents: {
                privacyAccepted: true,
                telehealthAccepted: true,
                treatmentAccepted: true,
            },
        });
        this.intakeDrafts.set("user_patient_001", {
            patientId: "user_patient_001",
            draftVersion: 1,
            data: demoIntakeData("Patient Demo", "patient@clink.test"),
            updatedAt: nowIso,
            committedAt: nowIso,
        });
        this.intakeDrafts.set("user_patient_002", {
            patientId: "user_patient_002",
            draftVersion: 1,
            data: demoIntakeData("Patient Two Demo", "patient2@clink.test"),
            updatedAt: nowIso,
            committedAt: nowIso,
        });
    }
    async getClinicianAvailability(query) {
        const timezone = query.timezone ?? "Australia/Sydney";
        this.assertValidTimezone(timezone);
        const startDate = this.normalizeToTimezoneDate(query.startDate, timezone);
        const endDate = this.normalizeToTimezoneDate(query.endDate, timezone);
        if (startDate > endDate) {
            throw new common_1.BadRequestException("startDate must be before or equal to endDate");
        }
        const dayRange = Math.floor((endDate.getTime() - startDate.getTime()) / 86_400_000);
        if (dayRange > 31) {
            throw new common_1.BadRequestException("Date range cannot exceed 31 days");
        }
        const selected = this.resolveClinicians(query.clinicianId);
        const userIds = selected.map((c) => this.resolveClinicianIdToPsychologistUserId(c.clinicianId));
        const enrich = await this.loadClinicianPublicEnrichmentByUserIds(userIds);
        return selected.map((clinician) => {
            const psychUserId = this.resolveClinicianIdToPsychologistUserId(clinician.clinicianId);
            const e = enrich.get(psychUserId);
            return {
                clinicianId: clinician.clinicianId,
                clinicianName: clinician.clinicianName,
                slots: this.buildSlots(startDate, endDate, clinician.clinicianId),
                specialties: e?.specialties,
                bio: e?.bio,
                profileImageUrl: this.resolveBookingClinicianPortraitUrl(clinician.clinicianId, e?.profileImageUrl),
            };
        });
    }
    async createBookingRequest(user, dto) {
        await this.ensureAppointmentSeeds();
        if (user.role !== "patient") {
            throw new common_1.ForbiddenException("Only patients can create booking requests");
        }
        const timezone = dto.timezone ?? "Australia/Sydney";
        this.assertValidTimezone(timezone);
        const appointmentDate = this.normalizeToTimezoneDate(dto.appointmentDate, timezone).toISOString().slice(0, 10);
        if (dto.idempotencyKey) {
            const key = `${user.sub}:${dto.idempotencyKey}`;
            const existingRequestId = await this.getIdempotencyBookingId(key);
            if (existingRequestId) {
                const existing = await this.getBookingRequestById(existingRequestId);
                if (!existing) {
                    throw new common_1.NotFoundException("Booking request not found");
                }
                return {
                    bookingRequestId: existing.bookingRequestId,
                    state: existing.state,
                    createdAt: existing.createdAt,
                    idempotentReplay: true,
                };
            }
        }
        await this.assertSlotExists(dto.clinicianId, dto.slotId, appointmentDate, timezone);
        const existingForSlot = await this.findActiveBookingForSlot(dto.clinicianId, dto.slotId, appointmentDate);
        if (existingForSlot) {
            throw new common_1.ConflictException("Selected slot is no longer available");
        }
        const bookingRequestId = this.allocateBookingRequestId();
        const now = new Date().toISOString();
        const record = {
            bookingRequestId,
            patientId: user.sub,
            clinicianId: dto.clinicianId,
            slotId: dto.slotId,
            appointmentDate,
            referralDocumentId: dto.referralDocumentId ?? "",
            timezone,
            notes: dto.notes ?? "",
            state: "submitted",
            createdAt: now,
            updatedAt: now,
        };
        const scheduledStartAt = new Date(`${appointmentDate}T09:00:00.000Z`);
        const scheduledEndAt = new Date(scheduledStartAt.getTime() + 50 * 60 * 1000);
        const chatWindowOpenAt = new Date(scheduledStartAt.getTime() - 30 * 60 * 1000);
        const createdAppointment = {
            appointmentId: `appt_${record.bookingRequestId}`,
            patientId: user.sub,
            clinicianId: dto.clinicianId,
            scheduledStartAt: scheduledStartAt.toISOString(),
            scheduledEndAt: scheduledEndAt.toISOString(),
            status: "scheduled",
            chatWindowOpenAt: chatWindowOpenAt.toISOString(),
            chatWindowCloseAt: scheduledEndAt.toISOString(),
        };
        try {
            await this.persistBookingBundle(record, createdAppointment, dto.idempotencyKey ? `${user.sub}:${dto.idempotencyKey}` : undefined);
        }
        catch (error) {
            if (this.isUniqueViolation(error, "booking_requests_active_slot_unique_idx")) {
                throw new common_1.ConflictException("Selected slot is no longer available");
            }
            if (dto.idempotencyKey && this.isUniqueViolation(error, "booking_idempotency_pkey")) {
                const key = `${user.sub}:${dto.idempotencyKey}`;
                const existingRequestId = await this.getIdempotencyBookingId(key);
                if (existingRequestId) {
                    const existing = await this.getBookingRequestById(existingRequestId);
                    if (existing) {
                        return {
                            bookingRequestId: existing.bookingRequestId,
                            state: existing.state,
                            createdAt: existing.createdAt,
                            idempotentReplay: true,
                        };
                    }
                }
            }
            throw error;
        }
        await this.analyticsService.recordEvent({
            name: "booking_requested",
            actorUserId: user.sub,
            actorRole: user.role,
            targetId: record.bookingRequestId,
            idempotencyKey: `booking_requested:${record.bookingRequestId}`,
            metadata: {
                clinicianId: dto.clinicianId,
                appointmentDate,
            },
        });
        await this.notificationsService.createNotification({
            recipientUserId: user.sub,
            recipientRole: user.role,
            type: "booking_submitted",
            title: "Booking request submitted",
            body: "Your request has been submitted and is now in triage queue.",
            metadata: {
                bookingRequestId: record.bookingRequestId,
                ctaPath: "/patient/appointments",
            },
        });
        return {
            bookingRequestId: record.bookingRequestId,
            state: record.state,
            createdAt: record.createdAt,
            idempotentReplay: false,
        };
    }
    async getPreSessionWindow(user, appointmentId) {
        await this.ensureAppointmentSeeds();
        const appointment = await this.getAppointmentById(appointmentId);
        if (!appointment) {
            throw new common_1.NotFoundException("Appointment not found");
        }
        const canViewAll = user.role === "admin" || user.role === "practice_manager" || user.role === "psychologist";
        if (!canViewAll && appointment.patientId !== user.sub) {
            throw new common_1.ForbiddenException("You cannot access this appointment window");
        }
        const now = new Date();
        const openAt = new Date(appointment.chatWindowOpenAt);
        const closeAt = new Date(appointment.chatWindowCloseAt);
        let status = "locked";
        if (appointment.status === "cancelled" || appointment.status === "completed" || appointment.status === "no_show") {
            status = "closed";
        }
        else if (now >= closeAt) {
            status = "closed";
        }
        else if (now >= openAt) {
            status = "open";
        }
        if (status === "open") {
            await this.analyticsService.recordEvent({
                name: "session_started",
                actorUserId: user.sub,
                actorRole: user.role,
                targetId: appointmentId,
                idempotencyKey: `session_started:${appointmentId}`,
            });
        }
        else if (status === "closed" && appointment.status === "completed") {
            await this.analyticsService.recordEvent({
                name: "session_completed",
                actorUserId: user.sub,
                actorRole: user.role,
                targetId: appointmentId,
                idempotencyKey: `session_completed:${appointmentId}`,
            });
        }
        else if (status === "closed" && appointment.status === "no_show") {
            await this.analyticsService.recordEvent({
                name: "session_no_show",
                actorUserId: user.sub,
                actorRole: user.role,
                targetId: appointmentId,
                idempotencyKey: `session_no_show:${appointmentId}`,
            });
        }
        return {
            appointmentId: appointment.appointmentId,
            status,
            opensAt: appointment.chatWindowOpenAt,
            closesAt: appointment.chatWindowCloseAt,
            now: now.toISOString(),
            reason: this.getWindowReason(status, appointment.status),
        };
    }
    async getAppointmentDetails(user, appointmentId) {
        const appointment = await this.getAuthorizedAppointment(user, appointmentId);
        return this.toAppointmentDetails(user, appointment);
    }
    async manageAppointment(user, appointmentId, dto) {
        const appointment = await this.getAuthorizedAppointment(user, appointmentId);
        const canManageOwner = user.role === "patient" && user.sub === appointment.patientId;
        const canManageOps = user.role === "admin" || user.role === "practice_manager";
        if (!canManageOwner && !canManageOps) {
            throw new common_1.ForbiddenException("You cannot manage this appointment");
        }
        if (appointment.status === "completed" || appointment.status === "no_show") {
            throw new common_1.ConflictException("Completed appointments cannot be changed");
        }
        if (dto.action === "cancel") {
            if (appointment.status === "cancelled") {
                throw new common_1.ConflictException("Appointment is already cancelled");
            }
            const next = { ...appointment, status: "cancelled" };
            await this.saveAppointment(next);
            await this.auditService.recordEvent({
                actorUserId: user.sub,
                actorRole: user.role,
                action: "appointment_cancelled",
                targetType: "appointment",
                targetId: next.appointmentId,
                metadata: { appointmentId: next.appointmentId },
            });
            return this.toAppointmentDetails(user, next);
        }
        if (!dto.scheduledStartAt) {
            throw new common_1.BadRequestException("scheduledStartAt is required when action is reschedule");
        }
        if (appointment.status === "cancelled") {
            throw new common_1.ConflictException("Cancelled appointments cannot be rescheduled");
        }
        const nextStart = new Date(dto.scheduledStartAt);
        if (Number.isNaN(nextStart.getTime())) {
            throw new common_1.BadRequestException("Invalid reschedule timestamp");
        }
        const nowMs = Date.now();
        const originalStartMs = new Date(appointment.scheduledStartAt).getTime();
        if (user.role === "patient" && originalStartMs - nowMs < RESCHEDULE_LOCK_WITHIN_ORIGINAL_START_MS) {
            throw new common_1.BadRequestException("Online rescheduling is not available within 2 hours of your appointment start. Please call the clinic.");
        }
        const minLeadMs = user.role === "patient" ? RESCHEDULE_PATIENT_MIN_LEAD_FROM_NOW_MS : RESCHEDULE_OPS_MIN_LEAD_FROM_NOW_MS;
        if (nextStart.getTime() < nowMs + minLeadMs) {
            throw new common_1.BadRequestException(user.role === "patient"
                ? "Choose a new time at least 1 hour from now."
                : "Reschedule time must be at least 5 minutes in the future");
        }
        const maxEndMs = nowMs + RESCHEDULE_MAX_DAYS_AHEAD * 24 * 60 * 60 * 1000;
        if (nextStart.getTime() > maxEndMs) {
            throw new common_1.BadRequestException(`Cannot reschedule more than ${RESCHEDULE_MAX_DAYS_AHEAD} days in advance.`);
        }
        const nextEnd = new Date(nextStart.getTime() + 50 * 60 * 1000);
        const next = {
            ...appointment,
            status: "scheduled",
            scheduledStartAt: nextStart.toISOString(),
            scheduledEndAt: nextEnd.toISOString(),
            chatWindowOpenAt: new Date(nextStart.getTime() - 30 * 60 * 1000).toISOString(),
            chatWindowCloseAt: nextEnd.toISOString(),
        };
        await this.saveAppointment(next);
        await this.auditService.recordEvent({
            actorUserId: user.sub,
            actorRole: user.role,
            action: "appointment_rescheduled",
            targetType: "appointment",
            targetId: next.appointmentId,
            metadata: {
                appointmentId: next.appointmentId,
                previousStartAt: appointment.scheduledStartAt,
                nextStartAt: next.scheduledStartAt,
            },
        });
        return this.toAppointmentDetails(user, next);
    }
    async getTelehealthReadiness(user, appointmentId) {
        const appointment = await this.getAuthorizedAppointment(user, appointmentId);
        const windowStatus = this.computeWindowStatus(appointment);
        const baseChecks = [
            {
                key: "camera",
                status: "review",
                message: "Camera permission will be requested when joining session.",
            },
            {
                key: "microphone",
                status: "review",
                message: "Microphone permission will be requested when joining session.",
            },
            {
                key: "network",
                status: "pass",
                message: "Use stable internet for best telehealth quality.",
            },
            {
                key: "session_window",
                status: windowStatus === "open" ? "pass" : "review",
                message: windowStatus === "open"
                    ? "Session chat window is open and ready."
                    : "Session is not open yet. You can still complete readiness checks.",
            },
        ];
        const persisted = await this.getTelehealthReadinessRecord(appointmentId, user.sub);
        const checks = persisted?.checks ?? baseChecks;
        const overallStatus = checks.every((check) => check.status === "pass")
            ? "ready"
            : "attention";
        return {
            appointmentId: appointment.appointmentId,
            overallStatus,
            checks,
            guidance: "Complete checks before joining your telehealth session.",
            updatedAt: persisted?.updatedAt ?? new Date().toISOString(),
        };
    }
    async saveTelehealthReadiness(user, appointmentId, dto) {
        const appointment = await this.getAuthorizedAppointment(user, appointmentId);
        if (user.role !== "patient" || user.sub !== appointment.patientId) {
            throw new common_1.ForbiddenException("Only the owner patient can save telehealth readiness");
        }
        const updatedAt = new Date().toISOString();
        const normalized = {
            appointmentId: appointment.appointmentId,
            overallStatus: dto.overallStatus,
            checks: dto.checks,
            guidance: "Complete checks before joining your telehealth session.",
            updatedAt,
        };
        await this.saveTelehealthReadinessRecord(appointment.appointmentId, user.sub, normalized);
        return normalized;
    }
    async getChatWindow(user, appointmentId) {
        return this.getChatWindowState(user, appointmentId);
    }
    async addChatMessage(user, appointmentId, dto) {
        const appointment = await this.getAuthorizedAppointment(user, appointmentId);
        const status = this.computeWindowStatus(appointment);
        if (status !== "open") {
            await this.recordAuditEvent("chat_message_denied_window_closed", appointmentId, user.sub);
            throw new common_1.ConflictException("Chat window is not open for this appointment");
        }
        const message = {
            messageId: this.nextChatMessageId(),
            appointmentId,
            authorUserId: user.sub,
            authorRole: user.role,
            message: dto.message.trim(),
            createdAt: new Date().toISOString(),
        };
        await this.saveChatMessage(message);
        await this.recordAuditEvent("chat_message_posted", appointmentId, user.sub);
        await this.notificationsService.createNotification({
            recipientUserId: appointment.patientId,
            recipientRole: "patient",
            type: "chat_window_open",
            title: "New pre-session chat message",
            body: "You have a new chat message before your session.",
            metadata: {
                appointmentId,
                ctaPath: `/video-session/${appointmentId}`,
            },
        });
        return message;
    }
    async createJoinAttempt(user, appointmentId, dto) {
        const appointment = await this.getAuthorizedAppointment(user, appointmentId);
        this.assertOverrideRole(user, dto.overrideReason);
        const decision = await this.evaluateJoinDecision(appointment);
        const recordedAt = new Date().toISOString();
        await this.analyticsService.recordEvent({
            name: "join_attempted",
            actorUserId: user.sub,
            actorRole: user.role,
            targetId: appointment.appointmentId,
            idempotencyKey: `join_attempted:${appointment.appointmentId}:${user.sub}:${dto.channel}:${recordedAt}`,
            metadata: { channel: dto.channel },
        });
        if (decision.reasons.length > 0) {
            await this.analyticsService.recordEvent({
                name: "join_warned",
                actorUserId: user.sub,
                actorRole: user.role,
                targetId: appointment.appointmentId,
                idempotencyKey: `join_warned:${appointment.appointmentId}:${user.sub}:${recordedAt}`,
                metadata: { reasons: decision.reasons.join(",") },
            });
        }
        await this.auditService.recordEvent({
            actorUserId: user.sub,
            actorRole: user.role,
            action: decision.reasons.length > 0 ? "join_attempt_warned" : "join_attempt_allowed",
            targetType: "appointment",
            targetId: appointment.appointmentId,
            metadata: {
                appointmentId: appointment.appointmentId,
                channel: dto.channel,
                acknowledgementNote: dto.acknowledgementNote ?? "",
                overrideReason: dto.overrideReason ?? "",
                policyMode: "warn_allow",
                allowed: decision.allowed,
                reasons: decision.reasons.join(","),
                readinessStatus: decision.readinessStatus,
                windowStatus: decision.windowStatus,
            },
        });
        return {
            appointmentId: appointment.appointmentId,
            allowed: decision.allowed,
            policyMode: "warn_allow",
            readinessStatus: decision.readinessStatus,
            windowStatus: decision.windowStatus,
            reasons: decision.reasons,
            recordedAt,
        };
    }
    async createJoinSession(user, appointmentId, dto) {
        const appointment = await this.getAuthorizedAppointment(user, appointmentId);
        this.assertOverrideRole(user, dto.overrideReason);
        const decision = await this.evaluateJoinDecision(appointment);
        if (!decision.allowed) {
            await this.auditService.recordEvent({
                actorUserId: user.sub,
                actorRole: user.role,
                action: "session_join_denied",
                targetType: "appointment",
                targetId: appointment.appointmentId,
                metadata: {
                    channel: dto.channel,
                    reasons: decision.reasons.join(","),
                    overrideReason: dto.overrideReason ?? "",
                },
            });
            await this.analyticsService.recordEvent({
                name: "join_failed",
                actorUserId: user.sub,
                actorRole: user.role,
                targetId: appointment.appointmentId,
                idempotencyKey: `join_failed:${appointment.appointmentId}:${user.sub}:${Date.now()}`,
                metadata: { reasons: decision.reasons.join(",") },
            });
            throw new common_1.ConflictException("Session cannot be joined right now");
        }
        const token = this.twilioTokenService.createAppointmentToken({
            appointmentId: appointment.appointmentId,
            identity: user.sub,
            role: user.role,
        });
        await this.auditService.recordEvent({
            actorUserId: user.sub,
            actorRole: user.role,
            action: "session_join_granted",
            targetType: "appointment",
            targetId: appointment.appointmentId,
            metadata: {
                channel: dto.channel,
                roomName: token.roomName,
                overrideReason: dto.overrideReason ?? "",
                warnings: decision.reasons.join(","),
            },
        });
        await this.analyticsService.recordEvent({
            name: "join_success",
            actorUserId: user.sub,
            actorRole: user.role,
            targetId: appointment.appointmentId,
            idempotencyKey: `join_success:${appointment.appointmentId}:${user.sub}:${Date.now()}`,
            metadata: {
                roomName: token.roomName,
                warnings: decision.reasons.join(","),
            },
        });
        return {
            appointmentId: appointment.appointmentId,
            roomName: token.roomName,
            participantIdentity: user.sub,
            accessToken: token.accessToken,
            expiresAt: token.expiresAt,
            policyMode: "warn_allow",
            warnings: decision.reasons,
        };
    }
    async getChatWindowState(user, appointmentId) {
        const appointment = await this.getAuthorizedAppointment(user, appointmentId);
        const status = this.computeWindowStatus(appointment);
        const messages = await this.getChatMessages(appointmentId);
        return {
            appointmentId: appointment.appointmentId,
            status,
            opensAt: appointment.chatWindowOpenAt,
            closesAt: appointment.chatWindowCloseAt,
            reason: this.getWindowReason(status, appointment.status),
            messageCount: messages.length,
        };
    }
    async getChatHistory(user, appointmentId) {
        await this.getAuthorizedAppointment(user, appointmentId);
        return this.getChatMessages(appointmentId);
    }
    async joinChatPresence(user, appointmentId) {
        await this.getAuthorizedAppointment(user, appointmentId);
        await this.addPresenceParticipant(appointmentId, user.sub);
        await this.recordAuditEvent("chat_room_join", appointmentId, user.sub);
        return this.getPresenceSnapshot(appointmentId);
    }
    async leaveChatPresence(user, appointmentId) {
        await this.removePresenceParticipant(appointmentId, user.sub);
        await this.recordAuditEvent("chat_room_leave", appointmentId, user.sub);
        return this.getPresenceSnapshot(appointmentId);
    }
    async getPresenceSnapshot(appointmentId) {
        const participants = await this.getPresenceParticipants(appointmentId);
        return {
            appointmentId,
            onlineUserIds: participants,
        };
    }
    async recordChatAudit(action, appointmentId, actorId) {
        await this.recordAuditEvent(action, appointmentId, actorId);
    }
    async getBookingRequestStatus(user, bookingRequestId) {
        const booking = await this.getBookingRequestById(bookingRequestId);
        if (!booking) {
            throw new common_1.NotFoundException("Booking request not found");
        }
        const canViewAll = user.role === "admin" || user.role === "practice_manager" || user.role === "psychologist";
        if (!canViewAll && booking.patientId !== user.sub) {
            throw new common_1.ForbiddenException("You cannot access this booking request");
        }
        if (booking.state === "appointment_confirmed") {
            await this.analyticsService.recordEvent({
                name: "booking_confirmed",
                actorUserId: user.sub,
                actorRole: user.role,
                targetId: booking.bookingRequestId,
                idempotencyKey: `booking_confirmed:${booking.bookingRequestId}`,
            });
        }
        return {
            bookingRequestId: booking.bookingRequestId,
            state: booking.state,
            lastUpdated: booking.updatedAt,
            nextAction: this.getNextActionForState(booking.state),
            clinicianId: booking.clinicianId,
            slotId: booking.slotId,
            appointmentDate: booking.appointmentDate,
            referralDocumentId: booking.referralDocumentId || undefined,
        };
    }
    async getLatestIntakeDraft(user, patientId) {
        await this.assertPatientClinicalReadAccess(user, patientId);
        const draft = await this.getIntakeDraftByPatientId(patientId);
        if (!draft) {
            return {
                patientId,
                draftVersion: 0,
                data: {},
                updatedAt: new Date().toISOString(),
                committed: false,
            };
        }
        return {
            patientId: draft.patientId,
            draftVersion: draft.draftVersion,
            data: draft.data,
            updatedAt: draft.updatedAt,
            committed: Boolean(draft.committedAt),
        };
    }
    /**
     * Latest merged intake draft data for trusted internal callers (e.g. auth profile completion).
     * Does not enforce JWT ownership — caller must pass the authenticated patient's id only.
     */
    async getIntakeDraftDataForPatientInternal(patientId) {
        await this.ensureAppointmentSeeds();
        const draft = await this.getIntakeDraftByPatientId(patientId);
        return { data: draft?.data ?? {} };
    }
    async saveIntakeDraftDelta(user, patientId, dto) {
        this.assertDraftWriteAccess(user, patientId);
        const current = await this.getIntakeDraftByPatientId(patientId);
        const currentVersion = current?.draftVersion ?? 0;
        const baseVersion = dto.baseVersion ?? currentVersion;
        if (baseVersion !== currentVersion) {
            throw new common_1.ConflictException({
                code: "DRAFT_VERSION_CONFLICT",
                message: "Draft has changed on another device. Refresh and retry.",
                currentVersion,
            });
        }
        const nextData = {
            ...(current?.data ?? {}),
            ...dto.delta,
        };
        const updatedAt = new Date().toISOString();
        const next = {
            patientId,
            draftVersion: currentVersion + 1,
            data: nextData,
            updatedAt,
            committedAt: current?.committedAt,
        };
        await this.saveIntakeDraft(next);
        if (currentVersion === 0) {
            await this.analyticsService.recordEvent({
                name: "intake_started",
                actorUserId: user.sub,
                actorRole: user.role,
                targetId: patientId,
                idempotencyKey: `intake_started:${patientId}`,
            });
        }
        await this.auditService.recordEvent({
            actorUserId: user.sub,
            actorRole: user.role,
            action: "intake_draft_delta_saved",
            targetType: "booking_request",
            targetId: patientId,
            metadata: {
                draftVersion: next.draftVersion,
            },
        });
        return {
            patientId,
            draftVersion: next.draftVersion,
            updatedAt,
            saved: true,
        };
    }
    async commitIntakeDraft(user, patientId) {
        this.assertDraftWriteAccess(user, patientId);
        const current = await this.getIntakeDraftByPatientId(patientId);
        if (!current) {
            throw new common_1.NotFoundException("Intake draft not found");
        }
        const updatedAt = new Date().toISOString();
        const next = {
            ...current,
            draftVersion: current.draftVersion + 1,
            updatedAt,
            committedAt: updatedAt,
        };
        await this.saveIntakeDraft(next);
        await this.usersService.mergeCommittedIntakeIntoProfile(patientId, next.data);
        await this.analyticsService.recordEvent({
            name: "intake_submitted",
            actorUserId: user.sub,
            actorRole: user.role,
            targetId: patientId,
            idempotencyKey: `intake_submitted:${patientId}`,
            metadata: {
                draftVersion: next.draftVersion,
            },
        });
        await this.auditService.recordEvent({
            actorUserId: user.sub,
            actorRole: user.role,
            action: "intake_draft_committed",
            targetType: "booking_request",
            targetId: patientId,
            metadata: {
                draftVersion: next.draftVersion,
            },
        });
        return {
            patientId,
            draftVersion: next.draftVersion,
            updatedAt,
            saved: true,
        };
    }
    async getIntakeQueue(user, query) {
        this.assertOpsQueueReadAccess(user);
        const queue = [];
        const bookings = await this.listBookingRequests();
        const drafts = await this.listIntakeDrafts();
        for (const booking of bookings) {
            const patientDraft = drafts.find((draft) => draft.patientId === booking.patientId);
            const risk = this.extractRisk(patientDraft);
            const medicareUncertain = this.extractMedicareUncertain(patientDraft);
            const queueItemId = `booking_request:${booking.bookingRequestId}`;
            const assignedClinicianId = await this.getIntakeQueueAssignment(queueItemId);
            queue.push({
                queueItemId,
                sourceType: "booking_request",
                sourceId: booking.bookingRequestId,
                patientId: booking.patientId,
                state: booking.state,
                risk,
                referralStatus: booking.referralDocumentId ? "linked_referral" : "missing_referral",
                medicareUncertain,
                assignedClinicianId,
                updatedAt: booking.updatedAt,
            });
        }
        for (const draft of drafts) {
            if (bookings.some((booking) => booking.patientId === draft.patientId)) {
                continue;
            }
            const queueItemId = `intake_draft:${draft.patientId}`;
            const assignedClinicianId = await this.getIntakeQueueAssignment(queueItemId);
            queue.push({
                queueItemId,
                sourceType: "intake_draft",
                sourceId: draft.patientId,
                patientId: draft.patientId,
                state: draft.committedAt ? "committed" : "draft_in_progress",
                risk: this.extractRisk(draft),
                referralStatus: "missing_referral",
                medicareUncertain: this.extractMedicareUncertain(draft),
                assignedClinicianId,
                updatedAt: draft.updatedAt,
            });
        }
        const filtered = queue.filter((item) => {
            if (query.state && item.state !== query.state)
                return false;
            if (query.risk && item.risk !== query.risk)
                return false;
            if (query.referralStatus && item.referralStatus !== query.referralStatus)
                return false;
            if (query.medicareUncertain && String(item.medicareUncertain) !== query.medicareUncertain)
                return false;
            if (query.assignedClinicianId && item.assignedClinicianId !== query.assignedClinicianId)
                return false;
            if (query.staleHours !== undefined) {
                const staleThreshold = Date.now() - query.staleHours * 60 * 60 * 1000;
                if (new Date(item.updatedAt).getTime() > staleThreshold)
                    return false;
            }
            return true;
        });
        return filtered.sort((a, b) => toMillis(b.updatedAt) - toMillis(a.updatedAt));
    }
    async getAssignableClinicians(user) {
        this.assertOpsQueueReadAccess(user);
        const clinicians = await this.usersService.listPsychologistUsers();
        return clinicians
            .filter((clinician) => clinician.psychologistAdminProfile?.status === "active")
            .map((clinician) => ({
            clinicianId: clinician.id,
            displayName: clinician.displayName,
            specialties: clinician.psychologistAdminProfile?.specialties ?? [],
        }))
            .sort((a, b) => a.displayName.localeCompare(b.displayName));
    }
    async assignIntakeQueueItem(user, queueItemId, assignedClinicianId) {
        this.assertOpsQueueWriteAccess(user);
        const queueItem = (await this.getIntakeQueue(user, {})).find((item) => item.queueItemId === queueItemId);
        if (!queueItem) {
            throw new common_1.NotFoundException("Queue item not found");
        }
        const assignableClinicians = await this.getAssignableClinicians(user);
        if (!assignableClinicians.some((clinician) => clinician.clinicianId === assignedClinicianId)) {
            throw new common_1.BadRequestException("assignedClinicianId must reference an active psychologist");
        }
        await this.saveIntakeQueueAssignment(queueItemId, assignedClinicianId);
        await this.auditService.recordEvent({
            actorUserId: user.sub,
            actorRole: user.role,
            action: "intake_queue_item_assigned",
            targetType: "booking_request",
            targetId: queueItemId,
            metadata: { assignedClinicianId },
        });
        return {
            ...queueItem,
            assignedClinicianId,
        };
    }
    async getPatientJourneyTimeline(user, patientId) {
        await this.assertPatientClinicalReadAccess(user, patientId);
        const events = await this.analyticsService.listEvents();
        const patientEvents = events.filter((event) => event.targetId === patientId || event.actorUserId === patientId);
        const findOccurredAt = (name) => patientEvents.find((event) => event.name === name)?.occurredAt;
        const steps = [
            { key: "intake_started", label: "Intake started", occurredAt: findOccurredAt("intake_started"), status: "pending" },
            { key: "intake_submitted", label: "Intake submitted", occurredAt: findOccurredAt("intake_submitted"), status: "pending" },
            { key: "booking_requested", label: "Booking requested", occurredAt: findOccurredAt("booking_requested"), status: "pending" },
            { key: "booking_confirmed", label: "Booking confirmed", occurredAt: findOccurredAt("booking_confirmed"), status: "pending" },
            { key: "session_started", label: "Session started", occurredAt: findOccurredAt("session_started"), status: "pending" },
            { key: "session_completed", label: "Session completed", occurredAt: findOccurredAt("session_completed"), status: "pending" },
            { key: "session_no_show", label: "Session no-show", occurredAt: findOccurredAt("session_no_show"), status: "pending" },
            {
                key: "invoice_downloaded",
                label: "Invoice downloaded",
                occurredAt: findOccurredAt("invoice_downloaded"),
                status: "pending",
            },
        ];
        const normalizedSteps = steps.map((step) => ({
            ...step,
            status: step.occurredAt ? "done" : "pending",
        }));
        return {
            patientId,
            steps: normalizedSteps,
        };
    }
    async getPatientAppointmentsList(user, patientId) {
        await this.assertPatientClinicalReadAccess(user, patientId);
        await this.ensureAppointmentSeeds();
        const all = await this.listAppointments();
        const mine = all.filter((a) => a.patientId === patientId);
        const nowMs = Date.now();
        const upcoming = [];
        const past = [];
        for (const a of mine) {
            const row = this.toPatientAppointmentSummary(a);
            if (this.isAppointmentPast(a, nowMs)) {
                past.push(row);
            }
            else {
                upcoming.push(row);
            }
        }
        upcoming.sort((x, y) => new Date(x.scheduledStartAt).getTime() - new Date(y.scheduledStartAt).getTime());
        past.sort((x, y) => new Date(y.scheduledStartAt).getTime() - new Date(x.scheduledStartAt).getTime());
        return { upcoming, past };
    }
    async getMoodCheckins(user, patientId, limit = 14) {
        await this.assertPatientClinicalReadAccess(user, patientId);
        const cap = Math.min(Math.max(limit, 1), 100);
        if (this.databaseService.isEnabled()) {
            const rows = await this.prisma.patient_mood_checkins.findMany({
                where: { patient_id: patientId },
                orderBy: { created_at: "desc" },
                take: cap,
            });
            return {
                items: rows.map((row) => ({
                    id: row.checkin_id,
                    moodLabel: row.mood_label,
                    createdAt: row.created_at.toISOString(),
                })),
            };
        }
        const list = [...(this.moodCheckins.get(patientId) ?? [])].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        const items = list.slice(0, cap).map((e) => ({
            id: e.id,
            moodLabel: e.moodLabel,
            createdAt: e.createdAt,
        }));
        return { items };
    }
    async createMoodCheckin(user, patientId, dto) {
        this.assertDraftWriteAccess(user, patientId);
        const moodLabel = dto.moodLabel.trim();
        const createdAt = new Date();
        if (this.databaseService.isEnabled()) {
            const id = `mood_${(0, node_crypto_1.randomUUID)()}`;
            const row = await this.prisma.patient_mood_checkins.create({
                data: {
                    checkin_id: id,
                    patient_id: patientId,
                    mood_label: moodLabel,
                    created_at: createdAt,
                },
            });
            return {
                id: row.checkin_id,
                moodLabel: row.mood_label,
                createdAt: row.created_at.toISOString(),
            };
        }
        const id = `mood_${`${this.moodCheckinCounter++}`.padStart(6, "0")}`;
        const createdAtIso = createdAt.toISOString();
        const record = { id, moodLabel, createdAt: createdAtIso };
        const existing = this.moodCheckins.get(patientId) ?? [];
        this.moodCheckins.set(patientId, [record, ...existing]);
        return { id: record.id, moodLabel: record.moodLabel, createdAt: record.createdAt };
    }
    async getPsychologistPreSessionWorkspace(user, psychologistId, query = {}) {
        const canRead = user.role === "admin" || user.role === "practice_manager" || (user.role === "psychologist" && user.sub === psychologistId);
        if (!canRead) {
            throw new common_1.ForbiddenException("You cannot access this pre-session workspace");
        }
        const clinicianIdForWorkspace = this.resolvePsychologistToClinicianId(psychologistId);
        const appointments = await this.listAppointments();
        const drafts = await this.listIntakeDrafts();
        const referralPatientIds = await this.loadPatientIdsWithReferralDocuments();
        const items = await Promise.all(appointments
            .filter((appointment) => appointment.clinicianId === clinicianIdForWorkspace)
            .map(async (appointment) => {
            const draft = drafts.find((entry) => entry.patientId === appointment.patientId);
            const intakeState = !draft
                ? "missing"
                : draft.committedAt
                    ? "committed"
                    : "draft_in_progress";
            const risk = this.extractRisk(draft);
            const referralStatus = referralPatientIds.has(appointment.patientId)
                ? "linked_referral"
                : "missing_referral";
            const readiness = await this.getTelehealthReadinessRecord(appointment.appointmentId, appointment.patientId);
            const readinessStatus = readiness?.overallStatus ?? "unknown";
            const readinessUpdatedAt = readiness?.updatedAt;
            const actions = [];
            if (intakeState !== "committed")
                actions.push("review_intake");
            if (referralStatus === "missing_referral")
                actions.push("check_referral");
            if (risk === "urgent_support_needed")
                actions.push("risk_escalation");
            if (readinessStatus === "attention" || readinessStatus === "unknown")
                actions.push("review_readiness");
            return {
                appointmentId: appointment.appointmentId,
                patientId: appointment.patientId,
                startsAt: appointment.scheduledStartAt,
                risk,
                referralStatus,
                intakeState,
                readinessStatus,
                readinessUpdatedAt,
                actions,
            };
        }));
        const staleMinutes = query.staleMinutes;
        const staleThreshold = staleMinutes ? Date.now() - staleMinutes * 60 * 1000 : null;
        const filtered = items.filter((item) => {
            if (query.readinessStatus && item.readinessStatus !== query.readinessStatus)
                return false;
            if (staleThreshold !== null) {
                if (!item.readinessUpdatedAt)
                    return true;
                return new Date(item.readinessUpdatedAt).getTime() <= staleThreshold;
            }
            return true;
        });
        const readinessRank = (status) => {
            if (status === "attention")
                return 0;
            if (status === "unknown")
                return 1;
            return 2;
        };
        const sortOrder = query.sortOrder === "desc" ? -1 : 1;
        const sortBy = query.sortBy ?? "startsAt";
        filtered.sort((a, b) => {
            if (sortBy === "readinessStatus")
                return (readinessRank(a.readinessStatus) - readinessRank(b.readinessStatus)) * sortOrder;
            if (sortBy === "readinessUpdatedAt") {
                const aTime = a.readinessUpdatedAt ? new Date(a.readinessUpdatedAt).getTime() : 0;
                const bTime = b.readinessUpdatedAt ? new Date(b.readinessUpdatedAt).getTime() : 0;
                return (aTime - bTime) * sortOrder;
            }
            return (new Date(a.startsAt).getTime() - new Date(b.startsAt).getTime()) * sortOrder;
        });
        return {
            psychologistId,
            items: filtered.slice(0, 20),
        };
    }
    async getPatientSessions(user, patientId) {
        await this.ensureAppointmentSeeds();
        let canRead = (user.role === "patient" && user.sub === patientId) ||
            user.role === "admin" ||
            user.role === "practice_manager";
        if (!canRead && user.role === "psychologist") {
            canRead = await this.psychologistHasCareRelationshipWithPatient(user.sub, patientId);
        }
        if (!canRead) {
            throw new common_1.ForbiddenException("You cannot access this patient's sessions");
        }
        const all = await this.listAppointments();
        let forPatient = all.filter((appointment) => appointment.patientId === patientId);
        if (user.role === "psychologist") {
            const clinicianId = this.resolvePsychologistToClinicianId(user.sub);
            forPatient = forPatient.filter((appointment) => appointment.clinicianId === clinicianId);
        }
        return forPatient
            .sort((a, b) => new Date(b.scheduledStartAt).getTime() - new Date(a.scheduledStartAt).getTime())
            .map((appointment) => this.toSessionSummary(appointment));
    }
    /** Psychologists linked to the patient through appointment history (read-only, patient-facing). */
    async getPatientCareTeam(user) {
        if (user.role !== "patient") {
            throw new common_1.ForbiddenException("Only patients can view their care team");
        }
        await this.ensureAppointmentSeeds();
        const patientId = user.sub;
        const all = await this.listAppointments();
        const mine = all.filter((appointment) => appointment.patientId === patientId);
        const byClinician = new Map();
        for (const appointment of mine) {
            const list = byClinician.get(appointment.clinicianId) ?? [];
            list.push(appointment);
            byClinician.set(appointment.clinicianId, list);
        }
        const now = Date.now();
        const results = [];
        for (const [clinicianId, appts] of byClinician) {
            const psychologistUserId = this.resolveClinicianIdToPsychologistUserId(clinicianId);
            const profileUser = await this.usersService.findById(psychologistUserId);
            const seedName = CLINICIANS.find((c) => c.clinicianId === clinicianId)?.clinicianName;
            const upcoming = appts
                .filter((a) => {
                if (a.status === "in_progress") {
                    return true;
                }
                if (a.status !== "scheduled") {
                    return false;
                }
                return toMillis(a.scheduledStartAt) >= now;
            })
                .sort((a, b) => toMillis(a.scheduledStartAt) - toMillis(b.scheduledStartAt));
            const nextSessionAt = upcoming[0]?.scheduledStartAt;
            const pastOrDone = appts
                .filter((a) => toMillis(a.scheduledStartAt) <= now || ["completed", "cancelled", "no_show"].includes(a.status))
                .sort((a, b) => toMillis(b.scheduledStartAt) - toMillis(a.scheduledStartAt));
            const lastSessionAt = pastOrDone[0]?.scheduledStartAt;
            const prof = profileUser?.psychologistAdminProfile;
            const displayName = profileUser?.displayName ?? seedName ?? clinicianId;
            const accountStatus = prof?.status === "inactive"
                ? "inactive"
                : prof?.status === "active" || profileUser?.role === "psychologist"
                    ? "active"
                    : "unknown";
            results.push({
                clinicianId,
                psychologistUserId,
                displayName,
                registrationNumber: prof?.registrationNumber || undefined,
                providerNumber: prof?.providerNumber || undefined,
                specialties: prof?.specialties ?? [],
                accountStatus,
                nextSessionAt,
                lastSessionAt,
            });
        }
        const enrichIds = results.map((r) => r.psychologistUserId);
        const enrich = await this.loadClinicianPublicEnrichmentByUserIds(enrichIds);
        const merged = results.map((r) => {
            const e = enrich.get(r.psychologistUserId);
            return {
                ...r,
                bio: e?.bio,
                profileImageUrl: this.resolveBookingClinicianPortraitUrl(r.clinicianId, e?.profileImageUrl),
            };
        });
        return merged.sort((a, b) => {
            const aHas = a.nextSessionAt ? 0 : 1;
            const bHas = b.nextSessionAt ? 0 : 1;
            if (aHas !== bHas) {
                return aHas - bHas;
            }
            const at = a.lastSessionAt ? toMillis(a.lastSessionAt) : 0;
            const bt = b.lastSessionAt ? toMillis(b.lastSessionAt) : 0;
            return bt - at;
        });
    }
    async getPsychologistSessions(user, psychologistId) {
        await this.ensureAppointmentSeeds();
        const canRead = (user.role === "psychologist" && user.sub === psychologistId) || user.role === "admin" || user.role === "practice_manager";
        if (!canRead) {
            throw new common_1.ForbiddenException("You cannot access this psychologist's sessions");
        }
        const clinicianId = this.resolvePsychologistToClinicianId(psychologistId);
        const all = await this.listAppointments();
        return all
            .filter((appointment) => appointment.clinicianId === clinicianId)
            .sort((a, b) => new Date(b.scheduledStartAt).getTime() - new Date(a.scheduledStartAt).getTime())
            .map((appointment) => this.toSessionSummary(appointment));
    }
    async getSessionDetail(user, sessionId) {
        await this.ensureAppointmentSeeds();
        const appointment = await this.getAppointmentById(sessionId);
        if (!appointment) {
            throw new common_1.NotFoundException("Session not found");
        }
        const viewerAccessMode = this.resolveSessionViewerMode(user, appointment);
        if (!viewerAccessMode) {
            throw new common_1.ForbiddenException("You cannot access this session");
        }
        return {
            sessionId: appointment.appointmentId,
            patientId: appointment.patientId,
            clinicianId: appointment.clinicianId,
            scheduledStartAt: appointment.scheduledStartAt,
            scheduledEndAt: appointment.scheduledEndAt,
            status: appointment.status,
            sessionTypeLabel: "Clinical psychology consultation",
            viewerAccessMode,
        };
    }
    /** DB profile photo when set; otherwise stable portrait per seeded `clinician_*` for patient recognition. */
    resolveBookingClinicianPortraitUrl(clinicianId, fromDatabase) {
        const trimmed = fromDatabase?.trim();
        if (trimmed) {
            return trimmed;
        }
        return BOOKING_SEED_CLINICIAN_PORTRAIT_URLS[clinicianId];
    }
    /** Loads DB-backed public profile fields keyed by psychologist `users.user_id`. */
    async loadClinicianPublicEnrichmentByUserIds(userIds) {
        const map = new Map();
        if (!this.databaseService.isEnabled() || userIds.length === 0) {
            return map;
        }
        const unique = [...new Set(userIds)];
        const rows = await this.prisma.users.findMany({
            where: { user_id: { in: unique }, role: "psychologist" },
            include: { psychologist_profiles: true },
        });
        const bios = await this.prisma.psychologist_profile_bio.findMany({
            where: { psychologist_id: { in: unique } },
        });
        const bioByUser = new Map(bios.map((b) => [b.psychologist_id, b]));
        for (const row of rows) {
            const prof = row.psychologist_profiles;
            const bioRow = bioByUser.get(row.user_id);
            const bioText = bioRow?.bio?.trim();
            map.set(row.user_id, {
                specialties: prof?.specialties ?? [],
                ...(bioText ? { bio: bioText } : {}),
                ...(bioRow?.profile_image_url?.trim()
                    ? { profileImageUrl: bioRow.profile_image_url.trim() }
                    : {}),
            });
        }
        return map;
    }
    /** Maps auth user id (stub psychologist) to seeded clinician row id for workspace queries. */
    resolvePsychologistToClinicianId(psychologistId) {
        if (psychologistId.startsWith("user_psychologist_")) {
            const suffix = psychologistId.slice("user_psychologist_".length);
            if (/^\d+$/.test(suffix)) {
                return `clinician_${suffix.padStart(3, "0")}`;
            }
        }
        return psychologistId;
    }
    /** Inverse mapping for patient-facing care team (appointments store clinician_* ids). */
    resolveClinicianIdToPsychologistUserId(clinicianId) {
        if (clinicianId.startsWith("user_psychologist_")) {
            return clinicianId;
        }
        if (clinicianId.startsWith("clinician_")) {
            return `user_psychologist_${clinicianId.slice("clinician_".length)}`;
        }
        return clinicianId;
    }
    resolveSessionViewerMode(user, appointment) {
        if (user.role === "admin" || user.role === "practice_manager") {
            return "ops";
        }
        if (user.role === "patient" && user.sub === appointment.patientId) {
            return "owner_patient";
        }
        if (user.role === "psychologist" && this.resolvePsychologistToClinicianId(user.sub) === appointment.clinicianId) {
            return "assigned_psychologist";
        }
        return null;
    }
    toSessionSummary(appointment) {
        return {
            sessionId: appointment.appointmentId,
            scheduledStartAt: appointment.scheduledStartAt,
            scheduledEndAt: appointment.scheduledEndAt,
            status: appointment.status,
            clinicianId: appointment.clinicianId,
            patientId: appointment.patientId,
        };
    }
    async dispatchReadinessReminders(user) {
        this.assertOpsQueueReadAccess(user);
        return this.dispatchReadinessRemindersInternal();
    }
    async dispatchReadinessRemindersAsSystem() {
        return this.dispatchReadinessRemindersInternal();
    }
    async dispatchReadinessRemindersInternal() {
        const appointments = await this.listAppointments();
        const nowMs = Date.now();
        let dispatchedCount = 0;
        let escalatedCount = 0;
        for (const appointment of appointments) {
            if (appointment.status !== "scheduled")
                continue;
            const startsAtMs = new Date(appointment.scheduledStartAt).getTime();
            if (startsAtMs <= nowMs)
                continue;
            const minutesToStart = Math.floor((startsAtMs - nowMs) / 60_000);
            const window = minutesToStart <= 10 ? "T-10" : minutesToStart <= 30 ? "T-30" : null;
            if (!window)
                continue;
            const metadataBase = {
                appointmentId: appointment.appointmentId,
                reminderWindow: window,
            };
            const alreadySent = await this.notificationsService.hasNotificationWithMetadata(appointment.patientId, "session_starting_soon", metadataBase);
            if (!alreadySent) {
                await this.notificationsService.createNotification({
                    recipientUserId: appointment.patientId,
                    recipientRole: "patient",
                    type: "session_starting_soon",
                    title: `Session starts soon (${window})`,
                    body: "Run your readiness checks now to avoid delays joining telehealth.",
                    metadata: {
                        ...metadataBase,
                        deepLink: `/video-session/${appointment.appointmentId}`,
                        ctaPath: `/video-session/${appointment.appointmentId}`,
                    },
                });
                dispatchedCount += 1;
            }
            if (window === "T-10") {
                const readiness = await this.getTelehealthReadinessRecord(appointment.appointmentId, appointment.patientId);
                const needsEscalation = !readiness || readiness.overallStatus === "attention";
                if (needsEscalation) {
                    const escalationMetadata = {
                        appointmentId: appointment.appointmentId,
                        reminderWindow: window,
                        escalation: "readiness_attention",
                    };
                    const escalationSent = await this.notificationsService.hasNotificationWithMetadata(appointment.clinicianId, "session_starting_soon", escalationMetadata);
                    if (!escalationSent) {
                        await this.notificationsService.createNotification({
                            recipientUserId: appointment.clinicianId,
                            recipientRole: "psychologist",
                            type: "session_starting_soon",
                            title: "Patient readiness needs attention (T-10)",
                            body: "Patient checks are still incomplete. Review readiness before session start.",
                            metadata: {
                                ...escalationMetadata,
                                deepLink: `/video-session/${appointment.appointmentId}`,
                                ctaPath: `/video-session/${appointment.appointmentId}`,
                            },
                        });
                        dispatchedCount += 1;
                        escalatedCount += 1;
                    }
                }
            }
        }
        return {
            scannedAppointments: appointments.length,
            dispatchedCount,
            escalatedCount,
        };
    }
    async getOpsInsights(user) {
        this.assertOpsQueueReadAccess(user);
        const queue = await this.getIntakeQueue(user, {});
        const events = await this.analyticsService.listEvents();
        return {
            queueTotal: queue.length,
            urgentRiskCount: queue.filter((item) => item.risk === "urgent_support_needed").length,
            staleQueueCount: queue.filter((item) => Date.now() - new Date(item.updatedAt).getTime() > 24 * 60 * 60 * 1000).length,
            bookingRequestedCount: events.filter((event) => event.name === "booking_requested").length,
            bookingConfirmedCount: events.filter((event) => event.name === "booking_confirmed").length,
            sessionNoShowCount: events.filter((event) => event.name === "session_no_show").length,
        };
    }
    async getTelehealthInsights(user) {
        this.assertOpsQueueReadAccess(user);
        const events = await this.analyticsService.listEvents();
        const appointments = await this.listAppointments();
        const appointmentMap = new Map(appointments.map((item) => [item.appointmentId, item]));
        const now = Date.now();
        const dayMs = 24 * 60 * 60 * 1000;
        const allTime = this.computeTelehealthMetrics(events, appointmentMap);
        const last24h = this.computeTelehealthMetrics(events, appointmentMap, now - dayMs);
        const last7d = this.computeTelehealthMetrics(events, appointmentMap, now - 7 * dayMs);
        const attempts = events.filter((event) => event.name === "join_attempted");
        const warned = events.filter((event) => event.name === "join_warned");
        const failed = events.filter((event) => event.name === "join_failed");
        const success = events.filter((event) => event.name === "join_success");
        const clinicianBuckets = new Map();
        const ensureBucket = (clinicianId) => {
            const existing = clinicianBuckets.get(clinicianId);
            if (existing)
                return existing;
            const created = {
                totalJoinAttempts: 0,
                warnedJoinCount: 0,
                failedJoinCount: 0,
                warnedTargets: new Set(),
                successfulTargets: new Set(),
            };
            clinicianBuckets.set(clinicianId, created);
            return created;
        };
        for (const event of attempts) {
            const appointment = appointmentMap.get(event.targetId);
            if (!appointment)
                continue;
            ensureBucket(appointment.clinicianId).totalJoinAttempts += 1;
        }
        for (const event of warned) {
            const appointment = appointmentMap.get(event.targetId);
            if (!appointment)
                continue;
            const bucket = ensureBucket(appointment.clinicianId);
            bucket.warnedJoinCount += 1;
            bucket.warnedTargets.add(event.targetId);
        }
        for (const event of failed) {
            const appointment = appointmentMap.get(event.targetId);
            if (!appointment)
                continue;
            ensureBucket(appointment.clinicianId).failedJoinCount += 1;
        }
        for (const event of success) {
            const appointment = appointmentMap.get(event.targetId);
            if (!appointment)
                continue;
            ensureBucket(appointment.clinicianId).successfulTargets.add(event.targetId);
        }
        const clinicianBreakdown = [...clinicianBuckets.entries()]
            .map(([clinicianId, bucket]) => {
            let recovered = 0;
            for (const targetId of bucket.warnedTargets) {
                if (bucket.successfulTargets.has(targetId))
                    recovered += 1;
            }
            return {
                clinicianId,
                totalJoinAttempts: bucket.totalJoinAttempts,
                warnedJoinCount: bucket.warnedJoinCount,
                warnedJoinRate: bucket.totalJoinAttempts === 0 ? 0 : Math.round((bucket.warnedJoinCount / bucket.totalJoinAttempts) * 100),
                failedJoinCount: bucket.failedJoinCount,
                recoveryRate: bucket.warnedTargets.size === 0 ? 0 : Math.round((recovered / bucket.warnedTargets.size) * 100),
            };
        })
            .sort((a, b) => b.totalJoinAttempts - a.totalJoinAttempts);
        return {
            ...allTime,
            last24h,
            last7d,
            clinicianBreakdown,
        };
    }
    computeTelehealthMetrics(events, appointmentMap, sinceMs) {
        const scoped = sinceMs ? events.filter((event) => new Date(event.occurredAt).getTime() >= sinceMs) : events;
        const joinAttempts = scoped.filter((event) => event.name === "join_attempted");
        const warned = scoped.filter((event) => event.name === "join_warned");
        const failed = scoped.filter((event) => event.name === "join_failed");
        const success = scoped.filter((event) => event.name === "join_success");
        const successByTarget = new Set(success.map((event) => event.targetId));
        const lateJoinCount = success.filter((event) => {
            const appointment = appointmentMap.get(event.targetId);
            if (!appointment)
                return false;
            const startMs = new Date(appointment.scheduledStartAt).getTime();
            const joinedMs = new Date(event.occurredAt).getTime();
            return joinedMs >= startMs - 5 * 60_000;
        }).length;
        const totalJoinAttempts = joinAttempts.length;
        const warnedJoinCount = warned.length;
        const warnedJoinRate = totalJoinAttempts === 0 ? 0 : Math.round((warnedJoinCount / totalJoinAttempts) * 100);
        const failedJoinCount = failed.length;
        const warnedTargets = new Set(warned.map((event) => event.targetId));
        let recovered = 0;
        for (const targetId of warnedTargets) {
            if (successByTarget.has(targetId))
                recovered += 1;
        }
        const recoveryRate = warnedTargets.size === 0 ? 0 : Math.round((recovered / warnedTargets.size) * 100);
        return {
            totalJoinAttempts,
            warnedJoinCount,
            warnedJoinRate,
            failedJoinCount,
            lateJoinCount,
            recoveryRate,
        };
    }
    resolveClinicians(clinicianId) {
        if (!clinicianId) {
            return CLINICIANS;
        }
        const selected = CLINICIANS.filter((clinician) => clinician.clinicianId === clinicianId);
        if (selected.length === 0) {
            throw new common_1.NotFoundException("Clinician not found");
        }
        return selected;
    }
    buildSlots(startDate, endDate, clinicianId) {
        const slots = [];
        const current = new Date(startDate);
        while (current <= endDate) {
            const day = current.getUTCDay();
            if (day >= 1 && day <= 5) {
                const date = current.toISOString().slice(0, 10);
                for (const time of ["09:00", "10:00", "14:00", "16:00"]) {
                    slots.push({
                        slotId: `${clinicianId}_${date}_${time.replace(":", "")}`,
                        date,
                        startTime: time,
                        endTime: this.plusFiftyMinutes(time),
                        available: true,
                    });
                }
            }
            current.setUTCDate(current.getUTCDate() + 1);
        }
        return slots;
    }
    plusFiftyMinutes(time) {
        const [hour, minute] = time.split(":").map(Number);
        const total = hour * 60 + minute + 50;
        const endHour = Math.floor(total / 60)
            .toString()
            .padStart(2, "0");
        const endMinute = (total % 60).toString().padStart(2, "0");
        return `${endHour}:${endMinute}`;
    }
    assertValidTimezone(timezone) {
        try {
            new Intl.DateTimeFormat("en-AU", {
                timeZone: timezone,
            }).format(new Date("2026-01-01T00:00:00Z"));
        }
        catch {
            throw new common_1.BadRequestException("Invalid timezone");
        }
    }
    async assertSlotExists(clinicianId, slotId, date, timezone) {
        const availability = await this.getClinicianAvailability({
            startDate: date,
            endDate: date,
            clinicianId,
            timezone,
        });
        const slots = availability[0]?.slots ?? [];
        const exists = slots.some((slot) => slot.slotId === slotId && slot.available);
        if (!exists) {
            throw new common_1.ConflictException("Selected slot is no longer available");
        }
    }
    getNextActionForState(state) {
        if (state === "submitted") {
            return "Your request is in triage queue.";
        }
        if (state === "triage_review") {
            return "Care team is reviewing your intake.";
        }
        if (state === "matched_pending_confirmation") {
            return "Please confirm your matched appointment.";
        }
        return "Appointment is confirmed.";
    }
    getWindowReason(status, appointmentStatus) {
        if (status === "locked") {
            return "Chat opens 30 minutes before session start.";
        }
        if (status === "open") {
            return "Chat is open for pre-session coordination.";
        }
        if (appointmentStatus === "cancelled") {
            return "Chat is closed because appointment was cancelled.";
        }
        if (appointmentStatus === "no_show") {
            return "Chat is closed after no-show timeout.";
        }
        return "Chat window has closed for this appointment.";
    }
    toAppointmentDetails(user, appointment) {
        const canManage = (user.role === "patient" && user.sub === appointment.patientId) ||
            user.role === "admin" ||
            user.role === "practice_manager";
        const chatWindowStatus = this.computeWindowStatus(appointment);
        return {
            appointmentId: appointment.appointmentId,
            patientId: appointment.patientId,
            clinicianId: appointment.clinicianId,
            scheduledStartAt: appointment.scheduledStartAt,
            scheduledEndAt: appointment.scheduledEndAt,
            status: appointment.status,
            chatWindowStatus,
            canJoinNow: chatWindowStatus === "open",
            canManage,
        };
    }
    async getAuthorizedAppointment(user, appointmentId) {
        await this.ensureAppointmentSeeds();
        const appointment = await this.getAppointmentById(appointmentId);
        if (!appointment) {
            throw new common_1.NotFoundException("Appointment not found");
        }
        const canViewAll = user.role === "admin" || user.role === "practice_manager" || user.role === "psychologist";
        if (!canViewAll && appointment.patientId !== user.sub) {
            throw new common_1.ForbiddenException("You cannot access this appointment window");
        }
        return appointment;
    }
    computeWindowStatus(appointment) {
        const now = new Date();
        const openAt = new Date(appointment.chatWindowOpenAt);
        const closeAt = new Date(appointment.chatWindowCloseAt);
        if (appointment.status === "cancelled" || appointment.status === "completed" || appointment.status === "no_show") {
            return "closed";
        }
        if (now >= closeAt) {
            return "closed";
        }
        if (now >= openAt) {
            return "open";
        }
        return "locked";
    }
    async recordAuditEvent(action, appointmentId, actorId) {
        await this.auditService.recordEvent({
            actorUserId: actorId,
            actorRole: "system",
            action,
            targetType: "appointment",
            targetId: appointmentId,
            metadata: {
                appointmentId,
            },
        });
    }
    resolveClinicianDisplayName(clinicianId) {
        const c = CLINICIANS.find((entry) => entry.clinicianId === clinicianId);
        return c ? `Dr. ${c.clinicianName}` : "Clinician";
    }
    formatAppointmentStatusLabel(status) {
        const labels = {
            scheduled: "Scheduled",
            in_progress: "In progress",
            completed: "Completed",
            cancelled: "Cancelled",
            no_show: "No-show",
        };
        return labels[status] ?? status;
    }
    isAppointmentPast(appointment, nowMs) {
        if (appointment.status === "completed" || appointment.status === "cancelled" || appointment.status === "no_show") {
            return true;
        }
        if (appointment.status === "in_progress") {
            return false;
        }
        return new Date(appointment.scheduledEndAt).getTime() < nowMs;
    }
    toPatientAppointmentSummary(appointment) {
        return {
            appointmentId: appointment.appointmentId,
            clinicianId: appointment.clinicianId,
            clinicianName: this.resolveClinicianDisplayName(appointment.clinicianId),
            sessionTypeLabel: "Clinical psychology consultation",
            scheduledStartAt: appointment.scheduledStartAt,
            scheduledEndAt: appointment.scheduledEndAt,
            status: appointment.status,
            statusLabel: this.formatAppointmentStatusLabel(appointment.status),
        };
    }
    async assertPatientClinicalReadAccess(user, patientId) {
        if (user.role === "admin" || user.role === "practice_manager") {
            return;
        }
        if (user.role === "patient") {
            if (user.sub !== patientId) {
                throw new common_1.ForbiddenException("You cannot access this intake draft");
            }
            return;
        }
        if (user.role === "psychologist") {
            const allowed = await this.psychologistHasCareRelationshipWithPatient(user.sub, patientId);
            if (!allowed) {
                throw new common_1.ForbiddenException("You cannot access this patient's records without a scheduled care relationship.");
            }
            return;
        }
        throw new common_1.ForbiddenException("You cannot access this intake draft");
    }
    /** True when this clinician has at least one appointment with the patient (any status). */
    async psychologistHasCareRelationshipWithPatient(psychologistUserId, patientId) {
        await this.ensureAppointmentSeeds();
        const clinicianId = this.resolvePsychologistToClinicianId(psychologistUserId);
        const all = await this.listAppointments();
        return all.some((a) => a.patientId === patientId && a.clinicianId === clinicianId);
    }
    async loadPatientIdsWithReferralDocuments() {
        if (!this.databaseService.isEnabled()) {
            return new Set();
        }
        const rows = await this.prisma.referral_documents.findMany({
            select: { patient_id: true },
        });
        return new Set(rows.map((r) => r.patient_id));
    }
    assertDraftWriteAccess(user, patientId) {
        if (user.role !== "patient" || user.sub !== patientId) {
            throw new common_1.ForbiddenException("Only the owner patient can update this intake draft");
        }
    }
    assertOpsQueueReadAccess(user) {
        if (user.role !== "admin" && user.role !== "practice_manager") {
            throw new common_1.ForbiddenException("Only admin and practice_manager can access intake queue");
        }
    }
    assertOpsQueueWriteAccess(user) {
        if (user.role !== "admin" && user.role !== "practice_manager") {
            throw new common_1.ForbiddenException("Only admin and practice_manager can assign intake queue items");
        }
    }
    extractRisk(draft) {
        const value = this.pickFromNestedString(draft?.data, "careContext", "riskFlag");
        return value === "urgent_support_needed" ? "urgent_support_needed" : "none";
    }
    extractMedicareUncertain(draft) {
        const hasMhtp = this.pickFromNestedString(draft?.data, "medicarePath", "hasMhtp");
        return hasMhtp === "unsure";
    }
    assertOverrideRole(user, overrideReason) {
        if (!overrideReason)
            return;
        if (user.role !== "psychologist" && user.role !== "admin") {
            throw new common_1.ForbiddenException("Only clinicians or admin can send override reason");
        }
    }
    async evaluateJoinDecision(appointment) {
        const windowStatus = this.computeWindowStatus(appointment);
        const readiness = await this.getTelehealthReadinessRecord(appointment.appointmentId, appointment.patientId);
        const readinessStatus = readiness?.overallStatus ?? "unknown";
        const reasons = [];
        if (windowStatus === "locked")
            reasons.push("session_window_locked");
        if (windowStatus === "closed")
            reasons.push("session_window_closed");
        if (readinessStatus === "attention")
            reasons.push("readiness_attention");
        if (readinessStatus === "unknown")
            reasons.push("readiness_unknown");
        return {
            allowed: windowStatus === "open",
            readinessStatus,
            windowStatus,
            reasons,
        };
    }
    pickFromNestedString(source, section, key) {
        if (!source || typeof source !== "object") {
            return undefined;
        }
        const scoped = source[section];
        if (!scoped || typeof scoped !== "object") {
            return undefined;
        }
        const value = scoped[key];
        return typeof value === "string" ? value : undefined;
    }
    async ensureAppointmentSeeds() {
        if (!this.databaseService.isEnabled()) {
            return;
        }
        if (!this.seedPromise) {
            this.seedPromise = this.seedAppointmentsInDatabase();
        }
        await this.seedPromise;
    }
    async seedAppointmentsInDatabase() {
        const count = await this.prisma.appointments.count();
        if (count > 0) {
            return;
        }
        for (const appointment of this.appointments.values()) {
            await this.saveAppointment(appointment);
        }
    }
    async getBookingRequestById(bookingRequestId) {
        if (!this.databaseService.isEnabled()) {
            return this.bookingRequests.get(bookingRequestId);
        }
        const row = await this.prisma.booking_requests.findUnique({
            where: { booking_request_id: bookingRequestId },
        });
        if (!row)
            return undefined;
        return {
            bookingRequestId: row.booking_request_id,
            patientId: row.patient_id,
            clinicianId: row.clinician_id,
            slotId: row.slot_id,
            appointmentDate: row.appointment_date.toISOString().slice(0, 10),
            referralDocumentId: row.referral_document_id,
            timezone: row.timezone,
            notes: row.notes,
            state: row.state,
            createdAt: row.created_at.toISOString(),
            updatedAt: row.updated_at.toISOString(),
        };
    }
    async listBookingRequests() {
        if (!this.databaseService.isEnabled()) {
            return [...this.bookingRequests.values()];
        }
        const rows = await this.prisma.booking_requests.findMany();
        return rows.map((row) => ({
            bookingRequestId: row.booking_request_id,
            patientId: row.patient_id,
            clinicianId: row.clinician_id,
            slotId: row.slot_id,
            appointmentDate: row.appointment_date.toISOString().slice(0, 10),
            referralDocumentId: row.referral_document_id,
            timezone: row.timezone,
            notes: row.notes,
            state: row.state,
            createdAt: row.created_at.toISOString(),
            updatedAt: row.updated_at.toISOString(),
        }));
    }
    async saveBookingRequest(record) {
        if (!this.databaseService.isEnabled()) {
            this.bookingRequests.set(record.bookingRequestId, record);
            return;
        }
        const ad = new Date(record.appointmentDate);
        const data = {
            patient_id: record.patientId,
            clinician_id: record.clinicianId,
            slot_id: record.slotId,
            appointment_date: ad,
            referral_document_id: record.referralDocumentId,
            timezone: record.timezone,
            notes: record.notes,
            state: record.state,
            created_at: new Date(record.createdAt),
            updated_at: new Date(record.updatedAt),
        };
        await this.prisma.booking_requests.upsert({
            where: { booking_request_id: record.bookingRequestId },
            create: { booking_request_id: record.bookingRequestId, ...data },
            update: data,
        });
    }
    async saveIdempotency(idempotencyKey, bookingRequestId) {
        if (!this.databaseService.isEnabled()) {
            this.idempotency.set(idempotencyKey, bookingRequestId);
            return;
        }
        await this.prisma.booking_idempotency.upsert({
            where: { idempotency_key: idempotencyKey },
            create: { idempotency_key: idempotencyKey, booking_request_id: bookingRequestId },
            update: { booking_request_id: bookingRequestId },
        });
    }
    async getIdempotencyBookingId(idempotencyKey) {
        if (!this.databaseService.isEnabled()) {
            return this.idempotency.get(idempotencyKey);
        }
        const row = await this.prisma.booking_idempotency.findUnique({
            where: { idempotency_key: idempotencyKey },
        });
        return row?.booking_request_id;
    }
    async findActiveBookingForSlot(clinicianId, slotId, appointmentDate) {
        if (!this.databaseService.isEnabled()) {
            return [...this.bookingRequests.values()].find((item) => item.clinicianId === clinicianId &&
                item.slotId === slotId &&
                item.appointmentDate === appointmentDate &&
                item.state !== "appointment_confirmed");
        }
        const hit = await this.prisma.booking_requests.findFirst({
            where: {
                clinician_id: clinicianId,
                slot_id: slotId,
                appointment_date: new Date(appointmentDate),
                state: { not: "appointment_confirmed" },
            },
        });
        const id = hit?.booking_request_id;
        return id ? this.getBookingRequestById(id) : undefined;
    }
    async getAppointmentById(appointmentId) {
        if (!this.databaseService.isEnabled()) {
            return this.appointments.get(appointmentId);
        }
        const row = await this.prisma.appointments.findUnique({
            where: { appointment_id: appointmentId },
        });
        if (!row)
            return undefined;
        return {
            appointmentId: row.appointment_id,
            patientId: row.patient_id,
            clinicianId: row.clinician_id,
            scheduledStartAt: row.scheduled_start_at.toISOString(),
            scheduledEndAt: row.scheduled_end_at.toISOString(),
            status: row.status,
            chatWindowOpenAt: row.chat_window_open_at.toISOString(),
            chatWindowCloseAt: row.chat_window_close_at.toISOString(),
        };
    }
    async saveAppointment(record) {
        if (!this.databaseService.isEnabled()) {
            this.appointments.set(record.appointmentId, record);
            return;
        }
        const data = {
            patient_id: record.patientId,
            clinician_id: record.clinicianId,
            scheduled_start_at: new Date(record.scheduledStartAt),
            scheduled_end_at: new Date(record.scheduledEndAt),
            status: record.status,
            chat_window_open_at: new Date(record.chatWindowOpenAt),
            chat_window_close_at: new Date(record.chatWindowCloseAt),
        };
        await this.prisma.appointments.upsert({
            where: { appointment_id: record.appointmentId },
            create: { appointment_id: record.appointmentId, ...data },
            update: data,
        });
    }
    async listAppointments() {
        if (!this.databaseService.isEnabled()) {
            return [...this.appointments.values()];
        }
        const rows = await this.prisma.appointments.findMany({
            orderBy: { scheduled_start_at: "asc" },
        });
        return rows.map((row) => ({
            appointmentId: row.appointment_id,
            patientId: row.patient_id,
            clinicianId: row.clinician_id,
            scheduledStartAt: row.scheduled_start_at.toISOString(),
            scheduledEndAt: row.scheduled_end_at.toISOString(),
            status: row.status,
            chatWindowOpenAt: row.chat_window_open_at.toISOString(),
            chatWindowCloseAt: row.chat_window_close_at.toISOString(),
        }));
    }
    async getIntakeDraftByPatientId(patientId) {
        if (!this.databaseService.isEnabled()) {
            return this.intakeDrafts.get(patientId);
        }
        const row = await this.prisma.intake_drafts.findUnique({
            where: { patient_id: patientId },
        });
        if (!row)
            return undefined;
        return {
            patientId: row.patient_id,
            draftVersion: row.draft_version,
            data: row.data ?? {},
            updatedAt: row.updated_at.toISOString(),
            committedAt: row.committed_at ? row.committed_at.toISOString() : undefined,
        };
    }
    async listIntakeDrafts() {
        if (!this.databaseService.isEnabled()) {
            return [...this.intakeDrafts.values()];
        }
        const rows = await this.prisma.intake_drafts.findMany();
        return rows.map((row) => ({
            patientId: row.patient_id,
            draftVersion: row.draft_version,
            data: row.data ?? {},
            updatedAt: row.updated_at.toISOString(),
            committedAt: row.committed_at ? row.committed_at.toISOString() : undefined,
        }));
    }
    async saveIntakeDraft(record) {
        if (!this.databaseService.isEnabled()) {
            this.intakeDrafts.set(record.patientId, record);
            return;
        }
        await this.prisma.intake_drafts.upsert({
            where: { patient_id: record.patientId },
            create: {
                patient_id: record.patientId,
                draft_version: record.draftVersion,
                data: (record.data ?? {}),
                updated_at: new Date(record.updatedAt),
                committed_at: record.committedAt ? new Date(record.committedAt) : null,
            },
            update: {
                draft_version: record.draftVersion,
                data: (record.data ?? {}),
                updated_at: new Date(record.updatedAt),
                committed_at: record.committedAt ? new Date(record.committedAt) : null,
            },
        });
    }
    nextChatMessageId() {
        if (this.databaseService.isEnabled()) {
            return `msg_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
        }
        return `msg_${`${this.chatMessageCounter++}`.padStart(6, "0")}`;
    }
    async saveChatMessage(message) {
        if (!this.databaseService.isEnabled()) {
            const existing = this.chatMessages.get(message.appointmentId) ?? [];
            this.chatMessages.set(message.appointmentId, [...existing, message]);
            return;
        }
        await this.prisma.chat_messages.create({
            data: {
                message_id: message.messageId,
                appointment_id: message.appointmentId,
                author_user_id: message.authorUserId,
                author_role: message.authorRole,
                message: message.message,
                created_at: new Date(message.createdAt),
            },
        });
    }
    async getChatMessages(appointmentId) {
        if (!this.databaseService.isEnabled()) {
            return [...(this.chatMessages.get(appointmentId) ?? [])];
        }
        const rows = await this.prisma.chat_messages.findMany({
            where: { appointment_id: appointmentId },
            orderBy: { created_at: "asc" },
        });
        return rows.map((row) => ({
            messageId: row.message_id,
            appointmentId: row.appointment_id,
            authorUserId: row.author_user_id,
            authorRole: row.author_role,
            message: row.message,
            createdAt: row.created_at.toISOString(),
        }));
    }
    async addPresenceParticipant(appointmentId, userId) {
        if (!this.databaseService.isEnabled()) {
            const participants = this.chatPresence.get(appointmentId) ?? new Set();
            participants.add(userId);
            this.chatPresence.set(appointmentId, participants);
            return;
        }
        const now = new Date();
        await this.prisma.chat_presence.upsert({
            where: {
                appointment_id_user_id: { appointment_id: appointmentId, user_id: userId },
            },
            create: { appointment_id: appointmentId, user_id: userId, joined_at: now },
            update: { joined_at: now },
        });
    }
    async removePresenceParticipant(appointmentId, userId) {
        if (!this.databaseService.isEnabled()) {
            const participants = this.chatPresence.get(appointmentId);
            if (!participants)
                return;
            participants.delete(userId);
            if (participants.size === 0) {
                this.chatPresence.delete(appointmentId);
            }
            else {
                this.chatPresence.set(appointmentId, participants);
            }
            return;
        }
        await this.prisma.chat_presence.deleteMany({
            where: { appointment_id: appointmentId, user_id: userId },
        });
    }
    async getPresenceParticipants(appointmentId) {
        if (!this.databaseService.isEnabled()) {
            const participants = this.chatPresence.get(appointmentId);
            return participants ? [...participants] : [];
        }
        const rows = await this.prisma.chat_presence.findMany({
            where: { appointment_id: appointmentId },
            orderBy: { joined_at: "asc" },
        });
        return rows.map((row) => row.user_id);
    }
    async getIntakeQueueAssignment(queueItemId) {
        if (!this.databaseService.isEnabled()) {
            return this.intakeQueueAssignments.get(queueItemId);
        }
        const row = await this.prisma.intake_queue_assignments.findUnique({
            where: { queue_item_id: queueItemId },
        });
        return row?.assigned_clinician_id;
    }
    async saveIntakeQueueAssignment(queueItemId, assignedClinicianId) {
        if (!this.databaseService.isEnabled()) {
            this.intakeQueueAssignments.set(queueItemId, assignedClinicianId);
            return;
        }
        const now = new Date();
        await this.prisma.intake_queue_assignments.upsert({
            where: { queue_item_id: queueItemId },
            create: { queue_item_id: queueItemId, assigned_clinician_id: assignedClinicianId, updated_at: now },
            update: { assigned_clinician_id: assignedClinicianId, updated_at: now },
        });
    }
    readinessKey(appointmentId, userId) {
        return `${appointmentId}:${userId}`;
    }
    async getTelehealthReadinessRecord(appointmentId, userId) {
        if (!this.databaseService.isEnabled()) {
            return this.telehealthReadiness.get(this.readinessKey(appointmentId, userId));
        }
        const row = await this.prisma.telehealth_readiness.findUnique({
            where: {
                appointment_id_user_id: { appointment_id: appointmentId, user_id: userId },
            },
        });
        if (!row)
            return undefined;
        return {
            appointmentId: row.appointment_id,
            overallStatus: row.overall_status,
            checks: row.checks ?? [],
            guidance: "Complete checks before joining your telehealth session.",
            updatedAt: row.updated_at.toISOString(),
        };
    }
    async saveTelehealthReadinessRecord(appointmentId, userId, readiness) {
        if (!this.databaseService.isEnabled()) {
            this.telehealthReadiness.set(this.readinessKey(appointmentId, userId), readiness);
            return;
        }
        await this.prisma.telehealth_readiness.upsert({
            where: {
                appointment_id_user_id: { appointment_id: appointmentId, user_id: userId },
            },
            create: {
                appointment_id: appointmentId,
                user_id: userId,
                overall_status: readiness.overallStatus,
                checks: readiness.checks,
                updated_at: new Date(readiness.updatedAt),
            },
            update: {
                overall_status: readiness.overallStatus,
                checks: readiness.checks,
                updated_at: new Date(readiness.updatedAt),
            },
        });
    }
    /**
     * In-memory mode keeps deterministic sequential ids for tests. With PostgreSQL enabled, use random ids so
     * `POST /booking-requests` never collides with existing `br_000001`-style rows from seeds or prior runs.
     */
    allocateBookingRequestId() {
        if (!this.databaseService.isEnabled()) {
            return `br_${`${this.bookingCounter++}`.padStart(6, "0")}`;
        }
        return `br_${(0, node_crypto_1.randomUUID)().replace(/-/g, "")}`;
    }
    async persistBookingBundle(booking, appointment, idempotencyKey) {
        if (!this.databaseService.isEnabled()) {
            await this.saveBookingRequest(booking);
            await this.saveAppointment(appointment);
            if (idempotencyKey) {
                await this.saveIdempotency(idempotencyKey, booking.bookingRequestId);
            }
            return;
        }
        await this.prisma.$transaction(async (tx) => {
            await tx.booking_requests.create({
                data: {
                    booking_request_id: booking.bookingRequestId,
                    patient_id: booking.patientId,
                    clinician_id: booking.clinicianId,
                    slot_id: booking.slotId,
                    appointment_date: new Date(booking.appointmentDate),
                    referral_document_id: booking.referralDocumentId,
                    timezone: booking.timezone,
                    notes: booking.notes,
                    state: booking.state,
                    created_at: new Date(booking.createdAt),
                    updated_at: new Date(booking.updatedAt),
                },
            });
            if (idempotencyKey) {
                await tx.booking_idempotency.create({
                    data: { idempotency_key: idempotencyKey, booking_request_id: booking.bookingRequestId },
                });
            }
            await tx.appointments.create({
                data: {
                    appointment_id: appointment.appointmentId,
                    patient_id: appointment.patientId,
                    clinician_id: appointment.clinicianId,
                    scheduled_start_at: new Date(appointment.scheduledStartAt),
                    scheduled_end_at: new Date(appointment.scheduledEndAt),
                    status: appointment.status,
                    chat_window_open_at: new Date(appointment.chatWindowOpenAt),
                    chat_window_close_at: new Date(appointment.chatWindowCloseAt),
                },
            });
        });
    }
    isUniqueViolation(error, constraintName) {
        if (!error || typeof error !== "object")
            return false;
        const code = error.code;
        const constraint = error.constraint;
        return code === "23505" && constraint === constraintName;
    }
    normalizeToTimezoneDate(input, timezone) {
        const parsed = new Date(input);
        if (Number.isNaN(parsed.getTime())) {
            throw new common_1.BadRequestException("Invalid date range");
        }
        const formatter = new Intl.DateTimeFormat("en-CA", {
            timeZone: timezone,
            year: "numeric",
            month: "2-digit",
            day: "2-digit",
        });
        const parts = formatter.formatToParts(parsed);
        const year = parts.find((part) => part.type === "year")?.value;
        const month = parts.find((part) => part.type === "month")?.value;
        const day = parts.find((part) => part.type === "day")?.value;
        if (!year || !month || !day) {
            throw new common_1.BadRequestException("Invalid date range");
        }
        return new Date(`${year}-${month}-${day}T00:00:00.000Z`);
    }
};
exports.AppointmentsService = AppointmentsService;
exports.AppointmentsService = AppointmentsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [audit_service_1.AuditService,
        analytics_service_1.AnalyticsService,
        notifications_service_1.NotificationsService,
        database_service_1.DatabaseService,
        prisma_service_1.PrismaService,
        twilio_token_service_1.TwilioTokenService,
        users_service_1.UsersService])
], AppointmentsService);
//# sourceMappingURL=appointments.service.js.map