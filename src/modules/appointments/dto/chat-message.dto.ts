import { ApiProperty } from "@nestjs/swagger";

export class ChatMessageDto {
  @ApiProperty({ example: "msg_000001" })
  messageId!: string;

  @ApiProperty({ example: "appt_open_001" })
  appointmentId!: string;

  @ApiProperty({ example: "user_patient_001" })
  authorUserId!: string;

  @ApiProperty({ example: "patient" })
  authorRole!: string;

  @ApiProperty({ example: "Hi, I am ready for the session." })
  message!: string;

  @ApiProperty({ example: "2026-05-12T08:35:00.000Z" })
  createdAt!: string;
}
