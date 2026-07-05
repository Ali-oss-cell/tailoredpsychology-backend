import { ApiProperty } from "@nestjs/swagger";

import { SessionSummaryDto } from "../../appointments/dto/session-summary.dto";
import { SessionWindowSnapshotDto } from "../../appointments/dto/patient-next-session.dto";

export class PsychologistDashboardUserDto {
  @ApiProperty({ example: "user_psychologist_001" })
  userId!: string;

  @ApiProperty({ example: "Dr Demo" })
  displayName!: string;
}

export class PsychologistDashboardSessionsDto {
  @ApiProperty({ example: 12 })
  totalCount!: number;

  @ApiProperty({ example: 3 })
  todayCount!: number;

  @ApiProperty({ example: 4 })
  upcomingCount!: number;

  @ApiProperty({ example: 8 })
  completedCount!: number;
}

export class PsychologistDashboardNotesDto {
  @ApiProperty({ example: 2 })
  pendingCount!: number;

  @ApiProperty({ example: 5 })
  signedCount!: number;
}

export class PsychologistDashboardWorkspaceDto {
  @ApiProperty({ example: 2 })
  prepCount!: number;

  @ApiProperty({ example: 1 })
  attentionCount!: number;

  @ApiProperty({ example: 4 })
  itemCount!: number;
}

export class PsychologistNextSessionDto extends SessionSummaryDto {
  @ApiProperty({ type: SessionWindowSnapshotDto })
  window!: SessionWindowSnapshotDto;
}

/**
 * Consolidated read model for the psychologist dashboard: one round trip,
 * one loading state on the client.
 */
export class PsychologistDashboardDto {
  @ApiProperty({ type: PsychologistDashboardUserDto })
  user!: PsychologistDashboardUserDto;

  @ApiProperty({ type: PsychologistDashboardSessionsDto })
  sessions!: PsychologistDashboardSessionsDto;

  @ApiProperty({ type: SessionSummaryDto, isArray: true })
  todaySchedule!: SessionSummaryDto[];

  @ApiProperty({ type: PsychologistNextSessionDto, nullable: true })
  nextSession!: PsychologistNextSessionDto | null;

  @ApiProperty({ type: PsychologistDashboardNotesDto })
  notes!: PsychologistDashboardNotesDto;

  @ApiProperty({ type: PsychologistDashboardWorkspaceDto })
  workspace!: PsychologistDashboardWorkspaceDto;

  @ApiProperty({ description: "Server timestamp for this snapshot (ISO)" })
  generatedAt!: string;
}
