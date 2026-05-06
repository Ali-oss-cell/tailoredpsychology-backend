import { Global, Module } from "@nestjs/common";

import { PrismaModule } from "../prisma/prisma.module";
import { DatabaseService } from "./database.service";

@Global()
@Module({
  imports: [PrismaModule],
  providers: [DatabaseService],
  exports: [DatabaseService],
})
export class CoreModule {}
