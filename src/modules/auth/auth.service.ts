import {
  BadRequestException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { JwtService } from "@nestjs/jwt";

import { AppointmentsService } from "../appointments/appointments.service";
import { AuditService } from "../audit/audit.service";
import { NotificationsService } from "../notifications/notifications.service";
import type { UserRecord } from "../users/entities/user-record";
import { emptyPatientContactProfile, type PatientContactProfile } from "../users/types/patient-contact-profile.type";
import { emptyPatientDemographics } from "../users/types/patient-demographics.type";
import { UsersService } from "../users/users.service";
import { AuthSessionDto } from "./dto/auth-session.dto";
import { AcceptConsentDto } from "./dto/accept-consent.dto";
import { ChangePasswordDto } from "./dto/change-password.dto";
import { ConsentStatusDto } from "./dto/consent-status.dto";
import { CurrentUserDto } from "./dto/current-user.dto";
import { LoginRequestDto } from "./dto/login-request.dto";
import { RegisterRequestDto } from "./dto/register-request.dto";
import type { PatientContactProfilePatchDto } from "./dto/patient-contact-profile.dto";
import { UpdateProfileDto } from "./dto/update-profile.dto";
import { WithdrawConsentDto } from "./dto/withdraw-consent.dto";
import type { AuthJwtPayload } from "./interfaces/auth-jwt-payload.interface";
import { hashPassword, passwordNeedsRehash, verifyPassword } from "./password-crypto.util";
import { isPatientIntakeDataComplete } from "./patient-account-completion.util";
import { ConsentLifecycleService } from "./consent-lifecycle.service";

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    private readonly auditService: AuditService,
    private readonly notificationsService: NotificationsService,
    private readonly appointmentsService: AppointmentsService,
    private readonly consentLifecycleService: ConsentLifecycleService,
  ) {}

  async login(dto: LoginRequestDto): Promise<AuthSessionDto> {
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
      throw new UnauthorizedException("Account is deactivated. Contact support for restore workflow.");
    }
    if (!user || !(await verifyPassword(dto.password, user.password))) {
      this.auditService.recordEvent({
        actorUserId: "anonymous",
        actorRole: "system",
        action: "auth_login_failed",
        targetType: "auth",
        targetId: email,
        metadata: { reason: "invalid_credentials" },
      });
      throw new UnauthorizedException("Invalid credentials");
    }

    this.auditService.recordEvent({
      actorUserId: user.id,
      actorRole: user.role,
      action: "auth_login_succeeded",
      targetType: "auth",
      targetId: user.id,
      metadata: { email: user.email },
    });
    if (passwordNeedsRehash(user.password)) {
      const upgraded = await hashPassword(dto.password);
      await this.usersService.updatePassword(user.id, upgraded);
      user.password = upgraded;
    }

    return this.issueSession(user);
  }

  async register(dto: RegisterRequestDto): Promise<AuthSessionDto> {
    const email = dto.email.trim().toLowerCase();
    const displayName = dto.displayName.trim();
    const existing = await this.usersService.findByEmail(email);
    if (existing) {
      throw new BadRequestException("An account with this email already exists");
    }

    const passwordHash = await hashPassword(dto.password);
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
    } catch {
      // Registration must succeed even if notification delivery fails
    }

    return this.issueSession(user);
  }

  async updateProfile(userId: string, dto: UpdateProfileDto): Promise<CurrentUserDto> {
    const user = await this.usersService.findById(userId);
    if (!user) {
      throw new NotFoundException("User not found");
    }
    const patientPatch = this.toPartialPatientContactPatch(dto.patientContactProfile);
    if (patientPatch && user.role !== "patient") {
      throw new BadRequestException("Patient contact profile can only be updated for patient accounts.");
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
      throw new NotFoundException("User not found");
    }
    return await this.userToCurrentUserDto(updated);
  }

  /** Compatibility endpoint: completion is derived from required intake fields, not toggled here. */
  async completeAccountOnboarding(userId: string): Promise<CurrentUserDto> {
    const user = await this.usersService.findById(userId);
    if (!user) {
      throw new UnauthorizedException("Session user no longer exists");
    }
    return await this.userToCurrentUserDto(user);
  }

  async changePassword(userId: string, dto: ChangePasswordDto): Promise<{ message: string }> {
    const user = await this.usersService.findById(userId);
    if (!user) {
      throw new NotFoundException("User not found");
    }
    if (!(await verifyPassword(dto.currentPassword, user.password))) {
      this.auditService.recordEvent({
        actorUserId: user.id,
        actorRole: user.role,
        action: "auth_password_change_failed",
        targetType: "auth",
        targetId: user.id,
        metadata: { reason: "invalid_current_password" },
      });
      throw new UnauthorizedException("Current password is incorrect");
    }
    if (dto.newPassword === dto.currentPassword) {
      throw new BadRequestException("New password must differ from current password");
    }
    const newHash = await hashPassword(dto.newPassword);
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

  async getCurrentUser(userId: string): Promise<CurrentUserDto> {
    const user = await this.usersService.findById(userId);
    if (!user) {
      throw new UnauthorizedException("Session user no longer exists");
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

  async getConsentStatus(payload: AuthJwtPayload): Promise<ConsentStatusDto> {
    if (payload.role !== "patient") {
      throw new BadRequestException("Consent lifecycle is only applicable to patient accounts");
    }
    return this.consentLifecycleService.getStatus(payload.sub);
  }

  async acceptConsent(payload: AuthJwtPayload, dto: AcceptConsentDto): Promise<ConsentStatusDto> {
    if (payload.role !== "patient") {
      throw new BadRequestException("Consent lifecycle is only applicable to patient accounts");
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

  async withdrawConsent(payload: AuthJwtPayload, dto: WithdrawConsentDto): Promise<ConsentStatusDto> {
    if (payload.role !== "patient") {
      throw new BadRequestException("Consent lifecycle is only applicable to patient accounts");
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

  logout(): { message: string; revoked: boolean } {
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
  getAccessTokenTtlSeconds(): number {
    const ttl = this.configService.get<string>("AUTH_JWT_EXPIRES_IN") ?? "3600s";
    const numeric = Number(ttl.replace(/s$/i, ""));
    return Number.isFinite(numeric) ? numeric : 3600;
  }

  private async issueSession(user: UserRecord): Promise<AuthSessionDto> {
    const payload: AuthJwtPayload = {
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

  private async computeAccountSetupComplete(user: UserRecord): Promise<boolean> {
    if (user.role !== "patient") {
      return true;
    }
    if (user.displayName.trim().length < 2) {
      return false;
    }
    const { data } = await this.appointmentsService.getIntakeDraftDataForPatientInternal(user.id);
    const intakeComplete = isPatientIntakeDataComplete(data);
    const consentStatus = await this.consentLifecycleService.getStatus(user.id);
    return intakeComplete && !consentStatus.requiresReconsent;
  }

  private async userToCurrentUserDto(user: UserRecord): Promise<CurrentUserDto> {
    const accountSetupComplete = await this.computeAccountSetupComplete(user);
    const row: CurrentUserDto = {
      id: user.id,
      email: user.email,
      role: user.role,
      displayName: user.displayName,
      updatedAt: user.updatedAt,
      accountSetupComplete,
    };
    if (user.role === "patient") {
      row.patientContactProfile = {
        ...emptyPatientContactProfile(),
        ...(user.patientContactProfile ?? {}),
      };
      row.patientDemographics = {
        ...emptyPatientDemographics(),
        ...(user.patientDemographics ?? {}),
      };
      row.consentStatus = await this.consentLifecycleService.getStatus(user.id);
    }
    return row;
  }

  private toPartialPatientContactPatch(
    patch: PatientContactProfilePatchDto | undefined,
  ): Partial<PatientContactProfile> | undefined {
    if (!patch) {
      return undefined;
    }
    const out: Partial<PatientContactProfile> = {};
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
}
