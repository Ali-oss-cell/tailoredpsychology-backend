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
exports.AuthController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const auth_service_1 = require("./auth.service");
const current_user_decorator_1 = require("./decorators/current-user.decorator");
const auth_session_dto_1 = require("./dto/auth-session.dto");
const consent_status_dto_1 = require("./dto/consent-status.dto");
const accept_consent_dto_1 = require("./dto/accept-consent.dto");
const change_password_dto_1 = require("./dto/change-password.dto");
const current_user_dto_1 = require("./dto/current-user.dto");
const login_request_dto_1 = require("./dto/login-request.dto");
const register_request_dto_1 = require("./dto/register-request.dto");
const update_profile_dto_1 = require("./dto/update-profile.dto");
const withdraw_consent_dto_1 = require("./dto/withdraw-consent.dto");
const forgot_password_request_dto_1 = require("./dto/forgot-password-request.dto");
const forgot_password_response_dto_1 = require("./dto/forgot-password-response.dto");
const reset_password_request_dto_1 = require("./dto/reset-password-request.dto");
const jwt_auth_guard_1 = require("./guards/jwt-auth.guard");
const password_reset_service_1 = require("./password-reset.service");
let AuthController = class AuthController {
    authService;
    passwordResetService;
    constructor(authService, passwordResetService) {
        this.authService = authService;
        this.passwordResetService = passwordResetService;
    }
    /**
     * When the browser UI is on `www.` (or apex) and the API on `api.`, this **must** be the shared parent
     * domain (e.g. `.tailoredpsychology.com.au`). Otherwise `clink_role` is host-only on the API host and the
     * Next.js app never receives it → middleware treats every visit as `guest` and redirects to `/login`.
     */
    getRoleCookieDomain() {
        const domain = process.env.COOKIE_DOMAIN?.trim();
        return domain && domain.length > 0 ? domain : undefined;
    }
    setRoleCookie(response, role, maxAgeSeconds) {
        response.cookie("clink_role", role, {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: "lax",
            path: "/",
            domain: this.getRoleCookieDomain(),
            maxAge: maxAgeSeconds * 1000,
        });
    }
    async login(dto, response) {
        const session = await this.authService.login(dto);
        this.setRoleCookie(response, session.user.role, session.expiresInSeconds);
        return session;
    }
    async register(dto, response) {
        const session = await this.authService.register(dto);
        this.setRoleCookie(response, session.user.role, session.expiresInSeconds);
        return session;
    }
    forgotPassword(dto) {
        return this.passwordResetService.requestReset(dto.email);
    }
    async resetPassword(dto) {
        await this.passwordResetService.completeReset(dto.token, dto.newPassword);
        return { message: "Password updated. You can sign in with your new password." };
    }
    logout(response) {
        response.clearCookie("clink_role", {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: "lax",
            path: "/",
            domain: this.getRoleCookieDomain(),
        });
        return this.authService.logout();
    }
    me(payload, response) {
        // Refresh role cookie on activity so its Max-Age stays aligned with JWT TTL (helps multi-tab / www + api).
        this.setRoleCookie(response, payload.role, this.authService.getAccessTokenTtlSeconds());
        return this.authService.getCurrentUser(payload.sub);
    }
    updateProfile(payload, dto) {
        return this.authService.updateProfile(payload.sub, dto);
    }
    completeOnboarding(payload) {
        return this.authService.completeAccountOnboarding(payload.sub);
    }
    changePassword(payload, dto) {
        return this.authService.changePassword(payload.sub, dto);
    }
    getConsentStatus(payload) {
        return this.authService.getConsentStatus(payload);
    }
    acceptConsent(payload, dto) {
        return this.authService.acceptConsent(payload, dto);
    }
    withdrawConsent(payload, dto) {
        return this.authService.withdrawConsent(payload, dto);
    }
};
exports.AuthController = AuthController;
__decorate([
    (0, common_1.Post)("login"),
    (0, swagger_1.ApiOperation)({ summary: "Authenticate user and issue bearer token" }),
    (0, swagger_1.ApiOkResponse)({ type: auth_session_dto_1.AuthSessionDto }),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Res)({ passthrough: true })),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [login_request_dto_1.LoginRequestDto, Object]),
    __metadata("design:returntype", Promise)
], AuthController.prototype, "login", null);
__decorate([
    (0, common_1.Post)("register"),
    (0, swagger_1.ApiOperation)({ summary: "Register a new patient account and issue bearer token" }),
    (0, swagger_1.ApiOkResponse)({ type: auth_session_dto_1.AuthSessionDto }),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Res)({ passthrough: true })),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [register_request_dto_1.RegisterRequestDto, Object]),
    __metadata("design:returntype", Promise)
], AuthController.prototype, "register", null);
__decorate([
    (0, common_1.Post)("forgot-password"),
    (0, swagger_1.ApiOperation)({ summary: "Request a password reset link (always returns generic success message)" }),
    (0, swagger_1.ApiOkResponse)({ type: forgot_password_response_dto_1.ForgotPasswordResponseDto }),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [forgot_password_request_dto_1.ForgotPasswordRequestDto]),
    __metadata("design:returntype", Promise)
], AuthController.prototype, "forgotPassword", null);
__decorate([
    (0, common_1.Post)("reset-password"),
    (0, swagger_1.ApiOperation)({ summary: "Complete password reset using token from email link" }),
    (0, swagger_1.ApiOkResponse)({
        schema: {
            type: "object",
            properties: {
                message: { type: "string", example: "Password updated. You can sign in with your new password." },
            },
        },
    }),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [reset_password_request_dto_1.ResetPasswordRequestDto]),
    __metadata("design:returntype", Promise)
], AuthController.prototype, "resetPassword", null);
__decorate([
    (0, common_1.Post)("logout"),
    (0, swagger_1.ApiOperation)({ summary: "Logout current session (contract-level in Sprint 1)" }),
    (0, swagger_1.ApiOkResponse)({
        schema: {
            type: "object",
            properties: {
                message: { type: "string", example: "Logged out. Discard token client-side for Sprint 1." },
                revoked: { type: "boolean", example: false },
            },
        },
    }),
    __param(0, (0, common_1.Res)({ passthrough: true })),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Object)
], AuthController.prototype, "logout", null);
__decorate([
    (0, common_1.Get)("me"),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, swagger_1.ApiBearerAuth)(),
    (0, swagger_1.ApiOperation)({ summary: "Get profile from current bearer token" }),
    (0, swagger_1.ApiOkResponse)({ type: current_user_dto_1.CurrentUserDto }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Res)({ passthrough: true })),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], AuthController.prototype, "me", null);
