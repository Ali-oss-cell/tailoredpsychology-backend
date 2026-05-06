export type AppointmentStatus = "scheduled" | "in_progress" | "completed" | "cancelled" | "no_show";

export type AppointmentRecord = {
  appointmentId: string;
  patientId: string;
  clinicianId: string;
  scheduledStartAt: string;
  scheduledEndAt: string;
  status: AppointmentStatus;
  chatWindowOpenAt: string;
  chatWindowCloseAt: string;
};
