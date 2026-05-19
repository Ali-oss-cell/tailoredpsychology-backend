import { Body, Controller, Get, Patch, Post, Res, UseGuards } from "@nestjs/common";
import { ApiBearerAuth, ApiOkResponse, ApiOperation, ApiTags } from "@nestjs/swagger";
import type { Response } from "express";

import { AuthService } from "./auth.service";
import { CurrentUser } from "./decorators/current-user.decorator";
import { AuthSessionDto } from "./dto/auth-session.dto";
import { ConsentStatusDto } from "./dto/consent-status.dto";
import { AcceptConsentDto } from "./dto/accept-consent.dto";
import { ChangePasswordDto } from "./dto/change-password.dto";
import { CurrentUserDto } from "./dto/current-user.dto";
import { LoginRequestDto } from "./dto/login-request.dto";
import { RegisterRequestDto } from "./dto/register-request.dto";
import { UpdateProfileDto } from "./dto/update-profile.dto";
import { WithdrawConsentDto } from "./dto/withdraw-consent.dto";
import { ForgotPasswordRequestDto } from "./dto/forgot-password-request.dto";
import { ForgotPasswordResponseDto } from "./dto/forgot-password-response.dto";
import { ResetPasswordRequestDto } from "./dto/reset-password-request.dto";
import { JwtAuthGuard } from "./guards/jwt-auth.guard";
import type { AuthJwtPayload } from "./interfaces/auth-jwt-payload.interface";
import { PasswordResetService } from "./password-reset.service";

@ApiTags("auth")
@Controller("auth")
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly passwordResetService: PasswordResetService,
  ) {}

  /**
   * When the browser UI is on `www.` (or apex) and the API on `api.`, this **must** be the shared parent
   * domain (e.g. `.tailoredpsychology.com.au`). Otherwise `clink_role` is host-only on the API host and the
   * Next.js app never receives it → middleware treats every visit as `guest` and redirects to `/login`.
   */
  private getRoleCookieDomain(): string | undefined {
    const domain = process.env.COOKIE_DOMAIN?.trim();
    return domain && domain.length > 0 ? domain : undefined;
  }

  private setRoleCookie(response: Response, role: string, maxAgeSeconds: number): void {
    response.cookie("clink_role", role, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      domain: this.getRoleCookieDomain(),
      maxAge: maxAgeSeconds * 1000,
    });
  }

  @Post("login")
  @ApiOperation({ summary: "Authenticate user and issue bearer token" })
  @ApiOkResponse({ type: AuthSessionDto })
  async login(@Body() dto: LoginRequestDto, @Res({ passthrough: true }) response: Response): Promise<AuthSessionDto> {
    const session = await this.authService.login(dto);
    this.setRoleCookie(response, session.user.role, session.expiresInSeconds);
    return session;
  }

  @Post("register")
  @ApiOperation({ summary: "Register a new patient account and issue bearer token" })
  @ApiOkResponse({ type: AuthSessionDto })
  async register(@Body() dto: RegisterRequestDto, @Res({ passthrough: true }) response: Response): Promise<AuthSessionDto> {
    const session = await this.authService.register(dto);
    this.setRoleCookie(response, session.user.role, session.expiresInSeconds);
    return session;
  }

  @Post("forgot-password")
  @ApiOperation({ summary: "Request a password reset link (always returns generic success message)" })
  @ApiOkResponse({ type: ForgotPasswordResponseDto })
  forgotPassword(@Body() dto: ForgotPasswordRequestDto): Promise<ForgotPasswordResponseDto> {
    return this.passwordResetService.requestReset(dto.email);
  }

  @Post("reset-password")
  @ApiOperation({ summary: "Complete password reset using token from email link" })
  @ApiOkResponse({
    schema: {
      type: "object",
      properties: {
        message: { type: "string", example: "Password updated. You can sign in with your new password." },
      },
    },
  })
  async resetPassword(@Body() dto: ResetPasswordRequestDto): Promise<{ message: string }> {
    await this.passwordResetService.completeReset(dto.token, dto.newPassword);
    return { message: "Password updated. You can sign in with your new password." };
  }

  @Post("logout")
  @ApiOperation({ summary: "Logout current session (contract-level in Sprint 1)" })
  @ApiOkResponse({
    schema: {
      type: "object",
      properties: {
        message: { type: "string", example: "Logged out. Discard token client-side for Sprint 1." },
        revoked: { type: "boolean", example: false },
      },
    },
  })
  logout(@Res({ passthrough: true }) response: Response): { message: string; revoked: boolean } {
    response.clearCookie("clink_role", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      domain: this.getRoleCookieDomain(),
    });
    return this.authService.logout();
  }

  @Get("me")
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: "Get profile from current bearer token" })
  @ApiOkResponse({ type: CurrentUserDto })
  me(
    @CurrentUser() payload: AuthJwtPayload,
    @Res({ passthrough: true }) response: Response,
  ): Promise<CurrentUserDto> {
    // Refresh role cookie on activity so its Max-Age stays aligned with JWT TTL (helps multi-tab / www + api).
    this.setRoleCookie(response, payload.role, this.authService.getAccessTokenTtlSeconds());
    return this.authService.getCurrentUser(payload.sub);
  }

  @Patch("profile")
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: "Update profile: display name (all roles) and patient contact / accessibility / emergency details (patients)",
  })
  @ApiOkResponse({ type: CurrentUserDto })
  updateProfile(
    @CurrentUser() payload: AuthJwtPayload,
    @Body() dto: UpdateProfileDto,
  ): Promise<CurrentUserDto> {
    return this.authService.updateProfile(payload.sub, dto);
  }

  @Post("onboarding-complete")
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: "Compatibility: returns current user; account completion is derived from required intake data (not toggled here)",
  })
  @ApiOkResponse({ type: CurrentUserDto })
  completeOnboarding(@CurrentUser() payload: AuthJwtPayload): Promise<CurrentUserDto> {
    return this.authService.completeAccountOnboarding(payload.sub);
  }

  @Post("change-password")
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: "Change password for the authenticated user" })
  @ApiOkResponse({
    schema: {
      type: "object",
      properties: {
        message: { type: "string", example: "Password updated. Use the new password on next login." },
      },
    },
  })
  changePassword(
    @CurrentUser() payload: AuthJwtPayload,
    @Body() dto: ChangePasswordDto,
  ): Promise<{ message: string }> {
    return this.authService.changePassword(payload.sub, dto);
  }

  @Get("consents")
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: "Get consent lifecycle status for current user" })
  @ApiOkResponse({ type: ConsentStatusDto })
  getConsentStatus(@CurrentUser() payload: AuthJwtPayload): Promise<ConsentStatusDto> {
    return this.authService.getConsentStatus(payload);
  }

  @Post("consents/accept")
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: "Accept consent policy version for current patient user" })
  @ApiOkResponse({ type: ConsentStatusDto })
  acceptConsent(@CurrentUser() payload: AuthJwtPayload, @Body() dto: AcceptConsentDto): Promise<ConsentStatusDto> {
    return this.authService.acceptConsent(payload, dto);
  }

  @Post("consents/withdraw")
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: "Withdraw current active consent for current patient user" })
  @ApiOkResponse({ type: ConsentStatusDto })
  withdrawConsent(@CurrentUser() payload: AuthJwtPayload, @Body() dto: WithdrawConsentDto): Promise<ConsentStatusDto> {
    return this.authService.withdrawConsent(payload, dto);
  }
}
