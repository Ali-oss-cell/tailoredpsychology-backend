import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";

export type PsychologistClinicalDataset = {
  presentingConcerns: string;
  riskAssessment: string;
  interventionsApplied: string;
  progressEvaluation: string;
  followUpPlan: string;
};

export class PsychologistNoteDto {
  @ApiProperty({ example: "note_0001" })
  noteId!: string;

  @ApiProperty({ example: "user_psychologist_001" })
  psychologistId!: string;

  @ApiProperty({ example: "user_patient_001" })
  patientId!: string;

  @ApiProperty({ example: "appt_open_001" })
  sessionId!: string;

  @ApiProperty({ example: "draft", enum: ["draft", "ready_for_signoff", "signed"] })
  status!: "draft" | "ready_for_signoff" | "signed";

  @ApiProperty({ example: "Clinical note body" })
  body!: string;

  @ApiPropertyOptional({
    type: () => Object,
    example: {
      presentingConcerns: "Low mood and sleep disruption",
      riskAssessment: "No immediate risk, monitor weekly",
      interventionsApplied: "CBT thought log and breathing routine",
      progressEvaluation: "Partial improvement",
      followUpPlan: "Follow up in 7 days",
    },
  })
  clinicalDataset?: PsychologistClinicalDataset;

  @ApiProperty({ example: "2026-04-28T12:00:00.000Z" })
  updatedAt!: string;

  @ApiProperty({ required: false, example: "2026-04-28T12:05:00.000Z" })
  signedAt?: string;
}
