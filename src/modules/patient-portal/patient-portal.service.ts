import { ForbiddenException, Injectable } from "@nestjs/common";

import { AppointmentsService } from "../appointments/appointments.service";
import type { AuthJwtPayload } from "../auth/interfaces/auth-jwt-payload.interface";
import { BillingService } from "../billing/billing.service";
import { UsersService } from "../users/users.service";
import { PatientDashboardDto } from "./dto/patient-dashboard.dto";

@Injectable()
export class PatientPortalService {
  constructor(
    private readonly appointmentsService: AppointmentsService,
    private readonly billingService: BillingService,
    private readonly usersService: UsersService,
  ) {}

  async getDashboard(user: AuthJwtPayload): Promise<PatientDashboardDto> {
    if (user.role !== "patient") {
      throw new ForbiddenException("Only patients can access the patient dashboard");
    }

    const [profile, nextSession, journey, invoices] = await Promise.all([
      this.usersService.findById(user.sub),
      this.appointmentsService.getNextSessionForPatient(user),
      this.appointmentsService.getPatientJourneyTimeline(user, user.sub),
      this.billingService.listInvoicesForUser(user),
    ]);

    const latestInvoice = invoices[0] ?? null;
    const unpaidCount = invoices.filter((invoice) => invoice.status.trim().toLowerCase() !== "paid").length;

    return {
      user: {
        userId: user.sub,
        displayName: profile?.displayName ?? "there",
      },
      nextSession,
      journey,
      billing: {
        latestInvoice,
        unpaidCount,
        invoiceCount: invoices.length,
      },
      generatedAt: new Date().toISOString(),
    };
  }
}
