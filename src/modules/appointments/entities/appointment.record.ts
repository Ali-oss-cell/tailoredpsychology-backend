export type AppointmentStatus = "scheduled" | "in_progress" | "completed" | "cancelled" | "no_show";

export type AppointmentRecord = {
  appointmentId: string;
  patientId: string;
  clinicianId: string;
  scheduledStartAt: string;
  scheduledEndAt: string;
  status: AppointmentStatus;
  chatWindowOpenAt: string;
  chatWindowCloseAt: string;
  /** Set on the first successful join (scheduled → in_progress). */
  actualStartedAt?: string | null;
  /** Set when the session reaches a terminal session state (completed / no_show). */
  actualEndedAt?: string | null;
  /** Optimistic-concurrency counter; bumped on every state transition. */
  version?: number;
};
