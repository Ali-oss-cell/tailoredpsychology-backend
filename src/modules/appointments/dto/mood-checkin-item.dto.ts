import { ApiProperty } from "@nestjs/swagger";

export class MoodCheckinItemDto {
  @ApiProperty()
  id!: string;

  @ApiProperty({ example: "Good" })
  moodLabel!: string;

  @ApiProperty()
  createdAt!: string;
}

export class MoodCheckinsListResponseDto {
  @ApiProperty({ type: [MoodCheckinItemDto] })
  items!: MoodCheckinItemDto[];
}
