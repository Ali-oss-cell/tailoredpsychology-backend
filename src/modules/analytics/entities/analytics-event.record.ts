import type { UserRole } from "../../users/types/user-role.type";

export type AnalyticsEventName =
  | "intake_started"
  | "intake_submitted"
  | "booking_requested"
  | "booking_confirmed"
  | "session_started"
  | "session_completed"
  | "session_no_show"
  | "join_attempted"
  | "join_success"
  | "join_failed"
  | "join_warned"
  | "invoice_downloaded";

export type AnalyticsEventRecord = {
  eventId: string;
  name: AnalyticsEventName;
  actorUserId: string;
  actorRole: UserRole | "system";
  targetId: string;
  occurredAt: string;
  metadata: Record<string, string | number | boolean | null>;
  idempotencyKey?: string;
};
