export type IntakeDraftRecord = {
  patientId: string;
  draftVersion: number;
  data: Record<string, unknown>;
  updatedAt: string;
  committedAt?: string;
};
