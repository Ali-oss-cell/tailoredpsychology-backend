import { ApiProperty } from "@nestjs/swagger";

export class IntakeDraftConflictDto {
  @ApiProperty({ example: "DRAFT_VERSION_CONFLICT" })
  code!: "DRAFT_VERSION_CONFLICT";

  @ApiProperty({ example: "Draft has changed on another device. Refresh and retry." })
  message!: string;

  @ApiProperty({ example: 5 })
  currentVersion!: number;
}
