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
exports.AnalyticsController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const current_user_decorator_1 = require("../auth/decorators/current-user.decorator");
const jwt_auth_guard_1 = require("../auth/guards/jwt-auth.guard");
const analytics_event_dto_1 = require("./dto/analytics-event.dto");
const create_analytics_event_dto_1 = require("./dto/create-analytics-event.dto");
const analytics_service_1 = require("./analytics.service");
let AnalyticsController = class AnalyticsController {
    analyticsService;
    constructor(analyticsService) {
        this.analyticsService = analyticsService;
    }
    createEvent(user, dto) {
        const payload = {
            ...dto,
            actorUserId: dto.actorUserId || user.sub,
            actorRole: dto.actorRole || user.role,
        };
        return this.analyticsService.recordEvent(payload);
    }
    listEvents(user) {
        if (user.role !== "admin" && user.role !== "practice_manager") {
            throw new common_1.ForbiddenException("Only admin and practice_manager can read analytics events");
        }
        return this.analyticsService.listEvents();
    }
};
exports.AnalyticsController = AnalyticsController;
__decorate([
    (0, common_1.Post)("events"),
    (0, swagger_1.ApiOperation)({ summary: "Record analytics event" }),
    (0, swagger_1.ApiCreatedResponse)({ type: analytics_event_dto_1.AnalyticsEventDto }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, create_analytics_event_dto_1.CreateAnalyticsEventDto]),
    __metadata("design:returntype", Promise)
], AnalyticsController.prototype, "createEvent", null);
__decorate([
    (0, common_1.Get)("events"),
    (0, swagger_1.ApiOperation)({ summary: "List analytics events (ops/admin access)" }),
    (0, swagger_1.ApiOkResponse)({ type: [analytics_event_dto_1.AnalyticsEventDto] }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], AnalyticsController.prototype, "listEvents", null);
exports.AnalyticsController = AnalyticsController = __decorate([
    (0, swagger_1.ApiTags)("analytics"),
    (0, common_1.Controller)("analytics"),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, swagger_1.ApiBearerAuth)(),
    __metadata("design:paramtypes", [analytics_service_1.AnalyticsService])
], AnalyticsController);
//# sourceMappingURL=analytics.controller.js.map