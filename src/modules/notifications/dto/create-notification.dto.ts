import { ApiProperty } from "@nestjs/swagger";
import { IsIn, IsObject, IsString } from "class-validator";

import type { UserRole } from "../../users/types/user-role.type";
import type { NotificationType } from "../entities/notification.record";

export class CreateNotificationDto {
  @ApiProperty()
  @IsString()
  recipientUserId!: string;

  @ApiProperty({ enum: ["patient", "psychologist", "practice_manager", "admin"] })
  @IsString()
  @IsIn(["patient", "psychologist", "practice_manager", "admin"])
  recipientRole!: UserRole;

  @ApiProperty({
    enum: ["booking_submitted", "booking_confirmed", "chat_window_open", "session_starting_soon", "account_welcome"],
  })
  @IsString()
  @IsIn(["booking_submitted", "booking_confirmed", "chat_window_open", "session_starting_soon", "account_welcome"])
  type!: NotificationType;

  @ApiProperty()
  @IsString()
  title!: string;

  @ApiProperty()
  @IsString()
  body!: string;

  @ApiProperty({ type: "object", additionalProperties: true })
  @IsObject()
  metadata!: Record<string, string>;
}
