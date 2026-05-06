"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AppModule = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const schedule_1 = require("@nestjs/schedule");
const app_controller_1 = require("./app.controller");
const app_service_1 = require("./app.service");
const appointments_module_1 = require("./modules/appointments/appointments.module");
const analytics_module_1 = require("./modules/analytics/analytics.module");
const audit_module_1 = require("./modules/audit/audit.module");
const auth_module_1 = require("./modules/auth/auth.module");
const billing_module_1 = require("./modules/billing/billing.module");
const core_module_1 = require("./modules/core/core.module");
const prisma_module_1 = require("./modules/prisma/prisma.module");
const exports_module_1 = require("./modules/exports/exports.module");
const notifications_module_1 = require("./modules/notifications/notifications.module");
const psychologist_notes_module_1 = require("./modules/psychologist-notes/psychologist-notes.module");
const resources_module_1 = require("./modules/resources/resources.module");
const security_incidents_module_1 = require("./modules/security-incidents/security-incidents.module");
const services_module_1 = require("./modules/services/services.module");
const users_module_1 = require("./modules/users/users.module");
let AppModule = class AppModule {
};
exports.AppModule = AppModule;
exports.AppModule = AppModule = __decorate([
    (0, common_1.Module)({
        imports: [
            config_1.ConfigModule.forRoot({ isGlobal: true }),
            schedule_1.ScheduleModule.forRoot(),
            prisma_module_1.PrismaModule,
            core_module_1.CoreModule,
            auth_module_1.AuthModule,
            users_module_1.UsersModule,
            services_module_1.ServicesModule,
            appointments_module_1.AppointmentsModule,
            analytics_module_1.AnalyticsModule,
            billing_module_1.BillingModule,
            exports_module_1.ExportsModule,
            resources_module_1.ResourcesModule,
            psychologist_notes_module_1.PsychologistNotesModule,
            security_incidents_module_1.SecurityIncidentsModule,
            audit_module_1.AuditModule,
            notifications_module_1.NotificationsModule,
        ],
        controllers: [app_controller_1.AppController],
        providers: [app_service_1.AppService],
    })
], AppModule);
//# sourceMappingURL=app.module.js.map