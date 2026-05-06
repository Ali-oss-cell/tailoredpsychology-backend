import type { UserRole } from "../../users/types/user-role.type";

export interface AuthJwtPayload {
  sub: string;
  email: string;
  role: UserRole;
  displayName: string;
}
