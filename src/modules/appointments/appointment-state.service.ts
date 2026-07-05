import { ConflictException, Injectable, Logger, NotFoundException } from "@nestjs/common";
import { randomUUID } from "node:crypto";

import { AnalyticsService } from "../analytics/analytics.service";
import { AuditService } from "../audit/audit.service";
import type { AuthJwtPayload } from "../auth/interfaces/auth-jwt-payload.interface";
import { DatabaseService } from "../core/database.service";
import { PrismaService } from "../prisma/prisma.service";
import type { AppointmentRecord, AppointmentStatus } from "./entities/appointment.record";

export type TransitionActor = {
  userId: string;
  role: AuthJwtPayload["role"] | "system";
};

export type TransitionOptions = {
  reason?: string;
  metadata?: Record<string, string>;
};

export type AppointmentTransitionEvent = {
  appointmentId: string;
  patientId: string;
  clinicianId: string;
  fromStatus: AppointmentStatus;
  toStatus: AppointmentStatus;
  occurredAt: string;
  reason: string;
};

type TransitionListener = (event: AppointmentTransitionEvent) => void;

/**
 * Single source of truth for appointment status changes.
 *
 * - Validates every change against the allowed-transition map (no more ad-hoc
 *   `status = "x"` writes scattered through services).
 * - DB mode: optimistic concurrency via the `version` column inside a
 *   transaction — concurrent join/cancel races lose cleanly with a 409.
 * - Every change writes an `appointment_transitions` history row plus audit
 *   and journey analytics events; listeners (e.g. the websocket gateway) are
 *   notified for real-time propagation.
 */
@Injectable()
export class AppointmentStateService {
  private readonly logger = new Logger(AppointmentStateService.name);
  private readonly listeners: TransitionListener[] = [];
  private memoryStore: Map<string, AppointmentRecord> | null = null;

  static readonly ALLOWED_TRANSITIONS: Record<AppointmentStatus, AppointmentStatus[]> = {
    scheduled: ["in_progress", "cancelled", "no_show"],
    in_progress: ["completed", "cancelled"],
    completed: [],
    cancelled: [],
    no_show: [],
  };

  constructor(
    private readonly databaseService: DatabaseService,
    private readonly prisma: PrismaService,
    private readonly auditService: AuditService,
    private readonly analyticsService: AnalyticsService,
  ) {}

  /** In-memory fallback shares the AppointmentsService record map (dev mode without a DB). */
  attachMemoryStore(store: Map<string, AppointmentRecord>): void {
    this.memoryStore = store;
  }

  onTransition(listener: TransitionListener): void {
    this.listeners.push(listener);
  }

  static canTransition(from: AppointmentStatus, to: AppointmentStatus): boolean {
    return AppointmentStateService.ALLOWED_TRANSITIONS[from]?.includes(to) ?? false;
  }

  async transition(
    appointmentId: string,
    toStatus: AppointmentStatus,
    actor: TransitionActor,
    options: TransitionOptions = {},
  ): Promise<AppointmentRecord> {
    const { record, fromStatus } = this.databaseService.isEnabled()
      ? await this.transitionInDatabase(appointmentId, toStatus, actor, options)
      : this.transitionInMemory(appointmentId, toStatus);

    await this.recordSideEffects(record, fromStatus, toStatus, actor, options);
    return record;
  }

  /**
   * Idempotent variant: if the appointment is already in `toStatus`, return it
   * unchanged instead of throwing. Used for join races (two tabs, two devices).
   */
  async transitionIfNeeded(
    appointmentId: string,
    toStatus: AppointmentStatus,
    actor: TransitionActor,
    options: TransitionOptions = {},
  ): Promise<AppointmentRecord> {
    try {
      return await this.transition(appointmentId, toStatus, actor, options);
    } catch (error) {
      if (error instanceof ConflictException) {
        const current = await this.findRecord(appointmentId);
        if (current?.status === toStatus) return current;
      }
      throw error;
    }
  }

