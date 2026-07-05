import { ForbiddenException, Injectable } from "@nestjs/common";

import { AppointmentsService } from "../appointments/appointments.service";
import type { SessionSummaryDto } from "../appointments/dto/session-summary.dto";
import type { AuthJwtPayload } from "../auth/interfaces/auth-jwt-payload.interface";
import { PsychologistNotesService } from "../psychologist-notes/psychologist-notes.service";
import { UsersService } from "../users/users.service";
import { PsychologistDashboardDto } from "./dto/psychologist-dashboard.dto";

function isSameLocalCalendarDay(iso: string, nowMs: number): boolean {
  const when = new Date(iso);
  const now = new Date(nowMs);
  return (
    when.getFullYear() === now.getFullYear() &&
    when.getMonth() === now.getMonth() &&
    when.getDate() === now.getDate()
  );
}

function isUpcomingSession(session: SessionSummaryDto, nowMs: number): boolean {
  if (session.status === "cancelled" || session.status === "no_show") return false;
  return new Date(session.scheduledStartAt).getTime() >= nowMs;
}

@Injectable()
export class PsychologistPortalService {
  constructor(
    private readonly appointmentsService: AppointmentsService,
    private readonly notesService: PsychologistNotesService,
    private readonly usersService: UsersService,
  ) {}

  async getDashboard(user: AuthJwtPayload): Promise<PsychologistDashboardDto> {
    if (user.role !== "psychologist") {
      throw new ForbiddenException("Only psychologists can access the psychologist dashboard");
    }

    const psychologistId = user.sub;
    const nowMs = Date.now();

    const [profile, sessions, notes, workspace] = await Promise.all([
      this.usersService.findById(psychologistId),
      this.appointmentsService.getPsychologistSessions(user, psychologistId),
      this.notesService.listNotes(user, psychologistId),
      this.appointmentsService.getPsychologistPreSessionWorkspace(user, psychologistId, {
        sortBy: "startsAt",
        sortOrder: "asc",
      }),
    ]);

    const todaySchedule = sessions
      .filter((session) => isSameLocalCalendarDay(session.scheduledStartAt, nowMs))
      .sort((a, b) => new Date(a.scheduledStartAt).getTime() - new Date(b.scheduledStartAt).getTime());

    const upcomingSessions = sessions
      .filter((session) => isUpcomingSession(session, nowMs))
      .sort((a, b) => new Date(a.scheduledStartAt).getTime() - new Date(b.scheduledStartAt).getTime());

    const nextRaw = upcomingSessions[0] ?? null;
    const nextSession = nextRaw
      ? {
          ...nextRaw,
          window: await this.appointmentsService.getSessionWindowSnapshot(nextRaw.sessionId),
        }
      : null;

    const pendingCount = notes.filter((note) => note.status !== "signed").length;
    const signedCount = notes.filter((note) => note.status === "signed").length;
    const prepCount = workspace.items.filter((item) => item.actions.length > 0).length;
    const attentionCount = workspace.items.filter((item) => item.readinessStatus === "attention").length;

    return {
      user: {
        userId: psychologistId,
        displayName: profile?.displayName ?? "Clinician",
      },
      sessions: {
        totalCount: sessions.length,
        todayCount: todaySchedule.length,
        upcomingCount: upcomingSessions.length,
        completedCount: sessions.filter((session) => session.status === "completed").length,
      },
      todaySchedule,
      nextSession,
      notes: { pendingCount, signedCount },
      workspace: {
        prepCount,
        attentionCount,
        itemCount: workspace.items.length,
      },
      generatedAt: new Date().toISOString(),
    };
  }
}
