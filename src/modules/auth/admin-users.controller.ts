import { BadRequestException, Body, Controller, ForbiddenException, Get, Param, Patch, Post, UseGuards } from "@nestjs/common";
import { ApiBearerAuth, ApiCreatedResponse, ApiOkResponse, ApiOperation, ApiTags } from "@nestjs/swagger";

import { AuditService } from "../audit/audit.service";
import type { UserRecord } from "../users/entities/user-record";
import { UsersService } from "../users/users.service";
import { CurrentUser } from "./decorators/current-user.decorator";
import { AdminPsychologistUserDto } from "./dto/admin-psychologist-user.dto";
import { CreateAdminPsychologistUserDto } from "./dto/create-admin-psychologist-user.dto";
import { UpdateAdminPsychologistUserDto } from "./dto/update-admin-psychologist-user.dto";
import { JwtAuthGuard } from "./guards/jwt-auth.guard";
import type { AuthJwtPayload } from "./interfaces/auth-jwt-payload.interface";

@ApiTags("admin-users")
@Controller("admin/users")
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class AdminUsersController {
  constructor(
    private readonly usersService: UsersService,
    private readonly auditService: AuditService,
  ) {}

  @Get("psychologists")
  @ApiOperation({ summary: "List psychologist accounts for admin user management" })
  @ApiOkResponse({ type: [AdminPsychologistUserDto] })
  async listPsychologists(@CurrentUser() user: AuthJwtPayload): Promise<AdminPsychologistUserDto[]> {
    this.assertAdmin(user);
    const rows = await this.usersService.listPsychologistUsers();
    return rows.map(toAdminPsychologistDto);
  }

  @Post("psychologists")
  @ApiOperation({ summary: "Create psychologist account (invite-style provisioning)" })
  @ApiCreatedResponse({ type: AdminPsychologistUserDto })
  async createPsychologist(
    @CurrentUser() user: AuthJwtPayload,
    @Body() dto: CreateAdminPsychologistUserDto,
  ): Promise<AdminPsychologistUserDto> {
    this.assertAdmin(user);
    const existing = await this.usersService.findByEmail(dto.email.trim().toLowerCase());
    if (existing) {
      throw new BadRequestException("A user with this email already exists");
    }
    const created = await this.usersService.createPsychologistUser({
      email: dto.email,
      displayName: dto.displayName,
      registrationNumber: dto.registrationNumber,
      providerNumber: dto.providerNumber,
      specialties: dto.specialties,
      status: dto.status ?? "active",
    });
    await this.auditService.recordEvent({
      actorUserId: user.sub,
      actorRole: user.role,
      action: "admin_psychologist_created",
      targetType: "auth",
      targetId: created.id,
      metadata: { email: created.email },
    });
    return toAdminPsychologistDto(created);
  }

  @Patch("psychologists/:id")
  @ApiOperation({ summary: "Update psychologist account profile fields and status" })
  @ApiOkResponse({ type: AdminPsychologistUserDto })
  async updatePsychologist(
    @CurrentUser() user: AuthJwtPayload,
    @Param("id") id: string,
    @Body() dto: UpdateAdminPsychologistUserDto,
  ): Promise<AdminPsychologistUserDto> {
    this.assertAdmin(user);
    const updated = await this.usersService.updatePsychologistUser(id, {
      displayName: dto.displayName,
      registrationNumber: dto.registrationNumber,
      providerNumber: dto.providerNumber,
      specialties: dto.specialties,
      status: dto.status,
    });
    await this.auditService.recordEvent({
      actorUserId: user.sub,
      actorRole: user.role,
      action: "admin_psychologist_updated",
      targetType: "auth",
      targetId: updated.id,
      metadata: { status: updated.psychologistAdminProfile?.status ?? "active" },
    });
    return toAdminPsychologistDto(updated);
  }

  private assertAdmin(user: AuthJwtPayload): void {
    if (user.role !== "admin") {
      throw new ForbiddenException("Only admin can manage psychologist accounts");
    }
  }
}

function toAdminPsychologistDto(row: UserRecord): AdminPsychologistUserDto {
  return {
    id: row.id,
    email: row.email,
    displayName: row.displayName,
    registrationNumber: row.psychologistAdminProfile?.registrationNumber ?? "",
    providerNumber: row.psychologistAdminProfile?.providerNumber ?? "",
    specialties: row.psychologistAdminProfile?.specialties ?? [],
    status: row.psychologistAdminProfile?.status ?? "active",
  };
}
