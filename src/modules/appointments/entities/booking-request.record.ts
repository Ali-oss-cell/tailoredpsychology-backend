export type BookingRequestState =
  | "submitted"
  | "triage_review"
  | "matched_pending_confirmation"
  | "appointment_confirmed";

export type BookingRequestRecord = {
  bookingRequestId: string;
  patientId: string;
  clinicianId: string;
  slotId: string;
  appointmentDate: string;
  referralDocumentId: string;
  timezone: string;
  notes: string;
  state: BookingRequestState;
  createdAt: string;
  updatedAt: string;
};
