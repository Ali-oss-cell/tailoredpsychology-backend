/**
 * Server-side rules for when a patient account is considered "setup complete".
 * Must stay aligned with intake draft shape saved by the booking wizard (see frontend BookingRequestDraft).
 */
export function isPatientIntakeDataComplete(data: Record<string, unknown>): boolean {
  const pi = data.patientIdentity;
  if (!pi || typeof pi !== "object") {
    return false;
  }
  const p = pi as Record<string, unknown>;
  const need = (v: unknown): boolean => typeof v === "string" && v.trim().length > 0;
  if (!need(p.fullName) || !need(p.dateOfBirth) || !need(p.mobile) || !need(p.email)) {
    return false;
  }
  const c = data.consents;
  if (!c || typeof c !== "object") {
    return false;
  }
  const cs = c as Record<string, unknown>;
  return Boolean(cs.privacyAccepted) && Boolean(cs.telehealthAccepted) && Boolean(cs.treatmentAccepted);
}
