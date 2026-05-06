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
exports.SecurityIncidentsController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const current_user_decorator_1 = require("../auth/decorators/current-user.decorator");
const jwt_auth_guard_1 = require("../auth/guards/jwt-auth.guard");
const create_security_incident_dto_1 = require("./dto/create-security-incident.dto");
const security_incident_dto_1 = require("./dto/security-incident.dto");
const update_security_incident_dto_1 = require("./dto/update-security-incident.dto");
const security_incidents_service_1 = require("./security-incidents.service");
let SecurityIncidentsController = class SecurityIncidentsController {
    incidentsService;
    constructor(incidentsService) {
        this.incidentsService = incidentsService;
    }
    create(user, dto) {
        return this.incidentsService.create(user, dto);
    }
    list(user) {
        return this.incidentsService.list(user);
    }
    update(user, incidentId, dto) {
        return this.incidentsService.update(user, incidentId, dto);
    }
};
exports.SecurityIncidentsController = SecurityIncidentsController;
__decorate([
    (0, common_1.Post)(),
    (0, swagger_1.ApiOperation)({ summary: "Create security incident register entry (admin only)" }),
    (0, swagger_1.ApiCreatedResponse)({ type: security_incident_dto_1.SecurityIncidentDto }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, create_security_incident_dto_1.CreateSecurityIncidentDto]),
    __metadata("design:returntype", Promise)
], SecurityIncidentsController.prototype, "create", null);
__decorate([
    (0, common_1.Get)(),
    (0, swagger_1.ApiOperation)({ summary: "List security incidents (admin only)" }),
    (0, swagger_1.ApiOkResponse)({ type: [security_incident_dto_1.SecurityIncidentDto] }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], SecurityIncidentsController.prototype, "list", null);
__decorate([
    (0, common_1.Patch)(":id"),
    (0, swagger_1.ApiOperation)({ summary: "Update security incident state (admin only)" }),
    (0, swagger_1.ApiOkResponse)({ type: security_incident_dto_1.SecurityIncidentDto }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)("id")),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, update_security_incident_dto_1.UpdateSecurityIncidentDto]),
    __metadata("design:returntype", Promise)
], SecurityIncidentsController.prototype, "update", null);
exports.SecurityIncidentsController = SecurityIncidentsController = __decorate([
    (0, swagger_1.ApiTags)("security-incidents"),
    (0, common_1.Controller)("admin/security-incidents"),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, swagger_1.ApiBearerAuth)(),
    __metadata("design:paramtypes", [security_incidents_service_1.SecurityIncidentsService])
], SecurityIncidentsController);
//# sourceMappingURL=security-incidents.controller.js.map