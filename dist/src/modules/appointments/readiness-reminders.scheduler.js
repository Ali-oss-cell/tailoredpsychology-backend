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
var ReadinessRemindersScheduler_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.ReadinessRemindersScheduler = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const schedule_1 = require("@nestjs/schedule");
const appointments_service_1 = require("./appointments.service");
let ReadinessRemindersScheduler = ReadinessRemindersScheduler_1 = class ReadinessRemindersScheduler {
    appointmentsService;
    configService;
    logger = new common_1.Logger(ReadinessRemindersScheduler_1.name);
    constructor(appointmentsService, configService) {
        this.appointmentsService = appointmentsService;
        this.configService = configService;
    }
    async dispatchReadinessReminders() {
        const isEnabled = this.configService.get("READINESS_REMINDERS_ENABLED") === "true";
        if (!isEnabled) {
            return;
        }
        try {
            const result = await this.appointmentsService.dispatchReadinessRemindersAsSystem();
            this.logger.log(`Readiness reminders dispatched: scanned=${result.scannedAppointments}, sent=${result.dispatchedCount}, escalated=${result.escalatedCount}`);
        }
        catch (error) {
            const message = error instanceof Error ? error.message : "Unknown error";
            this.logger.error(`Readiness reminder dispatch failed: ${message}`);
        }
    }
};
exports.ReadinessRemindersScheduler = ReadinessRemindersScheduler;
__decorate([
    (0, schedule_1.Cron)(process.env.READINESS_REMINDERS_CRON ?? "*/5 * * * *"),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], ReadinessRemindersScheduler.prototype, "dispatchReadinessReminders", null);
exports.ReadinessRemindersScheduler = ReadinessRemindersScheduler = ReadinessRemindersScheduler_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [appointments_service_1.AppointmentsService,
        config_1.ConfigService])
], ReadinessRemindersScheduler);
//# sourceMappingURL=readiness-reminders.scheduler.js.map