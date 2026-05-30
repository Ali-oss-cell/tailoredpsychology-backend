import { Controller, Headers, Param, Post, Req, UseGuards } from "@nestjs/common";
import { ApiBearerAuth, ApiCreatedResponse, ApiOperation, ApiTags } from "@nestjs/swagger";
import type { RawBodyRequest } from "@nestjs/common";
import type { Request } from "express";

import { CurrentUser } from "../auth/decorators/current-user.decorator";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import type { AuthJwtPayload } from "../auth/interfaces/auth-jwt-payload.interface";
import { BookingCheckoutResponseDto } from "./dto/booking-checkout-response.dto";
import { PaymentsService } from "./payments.service";

@ApiTags("payments")
@Controller("payments")
export class PaymentsController {
  constructor(private readonly paymentsService: PaymentsService) {}

  @Post("booking/:bookingRequestId/checkout")
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: "Create Stripe Checkout session for a pending booking" })
  @ApiCreatedResponse({ type: BookingCheckoutResponseDto })
  createBookingCheckout(
    @CurrentUser() user: AuthJwtPayload,
    @Param("bookingRequestId") bookingRequestId: string,
  ): Promise<BookingCheckoutResponseDto> {
    return this.paymentsService.createBookingCheckout(user, bookingRequestId);
  }

  @Post("stripe/webhook")
  @ApiOperation({ summary: "Stripe webhook endpoint (raw body + signature verification)" })
  handleStripeWebhook(
    @Req() req: RawBodyRequest<Request>,
    @Headers("stripe-signature") signature: string | undefined,
  ): Promise<{ received: true }> {
    const rawBody = req.rawBody ?? Buffer.from("");
    return this.paymentsService.handleStripeWebhook(rawBody, signature);
  }
}
