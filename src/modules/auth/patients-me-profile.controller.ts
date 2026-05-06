import { Controller, Get, UseGuards } from "@nestjs/common";
import { ApiBearerAuth, ApiOkResponse, ApiOperation, ApiTags } from "@nestjs/swagger";

import { AuthService } from "./auth.service";
import { CurrentUser } from "./decorators/current-user.decorator";
import { CurrentUserDto } from "./dto/current-user.dto";
import { JwtAuthGuard } from "./guards/jwt-auth.guard";
import type { AuthJwtPayload } from "./interfaces/auth-jwt-payload.interface";

/** Alias for profile discovery; returns the same payload as `GET /auth/me`. */
@ApiTags("patients")
@Controller("patients")
export class PatientsMeProfileController {
  constructor(private readonly authService: AuthService) {}

  @Get("me/profile")
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: "Current user profile (alias of GET /auth/me)" })
  @ApiOkResponse({ type: CurrentUserDto })
  getMeProfile(@CurrentUser() payload: AuthJwtPayload): Promise<CurrentUserDto> {
    return this.authService.getCurrentUser(payload.sub);
  }
}
