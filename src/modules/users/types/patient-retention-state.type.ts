export type PatientRetentionState = {
  deletedAt: string | null;
  deletionReason: string | null;
  deletedByUserId: string | null;
  legalHoldActive: boolean;
  legalHoldReason: string | null;
  legalHoldSetByUserId: string | null;
  legalHoldSetAt: string | null;
  retentionUntil: string | null;
  purgedAt: string | null;
  lastInteractionAt: string | null;
};

export function emptyPatientRetentionState(): PatientRetentionState {
  return {
    deletedAt: null,
    deletionReason: null,
    deletedByUserId: null,
    legalHoldActive: false,
    legalHoldReason: null,
    legalHoldSetByUserId: null,
    legalHoldSetAt: null,
    retentionUntil: null,
    purgedAt: null,
    lastInteractionAt: null,
  };
}