  /**
   * Housekeeping sweep (called from cron):
   * - `scheduled` sessions whose end passed `graceMinutes` ago without a join → `no_show`
   * - `in_progress` sessions past end + `graceMinutes` → `completed`
   */
  async runSweep(nowMs = Date.now(), graceMinutes = 15): Promise<{ noShows: number; completed: number }> {
    const cutoff = new Date(nowMs - graceMinutes * 60 * 1000);
    const candidates = await this.listSweepCandidates(cutoff);
    let noShows = 0;
    let completed = 0;

    for (const record of candidates) {
      try {
        if (record.status === "scheduled") {
          await this.transition(record.appointmentId, "no_show", { userId: "system", role: "system" }, {
            reason: "sweep_no_show_after_grace",
          });
          noShows += 1;
        } else if (record.status === "in_progress") {
          await this.transition(record.appointmentId, "completed", { userId: "system", role: "system" }, {
            reason: "sweep_auto_complete_after_grace",
          });
          completed += 1;
        }
      } catch (error) {
        // A concurrent transition won the race — sweep picks it up next run if still relevant.
        const message = error instanceof Error ? error.message : "unknown";
        this.logger.warn(`Sweep transition skipped for ${record.appointmentId}: ${message}`);
      }
    }

    return { noShows, completed };
  }

  private async findRecord(appointmentId: string): Promise<AppointmentRecord | null> {
    if (!this.databaseService.isEnabled()) {
      return this.memoryStore?.get(appointmentId) ?? null;
    }
    const row = await this.prisma.appointments.findUnique({ where: { appointment_id: appointmentId } });
    return row ? this.rowToRecord(row) : null;
  }

  private async listSweepCandidates(cutoff: Date): Promise<AppointmentRecord[]> {
    if (!this.databaseService.isEnabled()) {
      const cutoffMs = cutoff.getTime();
      return [...(this.memoryStore?.values() ?? [])].filter(
        (record) =>
          (record.status === "scheduled" || record.status === "in_progress") &&
          new Date(record.scheduledEndAt).getTime() < cutoffMs,
      );
    }
    const rows = await this.prisma.appointments.findMany({
      where: {
        status: { in: ["scheduled", "in_progress"] },
        scheduled_end_at: { lt: cutoff },
      },
    });
    return rows.map((row) => this.rowToRecord(row));
  }

  private transitionInMemory(
    appointmentId: string,
    toStatus: AppointmentStatus,
  ): { record: AppointmentRecord; fromStatus: AppointmentStatus } {
    const store = this.memoryStore;
    const record = store?.get(appointmentId);
    if (!store || !record) {
      throw new NotFoundException("Appointment not found");
    }
    if (!AppointmentStateService.canTransition(record.status, toStatus)) {
      throw new ConflictException(`Cannot transition appointment from ${record.status} to ${toStatus}`);
    }

    const nowIso = new Date().toISOString();
    const next: AppointmentRecord = {
      ...record,
      status: toStatus,
      version: (record.version ?? 0) + 1,
      actualStartedAt: toStatus === "in_progress" ? (record.actualStartedAt ?? nowIso) : record.actualStartedAt,
      actualEndedAt:
        toStatus === "completed" || toStatus === "no_show" ? (record.actualEndedAt ?? nowIso) : record.actualEndedAt,
    };
    store.set(appointmentId, next);
    return { record: next, fromStatus: record.status };
  }

