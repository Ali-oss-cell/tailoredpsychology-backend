import { ApiProperty } from "@nestjs/swagger";

export class BookingCheckoutResponseDto {
  @ApiProperty({ example: "https://checkout.stripe.com/c/pay/cs_test_..." })
  checkoutUrl!: string;

  @ApiProperty({ example: "cs_test_a1b2c3" })
  checkoutSessionId!: string;

  @ApiProperty({ example: "inv_br_000001" })
  invoiceId!: string;

  @ApiProperty({ example: false, description: "True when Stripe is not configured and payment was auto-confirmed for local dev." })
  devModeAutoConfirmed!: boolean;
}
