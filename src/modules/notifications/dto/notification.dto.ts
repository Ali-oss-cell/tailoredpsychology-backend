import { ApiProperty } from "@nestjs/swagger";

import type { NotificationType } from "../entities/notification.record";

export class NotificationDto {
  @ApiProperty()
  notificationId!: string;

  @ApiProperty()
  recipientUserId!: string;

  @ApiProperty({
    enum: ["booking_submitted", "booking_confirmed", "chat_window_open", "session_starting_soon", "account_welcome"],
  })
  type!: NotificationType;

  @ApiProperty()
  title!: string;

  @ApiProperty()
  body!: string;

  @ApiProperty()
  createdAt!: string;

  @ApiProperty({ required: false })
  readAt?: string;

  @ApiProperty({ type: "object", additionalProperties: true })
  metadata!: Record<string, string>;
}
