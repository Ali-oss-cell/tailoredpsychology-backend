import { Controller, Get } from "@nestjs/common";
import { ApiTags } from "@nestjs/swagger";
import { SkipThrottle } from "@nestjs/throttler";

import { AppService } from "./app.service";

@ApiTags("core")
@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get("health")
  @SkipThrottle()
  health() {
    return this.appService.health();
  }

  @Get("version")
  @SkipThrottle()
  version() {
    return this.appService.version();
  }
}
