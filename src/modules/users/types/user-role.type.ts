export const USER_ROLES = ["patient", "psychologist", "practice_manager", "admin"] as const;

export type UserRole = (typeof USER_ROLES)[number];
