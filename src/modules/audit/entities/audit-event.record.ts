import type { UserRole } from "../../users/types/user-role.type";

export type AuditTargetType = "auth" | "appointment" | "booking_request" | "referral_document" | "system";

export type AuditMetadataValue = string | number | boolean | null;

export type AuditEventRecord = {
  eventId: string;
  actorUserId: string;
  actorRole: UserRole | "system";
  action: string;
  targetType: AuditTargetType;
  targetId: string;
  metadata: Record<string, AuditMetadataValue>;
  occurredAt: string;
};
