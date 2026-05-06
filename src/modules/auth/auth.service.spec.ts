import { ConfigModule, ConfigService } from "@nestjs/config";
import { JwtModule } from "@nestjs/jwt";
import { Test, TestingModule } from "@nestjs/testing";

import { AppointmentsService } from "../appointments/appointments.service";
import { AuditService } from "../audit/audit.service";
import { CoreModule } from "../core/core.module";
import { NotificationsService } from "../notifications/notifications.service";
import { UsersModule } from "../users/users.module";
import { AuthService } from "./auth.service";
import { ConsentLifecycleService } from "./consent-lifecycle.service";

describe("AuthService", () => {
  let authService: AuthService;

  beforeEach(async () => {
    const moduleRef: TestingModule = await Test.createTestingModule({
      imports: [
        ConfigModule.forRoot({ isGlobal: true }),
        CoreModule,
        UsersModule,
        JwtModule.register({
          secret: "clink-dev-secret",
          signOptions: { expiresIn: 3600 },
        }),
      ],
      providers: [
        AuthService,
        {
          provide: ConfigService,
          useValue: {
            get: (key: string): string | undefined => {
              if (key === "AUTH_JWT_EXPIRES_IN") {
                return "3600s";
              }
              if (key === "AUTH_JWT_SECRET") {
                return "clink-dev-secret";
              }
              return undefined;
            },
          },
        },
        {
          provide: AuditService,
          useValue: {
            recordEvent: jest.fn(),
          },
        },
        {
          provide: NotificationsService,
          useValue: {
            createNotification: jest.fn().mockResolvedValue(null),
          },
        },
        {
          provide: AppointmentsService,
          useValue: {
            getIntakeDraftDataForPatientInternal: jest.fn().mockResolvedValue({
              data: {
                patientIdentity: {
                  fullName: "Patient",
                  dateOfBirth: "1990-01-01",
                  mobile: "0400000000",
                  email: "patient@clink.test",
                },
                consents: {
                  privacyAccepted: true,
                  telehealthAccepted: true,
                  treatmentAccepted: true,
                },
              },
            }),
          },
        },
        {
          provide: ConsentLifecycleService,
          useValue: {
            getStatus: jest.fn().mockResolvedValue({
              requiredVersion: "2026-04",
              activeVersion: "2026-04",
              hasActiveConsent: true,
              requiresReconsent: false,
              acceptedAt: new Date().toISOString(),
              withdrawnAt: null,
            }),
          },
        },
      ],
    }).compile();

    authService = moduleRef.get<AuthService>(AuthService);
  });

  it("creates a bearer session for valid credentials", async () => {
    const session = await authService.login({
      email: "patient@clink.test",
      password: "Patient123!",
    });

    expect(session.tokenType).toBe("Bearer");
    expect(session.accessToken).toEqual(expect.any(String));
    expect(session.user.email).toBe("patient@clink.test");
  });

  it("throws on invalid credentials", async () => {
    await expect(
      authService.login({
        email: "patient@clink.test",
        password: "wrong-password",
      }),
    ).rejects.toThrow("Invalid credentials");
  });
});
