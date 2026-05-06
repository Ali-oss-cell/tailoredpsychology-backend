import { ApiProperty } from "@nestjs/swagger";

export class AdminAppointmentItemDto {
  @ApiProperty()
  appointmentId!: string;
  @ApiProperty()
  patientId!: string;
  @ApiProperty()
  patientName!: string;
  @ApiProperty()
  clinicianId!: string;
  @ApiProperty()
  clinicianName!: string;
  @ApiProperty()
  scheduledStartAt!: string;
  @ApiProperty()
  status!: string;
}

export class AdminPatientItemDto {
  @ApiProperty()
  patientId!: string;
  @ApiProperty()
  displayName!: string;
  @ApiProperty()
  email!: string;
  @ApiProperty()
  intakeState!: "draft_in_progress" | "committed" | "none";
  @ApiProperty()
  retentionStatus!: "active" | "deleted" | "legal_hold" | "purge_pending";
  @ApiProperty()
  legalHoldActive!: boolean;
}

export class AdminStaffItemDto {
  @ApiProperty()
  userId!: string;
  @ApiProperty()
  displayName!: string;
  @ApiProperty()
  email!: string;
  @ApiProperty()
  role!: string;
  @ApiProperty()
  status!: string;
}

export class AdminResourceItemDto {
  @ApiProperty()
  resourceId!: string;
  @ApiProperty()
  title!: string;
  @ApiProperty()
  state!: string;
  @ApiProperty()
  owner!: string;
  @ApiProperty()
  updatedAt!: string;
}

export class AdminDeletionQueueItemDto {
  @ApiProperty()
  patientId!: string;
  @ApiProperty()
  deletedAt!: string | null;
  @ApiProperty()
  retentionUntil!: string | null;
  @ApiProperty()
  legalHoldActive!: boolean;
  @ApiProperty()
  purgeEligible!: boolean;
}

export class AdminBillingSummaryDto {
  @ApiProperty()
  revenueToday!: number;
  @ApiProperty()
  revenueWeek!: number;
  @ApiProperty()
  revenueMonth!: number;
  @ApiProperty()
  failedPayments!: number;
  @ApiProperty()
  pendingClaims!: number;
}

export class AdminAnalyticsSummaryDto {
  @ApiProperty()
  totalAnalyticsEvents!: number;
  @ApiProperty()
  totalAuditEvents!: number;
  @ApiProperty()
  bookingRequested!: number;
  @ApiProperty()
  joinFailures!: number;
}

export class AdminSettingsDomainDto {
  @ApiProperty()
  key!: string;
  @ApiProperty()
  value!: string;
  @ApiProperty()
  editable!: boolean;
}
