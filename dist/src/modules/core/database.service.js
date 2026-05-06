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
var DatabaseService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.DatabaseService = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const client_1 = require("@prisma/client");
const prisma_service_1 = require("../prisma/prisma.service");
/**
 * Database connectivity and health via Prisma Client only (no `$queryRaw`).
 * Domain code should use `PrismaService` model APIs directly.
 */
let DatabaseService = DatabaseService_1 = class DatabaseService {
    configService;
    prisma;
    logger = new common_1.Logger(DatabaseService_1.name);
    /** True when DATABASE_URL is set and Prisma successfully connected during startup. */
    enabled = false;
    constructor(configService, prisma) {
        this.configService = configService;
        this.prisma = prisma;
    }
    async onModuleInit() {
        const databaseUrl = this.configService.get("DATABASE_URL")?.trim();
        if (!databaseUrl) {
            this.logger.warn("DATABASE_URL is not set. Falling back to in-memory stores.");
            this.enabled = false;
            return;
        }
        try {
            await this.ping();
            const migrationsPresent = await this.migrationsTablePresent();
            if (!migrationsPresent) {
                this.logger.warn("No migration state found. Run `npm run db:migrate` before starting production usage.");
            }
            this.enabled = true;
            this.logger.log("PostgreSQL connection ready (Prisma).");
        }
        catch (error) {
            this.logger.error("Failed to reach PostgreSQL via Prisma. In-memory fallback will be used.", error);
            this.enabled = false;
        }
    }
    async ping() {
        await this.prisma.users.findFirst({ take: 1 });
    }
    /** True when `pgmigrations` exists (node-pg-migrate history); empty table still counts. */
    async migrationsTablePresent() {
        try {
            await this.prisma.pgmigrations.findFirst({ take: 1 });
            return true;
        }
        catch (e) {
            if (e instanceof client_1.Prisma.PrismaClientKnownRequestError && e.code === "P2021") {
                return false;
            }
            this.logger.warn("Could not read pgmigrations for migration-state probe.", e);
            return false;
        }
    }
    /**
     * Synchronous gate: true only after a successful Prisma ping at startup (DATABASE_URL set).
     */
    isEnabled() {
        return this.enabled;
    }
    async getHealthStatus() {
        const databaseUrl = this.configService.get("DATABASE_URL")?.trim();
        if (!databaseUrl) {
            return {
                configured: false,
                connected: false,
                migrationsTablePresent: false,
            };
        }
        try {
            await this.ping();
            const migrationsTablePresent = await this.migrationsTablePresent();
            return {
                configured: true,
                connected: true,
                migrationsTablePresent,
            };
        }
        catch {
            return {
                configured: true,
                connected: false,
                migrationsTablePresent: false,
            };
        }
    }
};
exports.DatabaseService = DatabaseService;
exports.DatabaseService = DatabaseService = DatabaseService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [config_1.ConfigService,
        prisma_service_1.PrismaService])
], DatabaseService);
//# sourceMappingURL=database.service.js.map