import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  Logger,
  NotFoundException,
  ServiceUnavailableException,
} from "@nestjs/common";

import type { AuthJwtPayload } from "../auth/interfaces/auth-jwt-payload.interface";
import { AnalyticsService } from "../analytics/analytics.service";
import { AppointmentsService } from "../appointments/appointments.service";
import { DatabaseService } from "../core/database.service";
import { NotificationsService } from "../notifications/notifications.service";
import { PrismaService } from "../prisma/prisma.service";
import { UsersService } from "../users/users.service";
import { BookingCheckoutResponseDto } from "./dto/booking-checkout-response.dto";
import { StripeClientService } from "./stripe-client.service";
import type { StripeCheckoutSessionPayload, StripeWebhookPayload } from "./stripe-webhook.types";

type PendingInvoiceRecord = {
  invoiceId: string;
  patientId: string;
  bookingRequestId: string;
  appointmentId: string;
  amountCents: number;
  status: "Pending" | "Paid";
  stripeCheckoutSessionId?: string;
  paidAt?: string;
};

@Injectable()
export class PaymentsService {
  private readonly logger = new Logger(PaymentsService.name);
  private readonly processedWebhookEvents = new Set<string>();
  private readonly pendingInvoices = new Map<string, PendingInvoiceRecord>();

  constructor(
    private readonly stripeClient: StripeClientService,
    private readonly appointmentsService: AppointmentsService,
    private readonly usersService: UsersService,
    private readonly notificationsService: NotificationsService,
    private readonly analyticsService: AnalyticsService,
    private readonly databaseService: DatabaseService,
    private readonly prisma: PrismaService,
  ) {}

