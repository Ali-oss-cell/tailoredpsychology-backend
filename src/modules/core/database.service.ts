import { Injectable, Logger, OnModuleInit } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { Prisma } from "@prisma/client";

import { PrismaService } from "../prisma/prisma.service";

/**
 * Database connectivity and health via Prisma Client only (no `$queryRaw`).
 * Domain code should use `PrismaService` model APIs directly.
 */
@Injectable()
export class DatabaseService implements OnModuleInit {
  private readonly logger = new Logger(DatabaseService.name);
  /** True when DATABASE_URL is set and Prisma successfully connected during startup. */
  private enabled = false;

  constructor(
    private readonly configService: ConfigService,
    private readonly prisma: PrismaService,
  ) {}

  async onModuleInit(): Promise<void> {
    const databaseUrl = this.configService.get<string>("DATABASE_URL")?.trim();
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
    } catch (error) {
      this.logger.error("Failed to reach PostgreSQL via Prisma. In-memory fallback will be used.", error);
      this.enabled = false;
    }
  }

  private async ping(): Promise<void> {
    await this.prisma.users.findFirst({ take: 1 });
  }

  /** True when `pgmigrations` exists (node-pg-migrate history); empty table still counts. */
  private async migrationsTablePresent(): Promise<boolean> {
    try {
      await this.prisma.pgmigrations.findFirst({ take: 1 });
      return true;
    } catch (e) {
      if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2021") {
        return false;
      }
      this.logger.warn("Could not read pgmigrations for migration-state probe.", e);
      return false;
    }
  }

  /**
   * Synchronous gate: true only after a successful Prisma ping at startup (DATABASE_URL set).
   */
  isEnabled(): boolean {
    return this.enabled;
  }

  async getHealthStatus(): Promise<{
    configured: boolean;
    connected: boolean;
    migrationsTablePresent: boolean;
  }> {
    const databaseUrl = this.configService.get<string>("DATABASE_URL")?.trim();
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
    } catch {
      return {
        configured: true,
        connected: false,
        migrationsTablePresent: false,
      };
    }
  }
}
