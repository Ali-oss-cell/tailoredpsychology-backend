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
exports.AuditController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const current_user_decorator_1 = require("../auth/decorators/current-user.decorator");
const jwt_auth_guard_1 = require("../auth/guards/jwt-auth.guard");
const audit_event_dto_1 = require("./dto/audit-event.dto");
const get_audit_events_query_dto_1 = require("./dto/get-audit-events-query.dto");
const audit_service_1 = require("./audit.service");
let AuditController = class AuditController {
    auditService;
    constructor(auditService) {
        this.auditService = auditService;
    }
    async listEvents(user, query) {
        if (user.role !== "admin" && user.role !== "practice_manager") {
            throw new common_1.ForbiddenException("Only admin and practice_manager can read audit events");
        }
        return this.auditService.listEvents(query);
    }
};
exports.AuditController = AuditController;
__decorate([
    (0, common_1.Get)("events"),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, swagger_1.ApiBearerAuth)(),
    (0, swagger_1.ApiOperation)({ summary: "List audit events with optional filters" }),
    (0, swagger_1.ApiOkResponse)({ type: [audit_event_dto_1.AuditEventDto] }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, get_audit_events_query_dto_1.GetAuditEventsQueryDto]),
    __metadata("design:returntype", Promise)
], AuditController.prototype, "listEvents", null);
exports.AuditController = AuditController = __decorate([
    (0, swagger_1.ApiTags)("audit"),
    (0, common_1.Controller)("audit"),
    __metadata("design:paramtypes", [audit_service_1.AuditService])
], AuditController);
//# sourceMappingURL=audit.controller.js.map