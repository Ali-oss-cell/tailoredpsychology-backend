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
exports.AuthService = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const jwt_1 = require("@nestjs/jwt");
const appointments_service_1 = require("../appointments/appointments.service");
const audit_service_1 = require("../audit/audit.service");
const notifications_service_1 = require("../notifications/notifications.service");
const patient_contact_profile_type_1 = require("../users/types/patient-contact-profile.type");
const patient_demographics_type_1 = require("../users/types/patient-demographics.type");
const users_service_1 = require("../users/users.service");
const password_crypto_util_1 = require("./password-crypto.util");
const patient_account_completion_util_1 = require("./patient-account-completion.util");
const consent_lifecycle_service_1 = require("./consent-lifecycle.service");
let AuthService = class AuthService {
    usersService;
    jwtService;
    configService;
    auditService;
    notificationsService;
    appointmentsService;
    consentLifecycleService;
    constructor(usersService, jwtService, configService, auditService, notificationsService, appointmentsService, consentLifecycleService) {
        this.usersService = usersService;
        this.jwtService = jwtService;
        this.configService = configService;
        this.auditService = auditService;
        this.notificationsService = notificationsService;
        this.appointmentsService = appointmentsService;
        this.consentLifecycleService = consentLifecycleService;
    }
    async login(dto) {
        const email = dto.email.trim().toLowerCase();
        const user = await this.usersService.findByEmail(email);
        if (user?.role === "patient" && user.patientRetention?.deletedAt) {
            this.auditService.recordEvent({
                actorUserId: user.id,
                actorRole: user.role,
                action: "auth_login_failed",
                targetType: "auth",
                targetId: user.id,
                metadata: { reason: "account_soft_deleted" },
            });
            throw new common_1.UnauthorizedException("Account is deactivated. Contact support for restore workflow.");
        }
        if (!user || !(await (0, password_crypto_util_1.verifyPassword)(dto.password, user.password))) {
            this.auditService.recordEvent({
                actorUserId: "anonymous",
                actorRole: "system",
                action: "auth_login_failed",
                targetType: "auth",
                targetId: email,
                metadata: { reason: "invalid_credentials" },
            });
            throw new common_1.UnauthorizedException("Invalid credentials");
        }
        this.auditService.recordEvent({
            actorUserId: user.id,
            actorRole: user.role,
            action: "auth_login_succeeded",
            targetType: "auth",
            targetId: user.id,
            metadata: { email: user.email },
        });
        if ((0, password_crypto_util_1.passwordNeedsRehash)(user.password)) {
            const upgraded = await (0, password_crypto_util_1.hashPassword)(dto.password);
            await this.usersService.updatePassword(user.id, upgraded);
            user.password = upgraded;
        }
        return this.issueSession(user);
    }
    async register(dto) {
        const email = dto.email.trim().toLowerCase();
        const displayName = dto.displayName.trim();
        const existing = await this.usersService.findByEmail(email);
        if (existing) {
            throw new common_1.BadRequestException("An account with this email already exists");
        }
        const passwordHash = await (0, password_crypto_util_1.hashPassword)(dto.password);
        const user = await this.usersService.createPatientUser({
            email,
            displayName,
            password: passwordHash,
        });
        this.auditService.recordEvent({
            actorUserId: user.id,
            actorRole: user.role,
            action: "auth_registered",
            targetType: "auth",
            targetId: user.id,
            metadata: { email: user.email },
        });
        try {
            await this.notificationsService.createNotification({
                recipientUserId: user.id,
                recipientRole: user.role,
                type: "account_welcome",
                title: "Welcome to Tailored Psychology",
                body: "Complete a few quick steps: confirm your profile, finish your intake in booking, then you can message your clinic from the dashboard when session chat is available.",
                metadata: { ctaPath: "/patient/dashboard?openNotifications=1" },
            });
        }
        catch {
            // Registration must succeed even if notification delivery fails
        }
        return this.issueSession(user);
    }
    async updateProfile(userId, dto) {
        const user = await this.usersService.findById(userId);
        if (!user) {
            throw new common_1.NotFoundException("User not found");
        }
        const patientPatch = this.toPartialPatientContactPatch(dto.patientContactProfile);
        if (patientPatch && user.role !== "patient") {
            throw new common_1.BadRequestException("Patient contact profile can only be updated for patient accounts.");
        }
        await this.usersService.updateProfile(userId, {
            displayName: dto.displayName.trim(),
            patientContactProfile: user.role === "patient" ? patientPatch : undefined,
        });
        this.auditService.recordEvent({
            actorUserId: user.id,
            actorRole: user.role,
            action: "auth_profile_updated",
            targetType: "auth",
            targetId: user.id,
            metadata: {
                displayName: dto.displayName.trim(),
                ...(patientPatch ? { patientContactProfileKeys: Object.keys(patientPatch).join(",") } : {}),
            },
        });
        const updated = await this.usersService.findById(userId);
        if (!updated) {
            throw new common_1.NotFoundException("User not found");
        }
        return await this.userToCurrentUserDto(updated);
    }
    /** Compatibility endpoint: completion is derived from required intake fields, not toggled here. */
    async completeAccountOnboarding(userId) {
        const user = await this.usersService.findById(userId);
        if (!user) {
            throw new common_1.UnauthorizedException("Session user no longer exists");
        }
        return await this.userToCurrentUserDto(user);
    }
    async changePassword(userId, dto) {
        const user = await this.usersService.findById(userId);
        if (!user) {
            throw new common_1.NotFoundException("User not found");
        }
        if (!(await (0, password_crypto_util_1.verifyPassword)(dto.currentPassword, user.password))) {
            this.auditService.recordEvent({
                actorUserId: user.id,
                actorRole: user.role,
                action: "auth_password_change_failed",
                targetType: "auth",
                targetId: user.id,
                metadata: { reason: "invalid_current_password" },
            });
            throw new common_1.UnauthorizedException("Current password is incorrect");
        }
        if (dto.newPassword === dto.currentPassword) {
            throw new common_1.BadRequestException("New password must differ from current password");
        }
        const newHash = await (0, password_crypto_util_1.hashPassword)(dto.newPassword);
        await this.usersService.updatePassword(userId, newHash);
        this.auditService.recordEvent({
            actorUserId: user.id,
            actorRole: user.role,
            action: "auth_password_changed",
            targetType: "auth",
            targetId: user.id,
            metadata: {},
        });
        return { message: "Password updated. Use the new password on next login." };
    }
    async getCurrentUser(userId) {
        const user = await this.usersService.findById(userId);
        if (!user) {
            throw new common_1.UnauthorizedException("Session user no longer exists");
        }
        this.auditService.recordEvent({
            actorUserId: user.id,
            actorRole: user.role,
            action: "auth_me_requested",
            targetType: "auth",
            targetId: user.id,
        });
        return await this.userToCurrentUserDto(user);
    }
    async getConsentStatus(payload) {
        if (payload.role !== "patient") {
            throw new common_1.BadRequestException("Consent lifecycle is only applicable to patient accounts");
        }
        return this.consentLifecycleService.getStatus(payload.sub);
    }
    async acceptConsent(payload, dto) {
        if (payload.role !== "patient") {
            throw new common_1.BadRequestException("Consent lifecycle is only applicable to patient accounts");
        }
        const status = await this.consentLifecycleService.accept(payload.sub, dto.policyVersion);
        this.auditService.recordEvent({
            actorUserId: payload.sub,
            actorRole: payload.role,
            action: "consent_accepted",
            targetType: "auth",
            targetId: payload.sub,
            metadata: { policyVersion: dto.policyVersion },
        });
        return status;
    }
    async withdrawConsent(payload, dto) {
        if (payload.role !== "patient") {
            throw new common_1.BadRequestException("Consent lifecycle is only applicable to patient accounts");
        }
        const status = await this.consentLifecycleService.withdraw(payload.sub, dto.reason);
        this.auditService.recordEvent({
            actorUserId: payload.sub,
            actorRole: payload.role,
            action: "consent_withdrawn",
            targetType: "auth",
            targetId: payload.sub,
            metadata: { reason: dto.reason },
        });
        return status;
    }
    logout() {
        this.auditService.recordEvent({
            actorUserId: "anonymous",
            actorRole: "system",
            action: "auth_logout_requested",
            targetType: "auth",
            targetId: "session",
        });
        return {
            message: "Logged out. Discard token client-side for Sprint 1.",
            revoked: false,
        };
    }
    /** JWT access TTL; also used to align the HttpOnly `clink_role` cookie so Next.js middleware stays in sync. */
    getAccessTokenTtlSeconds() {
        const ttl = this.configService.get("AUTH_JWT_EXPIRES_IN") ?? "3600s";
        const numeric = Number(ttl.replace(/s$/i, ""));
        return Number.isFinite(numeric) ? numeric : 3600;
    }
    async issueSession(user) {
        const payload = {
            sub: user.id,
            email: user.email,
            role: user.role,
            displayName: user.displayName,
        };
        const accessToken = await this.jwtService.signAsync(payload);
        return {
            accessToken,
            tokenType: "Bearer",
            expiresInSeconds: this.getAccessTokenTtlSeconds(),
            user: await this.userToCurrentUserDto(user),
        };
    }
    async computeAccountSetupComplete(user) {
        if (user.role !== "patient") {
            return true;
        }
        if (user.displayName.trim().length < 2) {
            return false;
        }
        const { data } = await this.appointmentsService.getIntakeDraftDataForPatientInternal(user.id);
        const intakeComplete = (0, patient_account_completion_util_1.isPatientIntakeDataComplete)(data);
        const consentStatus = await this.consentLifecycleService.getStatus(user.id);
        return intakeComplete && !consentStatus.requiresReconsent;
    }
    async userToCurrentUserDto(user) {
        const accountSetupComplete = await this.computeAccountSetupComplete(user);
        const row = {
            id: user.id,
            email: user.email,
            role: user.role,
            displayName: user.displayName,
            accountSetupComplete,
        };
        if (user.role === "patient") {
            row.patientContactProfile = {
                ...(0, patient_contact_profile_type_1.emptyPatientContactProfile)(),
                ...(user.patientContactProfile ?? {}),
            };
            row.patientDemographics = {
                ...(0, patient_demographics_type_1.emptyPatientDemographics)(),
                ...(user.patientDemographics ?? {}),
            };
            row.consentStatus = await this.consentLifecycleService.getStatus(user.id);
        }
        return row;
    }
    toPartialPatientContactPatch(patch) {
        if (!patch) {
            return undefined;
        }
        const out = {};
        if (patch.phoneMobile !== undefined) {
            out.phoneMobile = patch.phoneMobile.trim();
        }
        if (patch.preferredContactMethod !== undefined) {
            out.preferredContactMethod = patch.preferredContactMethod;
        }
        if (patch.accessibilityNotes !== undefined) {
            out.accessibilityNotes = patch.accessibilityNotes.trim();
        }
        if (patch.emergencyContactName !== undefined) {
            out.emergencyContactName = patch.emergencyContactName.trim();
        }
        if (patch.emergencyContactPhone !== undefined) {
            out.emergencyContactPhone = patch.emergencyContactPhone.trim();
        }
        if (patch.emergencyContactRelationship !== undefined) {
            out.emergencyContactRelationship = patch.emergencyContactRelationship.trim();
        }
        return Object.keys(out).length > 0 ? out : undefined;
    }
};
exports.AuthService = AuthService;
exports.AuthService = AuthService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [users_service_1.UsersService,
        jwt_1.JwtService,
        config_1.ConfigService,
        audit_service_1.AuditService,
        notifications_service_1.NotificationsService,
        appointments_service_1.AppointmentsService,
        consent_lifecycle_service_1.ConsentLifecycleService])
], AuthService);
//# sourceMappingURL=auth.service.js.map