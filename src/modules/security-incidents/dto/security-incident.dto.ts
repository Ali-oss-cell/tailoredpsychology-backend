import { ApiProperty } from "@nestjs/swagger";

export class SecurityIncidentDto {
  @ApiProperty({ example: "sec_0001" })
  incidentId!: string;

  @ApiProperty({ example: "Unauthorized record export attempt" })
  title!: string;

  @ApiProperty({ example: "Multiple failed export-download requests from unusual source IP." })
  summary!: string;

  @ApiProperty({ example: "high", enum: ["low", "medium", "high", "critical"] })
  severity!: "low" | "medium" | "high" | "critical";

  @ApiProperty({ example: "moderate", enum: ["low", "moderate", "severe"] })
  impact!: "low" | "moderate" | "severe";

  @ApiProperty({
    example: "triage",
    enum: ["reported", "triage", "investigating", "notification_assessment", "notification_ready", "closed"],
  })
  status!: "reported" | "triage" | "investigating" | "notification_assessment" | "notification_ready" | "closed";

  @ApiProperty({
    example: "assessment_in_progress",
    enum: ["not_required", "assessment_in_progress", "eligible_for_notification", "notifiable"],
  })
  ndbAssessment!: "not_required" | "assessment_in_progress" | "eligible_for_notification" | "notifiable";

  @ApiProperty({ example: true })
  containsPersonalData!: boolean;

  @ApiProperty({ required: false, example: "user_admin_001" })
  assignedOwnerUserId?: string;

  @ApiProperty({ required: false, example: "Incident investigated and controls reinforced." })
  resolutionNotes?: string;

  @ApiProperty({ example: "2026-04-30T08:30:00.000Z" })
  detectedAt!: string;

  @ApiProperty({ example: "2026-04-30T08:45:00.000Z" })
  createdAt!: string;

  @ApiProperty({ example: "2026-04-30T09:45:00.000Z" })
  updatedAt!: string;

  @ApiProperty({ required: false, example: "2026-04-30T10:45:00.000Z" })
  closedAt?: string;
}
