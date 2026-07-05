import { Module } from "@nestjs/common";

import { AppointmentsModule } from "../appointments/appointments.module";
import { AuthModule } from "../auth/auth.module";
import { PsychologistNotesModule } from "../psychologist-notes/psychologist-notes.module";
import { UsersModule } from "../users/users.module";
import { PsychologistPortalController } from "./psychologist-portal.controller";
import { PsychologistPortalService } from "./psychologist-portal.service";

@Module({
  imports: [AuthModule, AppointmentsModule, PsychologistNotesModule, UsersModule],
  controllers: [PsychologistPortalController],
  providers: [PsychologistPortalService],
  exports: [PsychologistPortalService],
})
export class PsychologistPortalModule {}
