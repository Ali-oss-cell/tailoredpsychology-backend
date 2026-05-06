import { createParamDecorator, ExecutionContext } from "@nestjs/common";

import type { AuthJwtPayload } from "../interfaces/auth-jwt-payload.interface";

export const CurrentUser = createParamDecorator((_: unknown, context: ExecutionContext): AuthJwtPayload => {
  const request = context.switchToHttp().getRequest<{ user: AuthJwtPayload }>();
  return request.user;
});
