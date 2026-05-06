import { ApiProperty } from "@nestjs/swagger";

import { USER_ROLES, type UserRole } from "../types/user-role.type";

export class UserProfileDto {
  @ApiProperty({ example: "user_patient_001" })
  id!: string;

  @ApiProperty({ example: "patient@clink.test" })
  email!: string;

  @ApiProperty({ example: "Patient Demo" })
  displayName!: string;

  @ApiProperty({ enum: USER_ROLES, example: "patient" })
  role!: UserRole;
}
