"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthModule = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const jwt_1 = require("@nestjs/jwt");
const passport_1 = require("@nestjs/passport");
const appointments_module_1 = require("../appointments/appointments.module");
const analytics_module_1 = require("../analytics/analytics.module");
const audit_module_1 = require("../audit/audit.module");
const notifications_module_1 = require("../notifications/notifications.module");
const users_module_1 = require("../users/users.module");
const auth_controller_1 = require("./auth.controller");
const admin_users_controller_1 = require("./admin-users.controller");
const admin_patient_retention_controller_1 = require("./admin-patient-retention.controller");
const admin_ops_controller_1 = require("./admin-ops.controller");
const patient_data_requests_controller_1 = require("./patient-data-requests.controller");
const auth_service_1 = require("./auth.service");
const consent_lifecycle_service_1 = require("./consent-lifecycle.service");
const patient_data_requests_service_1 = require("./patient-data-requests.service");
const patients_me_profile_controller_1 = require("./patients-me-profile.controller");
const jwt_auth_guard_1 = require("./guards/jwt-auth.guard");
const jwt_strategy_1 = require("./strategies/jwt.strategy");
let AuthModule = class AuthModule {
};
exports.AuthModule = AuthModule;
exports.AuthModule = AuthModule = __decorate([
    (0, common_1.Module)({
        imports: [
            config_1.ConfigModule,
            audit_module_1.AuditModule,
            analytics_module_1.AnalyticsModule,
            appointments_module_1.AppointmentsModule,
            notifications_module_1.NotificationsModule,
            users_module_1.UsersModule,
            passport_1.PassportModule.register({ defaultStrategy: "jwt" }),
            jwt_1.JwtModule.registerAsync({
                inject: [config_1.ConfigService],
                useFactory: (configService) => ({
                    secret: configService.get("AUTH_JWT_SECRET") ?? "clink-dev-secret",
                    signOptions: {
                        expiresIn: Number(configService.get("AUTH_JWT_EXPIRES_IN") ?? "3600"),
                    },
                }),
            }),
        ],
        controllers: [
            auth_controller_1.AuthController,
            patients_me_profile_controller_1.PatientsMeProfileController,
            admin_users_controller_1.AdminUsersController,
            admin_patient_retention_controller_1.AdminPatientRetentionController,
            admin_ops_controller_1.AdminOpsController,
            patient_data_requests_controller_1.PatientDataRequestsController,
        ],
        providers: [auth_service_1.AuthService, consent_lifecycle_service_1.ConsentLifecycleService, patient_data_requests_service_1.PatientDataRequestsService, jwt_strategy_1.JwtStrategy, jwt_auth_guard_1.JwtAuthGuard],
        exports: [auth_service_1.AuthService, jwt_auth_guard_1.JwtAuthGuard],
    })
], AuthModule);
//# sourceMappingURL=auth.module.js.map