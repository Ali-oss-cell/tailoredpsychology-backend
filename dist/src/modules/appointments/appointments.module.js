"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AppointmentsModule = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const jwt_1 = require("@nestjs/jwt");
const audit_module_1 = require("../audit/audit.module");
const analytics_module_1 = require("../analytics/analytics.module");
const notifications_module_1 = require("../notifications/notifications.module");
const users_module_1 = require("../users/users.module");
const appointments_controller_1 = require("./appointments.controller");
const appointments_gateway_1 = require("./appointments.gateway");
const appointments_service_1 = require("./appointments.service");
const readiness_reminders_scheduler_1 = require("./readiness-reminders.scheduler");
const twilio_token_service_1 = require("./twilio-token.service");
let AppointmentsModule = class AppointmentsModule {
};
exports.AppointmentsModule = AppointmentsModule;
exports.AppointmentsModule = AppointmentsModule = __decorate([
    (0, common_1.Module)({
        imports: [
            audit_module_1.AuditModule,
            analytics_module_1.AnalyticsModule,
            notifications_module_1.NotificationsModule,
            users_module_1.UsersModule,
            jwt_1.JwtModule.registerAsync({
                inject: [config_1.ConfigService],
                useFactory: (configService) => ({
                    secret: configService.get("AUTH_JWT_SECRET") ?? "clink-dev-secret",
                }),
            }),
        ],
        controllers: [appointments_controller_1.AppointmentsController],
        providers: [appointments_service_1.AppointmentsService, appointments_gateway_1.AppointmentsGateway, readiness_reminders_scheduler_1.ReadinessRemindersScheduler, twilio_token_service_1.TwilioTokenService],
        exports: [appointments_service_1.AppointmentsService],
    })
], AppointmentsModule);
//# sourceMappingURL=appointments.module.js.map