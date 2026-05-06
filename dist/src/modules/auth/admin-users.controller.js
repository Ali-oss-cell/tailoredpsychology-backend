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
exports.AdminUsersController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const audit_service_1 = require("../audit/audit.service");
const users_service_1 = require("../users/users.service");
const current_user_decorator_1 = require("./decorators/current-user.decorator");
const admin_psychologist_user_dto_1 = require("./dto/admin-psychologist-user.dto");
const create_admin_psychologist_user_dto_1 = require("./dto/create-admin-psychologist-user.dto");
const update_admin_psychologist_user_dto_1 = require("./dto/update-admin-psychologist-user.dto");
const jwt_auth_guard_1 = require("./guards/jwt-auth.guard");
let AdminUsersController = class AdminUsersController {
    usersService;
    auditService;
    constructor(usersService, auditService) {
        this.usersService = usersService;
        this.auditService = auditService;
    }
    async listPsychologists(user) {
        this.assertAdmin(user);
        const rows = await this.usersService.listPsychologistUsers();
        return rows.map(toAdminPsychologistDto);
    }
    async createPsychologist(user, dto) {
        this.assertAdmin(user);
        const existing = await this.usersService.findByEmail(dto.email.trim().toLowerCase());
        if (existing) {
            throw new common_1.BadRequestException("A user with this email already exists");
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
    async updatePsychologist(user, id, dto) {
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
    assertAdmin(user) {
        if (user.role !== "admin") {
            throw new common_1.ForbiddenException("Only admin can manage psychologist accounts");
        }
    }
};
exports.AdminUsersController = AdminUsersController;
__decorate([
    (0, common_1.Get)("psychologists"),
    (0, swagger_1.ApiOperation)({ summary: "List psychologist accounts for admin user management" }),
    (0, swagger_1.ApiOkResponse)({ type: [admin_psychologist_user_dto_1.AdminPsychologistUserDto] }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], AdminUsersController.prototype, "listPsychologists", null);
__decorate([
    (0, common_1.Post)("psychologists"),
    (0, swagger_1.ApiOperation)({ summary: "Create psychologist account (invite-style provisioning)" }),
    (0, swagger_1.ApiCreatedResponse)({ type: admin_psychologist_user_dto_1.AdminPsychologistUserDto }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, create_admin_psychologist_user_dto_1.CreateAdminPsychologistUserDto]),
    __metadata("design:returntype", Promise)
], AdminUsersController.prototype, "createPsychologist", null);
__decorate([
    (0, common_1.Patch)("psychologists/:id"),
    (0, swagger_1.ApiOperation)({ summary: "Update psychologist account profile fields and status" }),
    (0, swagger_1.ApiOkResponse)({ type: admin_psychologist_user_dto_1.AdminPsychologistUserDto }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)("id")),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, update_admin_psychologist_user_dto_1.UpdateAdminPsychologistUserDto]),
    __metadata("design:returntype", Promise)
], AdminUsersController.prototype, "updatePsychologist", null);
exports.AdminUsersController = AdminUsersController = __decorate([
    (0, swagger_1.ApiTags)("admin-users"),
    (0, common_1.Controller)("admin/users"),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, swagger_1.ApiBearerAuth)(),
    __metadata("design:paramtypes", [users_service_1.UsersService,
        audit_service_1.AuditService])
], AdminUsersController);
function toAdminPsychologistDto(row) {
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
//# sourceMappingURL=admin-users.controller.js.map