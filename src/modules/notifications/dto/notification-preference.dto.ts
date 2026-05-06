import { ApiProperty } from "@nestjs/swagger";
import { IsBoolean } from "class-validator";

export class NotificationPreferenceDto {
  @ApiProperty()
  @IsBoolean()
  inAppEnabled!: boolean;

  @ApiProperty()
  @IsBoolean()
  bookingSubmitted!: boolean;

  @ApiProperty()
  @IsBoolean()
  bookingConfirmed!: boolean;

  @ApiProperty()
  @IsBoolean()
  chatWindowOpen!: boolean;

  @ApiProperty()
  @IsBoolean()
  sessionStartingSoon!: boolean;
}