  async createBookingCheckout(user: AuthJwtPayload, bookingRequestId: string): Promise<BookingCheckoutResponseDto> {
    if (user.role !== "patient") {
      throw new ForbiddenException("Only patients can pay for bookings");
    }

    const booking = await this.appointmentsService.getBookingRequestForPayment(user, bookingRequestId);
    if (booking.state === "appointment_confirmed") {
      return {
        checkoutUrl: `${this.stripeClient.getPublicAppUrl()}/patient/book-appointment/payment-success?bookingRequestId=${encodeURIComponent(bookingRequestId)}`,
        checkoutSessionId: "",
        invoiceId: this.invoiceIdForBooking(bookingRequestId),
        devModeAutoConfirmed: false,
      };
    }
    if (booking.state !== "pending_payment") {
      throw new BadRequestException("This booking is not awaiting payment");
    }

    const appointmentId = `appt_${bookingRequestId}`;
    const invoiceId = this.invoiceIdForBooking(bookingRequestId);
    const amountCents = this.stripeClient.getSessionFeeCents();

    if (!this.stripeClient.isConfigured()) {
      await this.confirmBookingPayment({
        bookingRequestId,
        patientId: booking.patientId,
        appointmentId,
        invoiceId,
        amountCents,
        stripeCheckoutSessionId: undefined,
        stripeEventId: `dev_auto_confirm:${bookingRequestId}`,
      });
      return {
        checkoutUrl: `${this.stripeClient.getPublicAppUrl()}/patient/book-appointment/payment-success?bookingRequestId=${encodeURIComponent(bookingRequestId)}`,
        checkoutSessionId: "",
        invoiceId,
        devModeAutoConfirmed: true,
      };
    }

    const existing = await this.findInvoiceByBookingRequestId(bookingRequestId);
    if (existing?.stripeCheckoutSessionId && existing.status === "Pending") {
      const stripe = this.stripeClient.getClient();
      const session = await stripe.checkout.sessions.retrieve(existing.stripeCheckoutSessionId);
      if (session.status === "open" && session.url) {
        return {
          checkoutUrl: session.url,
          checkoutSessionId: session.id,
          invoiceId: existing.invoiceId,
          devModeAutoConfirmed: false,
        };
      }
    }

    const patient = await this.usersService.findById(booking.patientId);
    if (!patient) {
      throw new NotFoundException("Patient not found");
    }

    const stripe = this.stripeClient.getClient();
    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      customer_email: patient.email,
      line_items: [
        {
          quantity: 1,
          price_data: {
            currency: "aud",
            unit_amount: amountCents,
            product_data: {
              name: "Telehealth psychology session",
              description: "Initial appointment booking — Tailored Psychology",
            },
          },
        },
      ],
      success_url: `${this.stripeClient.getPublicAppUrl()}/patient/book-appointment/payment-success?bookingRequestId=${encodeURIComponent(bookingRequestId)}&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${this.stripeClient.getPublicAppUrl()}/patient/book-appointment?payment=cancelled&bookingRequestId=${encodeURIComponent(bookingRequestId)}`,
      metadata: {
        bookingRequestId,
        appointmentId,
        patientId: booking.patientId,
        invoiceId,
      },
    });

    if (!session.url) {
      throw new ServiceUnavailableException("Stripe checkout session could not be created");
    }

    await this.upsertPendingInvoice({
      invoiceId,
      patientId: booking.patientId,
      bookingRequestId,
      appointmentId,
      amountCents,
      stripeCheckoutSessionId: session.id,
    });

    return {
      checkoutUrl: session.url,
      checkoutSessionId: session.id,
      invoiceId,
      devModeAutoConfirmed: false,
    };
  }

  async handleStripeWebhook(rawBody: Buffer, signature: string | undefined): Promise<{ received: true }> {
    const webhookSecret = this.stripeClient.getWebhookSecret();
    if (!webhookSecret) {
      throw new ServiceUnavailableException("Stripe webhook secret is not configured");
    }
    if (!signature) {
      throw new BadRequestException("Missing Stripe signature header");
    }

    const stripe = this.stripeClient.getClient();
    let event: StripeWebhookPayload;
    try {
      event = stripe.webhooks.constructEvent(rawBody, signature, webhookSecret) as StripeWebhookPayload;
    } catch (error) {
      const message = error instanceof Error ? error.message : "Invalid webhook signature";
      throw new BadRequestException(message);
    }

    if (await this.hasProcessedWebhookEvent(event.id)) {
      return { received: true };
    }

    if (event.type === "checkout.session.completed") {
      const session = event.data.object;
      await this.handleCheckoutSessionCompleted(session, event.id);
    } else if (event.type === "checkout.session.expired") {
      const session = event.data.object;
      await this.handleCheckoutSessionExpired(session, event.id);
    }

    await this.markWebhookEventProcessed(event.id);
    return { received: true };
  }

  private async handleCheckoutSessionCompleted(session: StripeCheckoutSessionPayload, eventId: string): Promise<void> {
    const bookingRequestId = session.metadata?.bookingRequestId;
    const patientId = session.metadata?.patientId;
    const appointmentId = session.metadata?.appointmentId;
    const invoiceId = session.metadata?.invoiceId ?? (bookingRequestId ? this.invoiceIdForBooking(bookingRequestId) : undefined);

    if (!bookingRequestId || !patientId || !appointmentId || !invoiceId) {
      this.logger.warn(`checkout.session.completed missing metadata for session ${session.id}`);
      return;
    }
    if (session.payment_status !== "paid") {
      return;
    }

    await this.confirmBookingPayment({
      bookingRequestId,
      patientId,
      appointmentId,
      invoiceId,
      amountCents: session.amount_total ?? this.stripeClient.getSessionFeeCents(),
      stripeCheckoutSessionId: session.id,
      stripeEventId: eventId,
    });
  }

  private async handleCheckoutSessionExpired(session: StripeCheckoutSessionPayload, eventId: string): Promise<void> {
    const bookingRequestId = session.metadata?.bookingRequestId;
    if (!bookingRequestId) {
      return;
    }
    await this.appointmentsService.abandonBookingPayment(bookingRequestId, eventId);
  }

  private async confirmBookingPayment(params: {
    bookingRequestId: string;
    patientId: string;
    appointmentId: string;
    invoiceId: string;
    amountCents: number;
    stripeCheckoutSessionId?: string;
    stripeEventId: string;
  }): Promise<void> {
    if (await this.hasProcessedWebhookEvent(params.stripeEventId)) {
      return;
    }

    const confirmed = await this.appointmentsService.confirmBookingAfterPayment(params.bookingRequestId);
    if (!confirmed) {
      return;
    }

    const paidAt = new Date();
    await this.upsertPaidInvoice({
      invoiceId: params.invoiceId,
      patientId: params.patientId,
      bookingRequestId: params.bookingRequestId,
      appointmentId: params.appointmentId,
      amountCents: params.amountCents,
      stripeCheckoutSessionId: params.stripeCheckoutSessionId,
      paidAt,
    });

    await this.analyticsService.recordEvent({
      name: "payment_completed",
      actorUserId: params.patientId,
      actorRole: "patient",
      targetId: params.bookingRequestId,
      idempotencyKey: `payment_completed:${params.bookingRequestId}`,
      metadata: {
        invoiceId: params.invoiceId,
        amountCents: params.amountCents,
      },
    });

    await this.notificationsService.createNotification({
      recipientUserId: params.patientId,
      recipientRole: "patient",
      type: "booking_confirmed",
      title: "Booking confirmed",
      body: "Your payment was received and your appointment is confirmed.",
      metadata: {
        bookingRequestId: params.bookingRequestId,
        appointmentId: params.appointmentId,
        ctaPath: "/patient/appointments",
      },
    });

    await this.markWebhookEventProcessed(params.stripeEventId);
  }

  private invoiceIdForBooking(bookingRequestId: string): string {
    return `inv_${bookingRequestId}`;
  }

  private async findInvoiceByBookingRequestId(bookingRequestId: string): Promise<PendingInvoiceRecord | null> {
    if (!this.databaseService.isEnabled()) {
      return this.pendingInvoices.get(bookingRequestId) ?? null;
    }
    const row = await this.prisma.patient_invoices.findFirst({
      where: { booking_request_id: bookingRequestId },
    });
    if (!row) {
      return null;
    }
    return {
      invoiceId: row.invoice_id,
      patientId: row.patient_id,
      bookingRequestId: row.booking_request_id ?? bookingRequestId,
      appointmentId: row.appointment_id ?? `appt_${bookingRequestId}`,
      amountCents: row.amount_cents,
      status: row.status === "Paid" ? "Paid" : "Pending",
      stripeCheckoutSessionId: row.stripe_checkout_session_id ?? undefined,
      paidAt: row.paid_at?.toISOString(),
    };
  }

  private async upsertPendingInvoice(input: {
    invoiceId: string;
    patientId: string;
    bookingRequestId: string;
    appointmentId: string;
    amountCents: number;
    stripeCheckoutSessionId: string;
  }): Promise<void> {
    const record: PendingInvoiceRecord = {
      invoiceId: input.invoiceId,
      patientId: input.patientId,
      bookingRequestId: input.bookingRequestId,
      appointmentId: input.appointmentId,
      amountCents: input.amountCents,
      status: "Pending",
      stripeCheckoutSessionId: input.stripeCheckoutSessionId,
    };

    if (!this.databaseService.isEnabled()) {
      this.pendingInvoices.set(input.bookingRequestId, record);
      return;
    }

    await this.prisma.patient_invoices.upsert({
      where: { invoice_id: input.invoiceId },
      create: {
        invoice_id: input.invoiceId,
        patient_id: input.patientId,
        issued_at: new Date(),
        amount_cents: input.amountCents,
        status: "Pending",
        booking_request_id: input.bookingRequestId,
        appointment_id: input.appointmentId,
        stripe_checkout_session_id: input.stripeCheckoutSessionId,
      },
      update: {
        amount_cents: input.amountCents,
        status: "Pending",
        stripe_checkout_session_id: input.stripeCheckoutSessionId,
      },
    });
  }

  private async upsertPaidInvoice(input: {
    invoiceId: string;
    patientId: string;
    bookingRequestId: string;
    appointmentId: string;
    amountCents: number;
    stripeCheckoutSessionId?: string;
    paidAt: Date;
  }): Promise<void> {
    if (!this.databaseService.isEnabled()) {
      this.pendingInvoices.set(input.bookingRequestId, {
        invoiceId: input.invoiceId,
        patientId: input.patientId,
        bookingRequestId: input.bookingRequestId,
        appointmentId: input.appointmentId,
        amountCents: input.amountCents,
        status: "Paid",
        stripeCheckoutSessionId: input.stripeCheckoutSessionId,
        paidAt: input.paidAt.toISOString(),
      });
      return;
    }

    await this.prisma.patient_invoices.upsert({
      where: { invoice_id: input.invoiceId },
      create: {
        invoice_id: input.invoiceId,
        patient_id: input.patientId,
        issued_at: input.paidAt,
        amount_cents: input.amountCents,
        status: "Paid",
        booking_request_id: input.bookingRequestId,
        appointment_id: input.appointmentId,
        stripe_checkout_session_id: input.stripeCheckoutSessionId,
        paid_at: input.paidAt,
      },
      update: {
        amount_cents: input.amountCents,
        status: "Paid",
        stripe_checkout_session_id: input.stripeCheckoutSessionId,
        paid_at: input.paidAt,
      },
    });
  }

  private async hasProcessedWebhookEvent(eventId: string): Promise<boolean> {
    if (!this.databaseService.isEnabled()) {
      return this.processedWebhookEvents.has(eventId);
    }
    const row = await this.prisma.stripe_webhook_events.findUnique({ where: { event_id: eventId } });
    return row !== null;
  }

  private async markWebhookEventProcessed(eventId: string): Promise<void> {
    if (!this.databaseService.isEnabled()) {
      this.processedWebhookEvents.add(eventId);
      return;
    }
    await this.prisma.stripe_webhook_events.create({
      data: { event_id: eventId },
    }).catch(() => undefined);
  }
}
