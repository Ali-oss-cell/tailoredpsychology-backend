import { ApiProperty } from "@nestjs/swagger";

export class ConsentStatusDto {
  @ApiProperty({ example: "2026-04" })
  requiredVersion!: string;

  @ApiProperty({ nullable: true, example: "2026-04" })
  activeVersion!: string | null;

  @ApiProperty({ example: true })
  hasActiveConsent!: boolean;

  @ApiProperty({ example: false })
  requiresReconsent!: boolean;

  @ApiProperty({ nullable: true, example: "2026-04-28T12:00:00.000Z" })
  acceptedAt!: string | null;

  @ApiProperty({ nullable: true, example: null })
  withdrawnAt!: string | null;
}