__decorate([
    (0, common_1.Patch)("profile"),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, swagger_1.ApiBearerAuth)(),
    (0, swagger_1.ApiOperation)({
        summary: "Update profile: display name (all roles) and patient contact / accessibility / emergency details (patients)",
    }),
    (0, swagger_1.ApiOkResponse)({ type: current_user_dto_1.CurrentUserDto }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, update_profile_dto_1.UpdateProfileDto]),
    __metadata("design:returntype", Promise)
], AuthController.prototype, "updateProfile", null);
__decorate([
    (0, common_1.Post)("onboarding-complete"),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, swagger_1.ApiBearerAuth)(),
    (0, swagger_1.ApiOperation)({
        summary: "Compatibility: returns current user; account completion is derived from required intake data (not toggled here)",
    }),
    (0, swagger_1.ApiOkResponse)({ type: current_user_dto_1.CurrentUserDto }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], AuthController.prototype, "completeOnboarding", null);
__decorate([
    (0, common_1.Post)("change-password"),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, swagger_1.ApiBearerAuth)(),
    (0, swagger_1.ApiOperation)({ summary: "Change password for the authenticated user" }),
    (0, swagger_1.ApiOkResponse)({
        schema: {
            type: "object",
            properties: {
                message: { type: "string", example: "Password updated. Use the new password on next login." },
            },
        },
    }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, change_password_dto_1.ChangePasswordDto]),
    __metadata("design:returntype", Promise)
], AuthController.prototype, "changePassword", null);
__decorate([
    (0, common_1.Get)("consents"),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, swagger_1.ApiBearerAuth)(),
    (0, swagger_1.ApiOperation)({ summary: "Get consent lifecycle status for current user" }),
    (0, swagger_1.ApiOkResponse)({ type: consent_status_dto_1.ConsentStatusDto }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], AuthController.prototype, "getConsentStatus", null);
__decorate([
    (0, common_1.Post)("consents/accept"),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, swagger_1.ApiBearerAuth)(),
    (0, swagger_1.ApiOperation)({ summary: "Accept consent policy version for current patient user" }),
    (0, swagger_1.ApiOkResponse)({ type: consent_status_dto_1.ConsentStatusDto }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, accept_consent_dto_1.AcceptConsentDto]),
    __metadata("design:returntype", Promise)
], AuthController.prototype, "acceptConsent", null);
__decorate([
    (0, common_1.Post)("consents/withdraw"),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, swagger_1.ApiBearerAuth)(),
    (0, swagger_1.ApiOperation)({ summary: "Withdraw current active consent for current patient user" }),
    (0, swagger_1.ApiOkResponse)({ type: consent_status_dto_1.ConsentStatusDto }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, withdraw_consent_dto_1.WithdrawConsentDto]),
    __metadata("design:returntype", Promise)
], AuthController.prototype, "withdrawConsent", null);
exports.AuthController = AuthController = __decorate([
    (0, swagger_1.ApiTags)("auth"),
    (0, common_1.Controller)("auth"),
    __metadata("design:paramtypes", [auth_service_1.AuthService,
        password_reset_service_1.PasswordResetService])
], AuthController);
//# sourceMappingURL=auth.controller.js.map