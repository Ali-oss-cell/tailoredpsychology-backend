import { Injectable } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { DatabaseService } from "./modules/core/database.service";
import { PrismaService } from "./modules/prisma/prisma.service";

@Injectable()
export class AppService {
  constructor(
    private readonly databaseService: DatabaseService,
    private readonly configService: ConfigService,
    private readonly prismaService: PrismaService,
  ) {}

  async health() {
    const db = await this.databaseService.getHealthStatus();
    const status = !db.configured || (db.connected && db.migrationsTablePresent) ? "ok" : "degraded";

    let prismaHealth: { enabled: boolean; queryOk: boolean; userCount?: number } = {
      enabled: Boolean(this.configService.get<string>("DATABASE_URL")?.trim()),
      queryOk: false,
    };
    if (db.configured && db.connected && prismaHealth.enabled) {
      try {
        const userCount = await this.prismaService.users.count();
        prismaHealth = { enabled: true, queryOk: true, userCount };
      } catch {
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
        enabled: this.configService.get<string>("READINESS_REMINDERS_ENABLED") === "true",
        cron: this.configService.get<string>("READINESS_REMINDERS_CRON") ?? "*/5 * * * *",
      },
    };
  }

  version() {
    return {
      service: "clink-backend",
      version: "1.0.0",
    };
  }
}