  private async transitionInDatabase(
    appointmentId: string,
    toStatus: AppointmentStatus,
    actor: TransitionActor,
    options: TransitionOptions,
  ): Promise<{ record: AppointmentRecord; fromStatus: AppointmentStatus }> {
    return this.prisma.$transaction(async (tx) => {
      const row = await tx.appointments.findUnique({ where: { appointment_id: appointmentId } });
      if (!row) {
        throw new NotFoundException("Appointment not found");
      }
      const fromStatus = row.status as AppointmentStatus;
      if (!AppointmentStateService.canTransition(fromStatus, toStatus)) {
        throw new ConflictException(`Cannot transition appointment from ${fromStatus} to ${toStatus}`);
      }

      const now = new Date();
      const updated = await tx.appointments.updateMany({
        where: { appointment_id: appointmentId, version: row.version },
        data: {
          status: toStatus,
          version: row.version + 1,
          ...(toStatus === "in_progress" && !row.actual_started_at ? { actual_started_at: now } : {}),
          ...((toStatus === "completed" || toStatus === "no_show") && !row.actual_ended_at
            ? { actual_ended_at: now }
            : {}),
        },
      });
      if (updated.count === 0) {
        throw new ConflictException("Appointment was modified concurrently; retry");
      }

      await tx.appointment_transitions.create({
        data: {
          transition_id: `trans_${randomUUID()}`,
          appointment_id: appointmentId,
          from_status: fromStatus,
          to_status: toStatus,
          actor_user_id: actor.userId,
          actor_role: actor.role,
          reason: options.reason ?? "",
          metadata: options.metadata ?? {},
          occurred_at: now,
        },
      });

      const fresh = await tx.appointments.findUnique({ where: { appointment_id: appointmentId } });
      return { record: this.rowToRecord(fresh!), fromStatus };
    });
  }

  private async recordSideEffects(
    record: AppointmentRecord,
    fromStatus: AppointmentStatus,
    toStatus: AppointmentStatus,
    actor: TransitionActor,
    options: TransitionOptions,
  ): Promise<void> {
    await this.auditService.recordEvent({
      actorUserId: actor.userId,
      actorRole: actor.role,
      action: `appointment_state_${toStatus}`,
      targetType: "appointment",
      targetId: record.appointmentId,
      metadata: { appointmentId: record.appointmentId, reason: options.reason ?? "" },
    });

    // Journey timeline milestones are driven by the state machine, not by
    // page views: joining marks session_started, terminal states close it out.
    const journeyEvent =
      toStatus === "in_progress"
        ? "session_started"
        : toStatus === "completed"
          ? "session_completed"
          : toStatus === "no_show"
            ? "session_no_show"
            : null;
    if (journeyEvent) {
      await this.analyticsService.recordEvent({
        name: journeyEvent,
        actorUserId: actor.userId === "system" ? record.patientId : actor.userId,
        actorRole: actor.role,
        targetId: record.patientId,
        idempotencyKey: `${journeyEvent}:${record.appointmentId}`,
        metadata: { appointmentId: record.appointmentId },
      });
    }

    const event: AppointmentTransitionEvent = {
      appointmentId: record.appointmentId,
      patientId: record.patientId,
      clinicianId: record.clinicianId,
      fromStatus,
      toStatus,
      occurredAt: new Date().toISOString(),
      reason: options.reason ?? "",
    };
    for (const listener of this.listeners) {
      try {
        listener(event);
      } catch (error) {
        const message = error instanceof Error ? error.message : "unknown";
        this.logger.warn(`Transition listener failed: ${message}`);
      }
    }
  }

  private rowToRecord(row: {
    appointment_id: string;
    patient_id: string;
    clinician_id: string;
    scheduled_start_at: Date;
    scheduled_end_at: Date;
    status: string;
    chat_window_open_at: Date;
    chat_window_close_at: Date;
    actual_started_at: Date | null;
    actual_ended_at: Date | null;
    version: number;
  }): AppointmentRecord {
    return {
      appointmentId: row.appointment_id,
      patientId: row.patient_id,
      clinicianId: row.clinician_id,
      scheduledStartAt: row.scheduled_start_at.toISOString(),
      scheduledEndAt: row.scheduled_end_at.toISOString(),
      status: row.status as AppointmentStatus,
      chatWindowOpenAt: row.chat_window_open_at.toISOString(),
      chatWindowCloseAt: row.chat_window_close_at.toISOString(),
      actualStartedAt: row.actual_started_at?.toISOString() ?? null,
      actualEndedAt: row.actual_ended_at?.toISOString() ?? null,
      version: row.version,
    };
  }
}
