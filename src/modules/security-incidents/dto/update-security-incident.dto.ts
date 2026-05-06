import { ApiPropertyOptional } from "@nestjs/swagger";
import { IsIn, IsOptional, IsString, MaxLength } from "class-validator";

export class UpdateSecurityIncidentDto {
  @ApiPropertyOptional({
    example: "triage",
    enum: ["reported", "triage", "investigating", "notification_assessment", "notification_ready", "closed"],
  })
  @IsOptional()
  @IsString()
  @IsIn(["reported", "triage", "investigating", "notification_assessment", "notification_ready", "closed"])
  status?: "reported" | "triage" | "investigating" | "notification_assessment" | "notification_ready" | "closed";

  @ApiPropertyOptional({ example: "moderate", enum: ["low", "moderate", "severe"] })
  @IsOptional()
  @IsString()
  @IsIn(["low", "moderate", "severe"])
  impact?: "low" | "moderate" | "severe";

  @ApiPropertyOptional({
    example: "assessment_in_progress",
    enum: ["not_required", "assessment_in_progress", "eligible_for_notification", "notifiable"],
  })
  @IsOptional()
  @IsString()
  @IsIn(["not_required", "assessment_in_progress", "eligible_for_notification", "notifiable"])
  ndbAssessment?: "not_required" | "assessment_in_progress" | "eligible_for_notification" | "notifiable";

  @ApiPropertyOptional({ example: "user_admin_001" })
  @IsOptional()
  @IsString()
  @MaxLength(120)
  assignedOwnerUserId?: string;

  @ApiPropertyOptional({ example: "Containment complete, drafting notifications." })
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  resolutionNotes?: string;
}
