import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";

export class ForgotPasswordResponseDto {
  @ApiProperty({
    example: "If an account exists for this email, you will receive reset instructions shortly.",
  })
  message!: string;

  /** Only returned outside production when email delivery is not configured — for local/staging QA. */
  @ApiPropertyOptional({ example: "https://tailoredpsychology.com.au/reset-password?token=..." })
  devResetUrl?: string;
}
