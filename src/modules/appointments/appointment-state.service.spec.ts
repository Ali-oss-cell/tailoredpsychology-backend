import { ConflictException, NotFoundException } from "@nestjs/common";

import { AppointmentStateService, type TransitionActor } from "./appointment-state.service";
import type { AppointmentRecord } from "./entities/appointment.record";

function makeRecord(overrides: Partial<AppointmentRecord> = {}): AppointmentRecord {
  const start = new Date(Date.now() + 60 * 60 * 1000);
  const end = new Date(start.getTime() + 50 * 60 * 1000);
  return {
    appointmentId: "appt_sm_001",
    patientId: "user_patient_001",
    clinicianId: "clinician_001",
    scheduledStartAt: start.toISOString(),
    scheduledEndAt: end.toISOString(),
    status: "scheduled",
    chatWindowOpenAt: new Date(start.getTime() - 30 * 60 * 1000).toISOString(),
    chatWindowCloseAt: end.toISOString(),
    version: 0,
    ...overrides,
  };
}

describe("AppointmentStateService (in-memory mode)", () => {
  let service: AppointmentStateService;
  let store: Map<string, AppointmentRecord>;
  let auditEvents: Array<{ action: string }>;
  let analyticsEvents: Array<{ name: string }>;

  beforeEach(() => {
    auditEvents = [];
    analyticsEvents = [];
    const databaseService = { isEnabled: () => false };
    const prisma = {};
    const auditService = {
      recordEvent: jest.fn(async (event: { action: string }) => {
        auditEvents.push(event);
      }),
    };
    const analyticsService = {
      recordEvent: jest.fn(async (event: { name: string }) => {
        analyticsEvents.push(event);
      }),
    };
    service = new AppointmentStateService(
      databaseService as never,
      prisma as never,
      auditService as never,
      analyticsService as never,
    );
    store = new Map();
    service.attachMemoryStore(store);
  });

  const systemActor: TransitionActor = { userId: "system", role: "system" };
  const patientActor: TransitionActor = { userId: "user_patient_001", role: "patient" };

  it("allows scheduled → in_progress and stamps actualStartedAt + version", async () => {
    store.set("appt_sm_001", makeRecord());

    const next = await service.transition("appt_sm_001", "in_progress", patientActor, { reason: "join_session" });

    expect(next.status).toBe("in_progress");
    expect(next.actualStartedAt).toBeTruthy();
    expect(next.version).toBe(1);
    expect(analyticsEvents.map((e) => e.name)).toContain("session_started");
  });

  it("allows in_progress → completed and stamps actualEndedAt", async () => {
    store.set("appt_sm_001", makeRecord({ status: "in_progress", version: 1 }));

    const next = await service.transition("appt_sm_001", "completed", systemActor);

    expect(next.status).toBe("completed");
    expect(next.actualEndedAt).toBeTruthy();
    expect(analyticsEvents.map((e) => e.name)).toContain("session_completed");
  });

  it("rejects illegal transitions (completed → in_progress)", async () => {
    store.set("appt_sm_001", makeRecord({ status: "completed" }));

    await expect(service.transition("appt_sm_001", "in_progress", patientActor)).rejects.toBeInstanceOf(
      ConflictException,
    );
  });

  it("throws NotFound for unknown appointments", async () => {
    await expect(service.transition("missing", "in_progress", patientActor)).rejects.toBeInstanceOf(NotFoundException)
  });

  it("transitionIfNeeded is idempotent when already in the target state", async () => {
    store.set("appt_sm_001", makeRecord({ status: "in_progress" }));

    const result = await service.transitionIfNeeded("appt_sm_001", "in_progress", patientActor);

    expect(result.status).toBe("in_progress");
  });

  it("notifies transition listeners with from/to statuses", async () => {
    store.set("appt_sm_001", makeRecord());
    const events: Array<{ fromStatus: string; toStatus: string }> = [];
    service.onTransition((event) => events.push(event));

    await service.transition("appt_sm_001", "cancelled", patientActor, { reason: "test" });

    expect(events).toEqual([
      expect.objectContaining({ fromStatus: "scheduled", toStatus: "cancelled", appointmentId: "appt_sm_001" }),
    ]);
  });

  it("sweep marks overdue scheduled sessions as no_show and stale in_progress as completed", async () => {
    const pastEnd = new Date(Date.now() - 60 * 60 * 1000).toISOString();
    store.set("appt_late", makeRecord({ appointmentId: "appt_late", scheduledEndAt: pastEnd }));
    store.set(
      "appt_running",
      makeRecord({ appointmentId: "appt_running", status: "in_progress", scheduledEndAt: pastEnd }),
    );
    store.set("appt_future", makeRecord({ appointmentId: "appt_future" }));

    const result = await service.runSweep();

    expect(result).toEqual({ noShows: 1, completed: 1 });
    expect(store.get("appt_late")?.status).toBe("no_show");
    expect(store.get("appt_running")?.status).toBe("completed");
    expect(store.get("appt_future")?.status).toBe("scheduled");
  });
});
