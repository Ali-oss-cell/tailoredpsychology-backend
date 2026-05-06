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
Object.defineProperty(exports, "__esModule", { value: true });
exports.AppService = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const database_service_1 = require("./modules/core/database.service");
const prisma_service_1 = require("./modules/prisma/prisma.service");
let AppService = class AppService {
    databaseService;
    configService;
    prismaService;
    constructor(databaseService, configService, prismaService) {
        this.databaseService = databaseService;
        this.configService = configService;
        this.prismaService = prismaService;
    }
    async health() {
        const db = await this.databaseService.getHealthStatus();
        const status = !db.configured || (db.connected && db.migrationsTablePresent) ? "ok" : "degraded";
        let prismaHealth = {
            enabled: Boolean(this.configService.get("DATABASE_URL")?.trim()),
            queryOk: false,
        };
        if (db.configured && db.connected && prismaHealth.enabled) {
            try {
                const userCount = await this.prismaService.users.count();
                prismaHealth = { enabled: true, queryOk: true, userCount };
            }
            catch {
                prismaHealth = { enabled: true, queryOk: false };
            }
        }
        return {
            status,
            timestamp: new Date().toISOString(),
            database: {
                mode: db.configured ? "postgresql" : "in_memory_fallback",
                connected: db.connected,
                migrationsReady: db.migrationsTablePresent,
            },
            prisma: prismaHealth,
            readinessReminders: {
                enabled: this.configService.get("READINESS_REMINDERS_ENABLED") === "true",
                cron: this.configService.get("READINESS_REMINDERS_CRON") ?? "*/5 * * * *",
            },
        };
    }
    version() {
        return {
            service: "clink-backend",
            version: "1.0.0",
        };
    }
};
exports.AppService = AppService;
exports.AppService = AppService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [database_service_1.DatabaseService,
        config_1.ConfigService,
        prisma_service_1.PrismaService])
], AppService);
//# sourceMappingURL=app.service.js.map