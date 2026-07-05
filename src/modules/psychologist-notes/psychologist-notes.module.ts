import { Module } from "@nestjs/common";

import { AppointmentsModule } from "../appointments/appointments.module";
import { AuditModule } from "../audit/audit.module";
import { UsersModule } from "../users/users.module";
import { ClinicianAvatarPublicController } from "./clinician-avatar-public.controller";
import { PsychologistNotesController } from "./psychologist-notes.controller";
import { PsychologistNotesService } from "./psychologist-notes.service";

@Module({
  imports: [UsersModule, AppointmentsModule, AuditModule],
  controllers: [PsychologistNotesController, ClinicianAvatarPublicController],
  providers: [PsychologistNotesService],
  exports: [PsychologistNotesService],
})
export class PsychologistNotesModule {}
