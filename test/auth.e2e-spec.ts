import { ValidationPipe } from "@nestjs/common";
import { Test, TestingModule } from "@nestjs/testing";
import type { INestApplication } from "@nestjs/common";
import request from "supertest";

import { AppModule } from "../src/app.module";

describe("AuthController (e2e)", () => {
  let app: INestApplication;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.setGlobalPrefix("api");
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        transform: true,
        forbidNonWhitelisted: true,
      }),
    );
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  it("POST /api/auth/login succeeds with valid credentials", async () => {
    const response = await request(app.getHttpServer()).post("/api/auth/login").send({
      email: "patient@clink.test",
      password: "Patient123!",
    });

    expect(response.status).toBe(201);
    expect(response.body.accessToken).toEqual(expect.any(String));
    expect(response.body.user.email).toBe("patient@clink.test");
    expect(typeof response.body.user.accountSetupComplete).toBe("boolean");
  });


  it("POST /api/auth/register creates patient account and can login", async () => {
    const email = `new.patient.${Date.now()}@example.com`;
    const password = "Patient987!";

    const register = await request(app.getHttpServer()).post("/api/auth/register").send({
      email,
      password,
      displayName: "New Patient",
    });

    expect([200, 201]).toContain(register.status);
    expect(register.body.user.email).toBe(email);
    expect(register.body.user.role).toBe("patient");
    expect(register.body.user.accountSetupComplete).toBe(false);

    const patientId = register.body.user.id as string;
    const intakeSave = await request(app.getHttpServer())
      .post(`/api/patients/${patientId}/intake-delta`)
      .set("Authorization", `Bearer ${register.body.accessToken as string}`)
      .send({
        baseVersion: 0,
        delta: {
          patientIdentity: {
            fullName: "New Patient",
            dateOfBirth: "1995-05-05",
            mobile: "0411999000",
            email,
            suburb: "Sydney",
            state: "NSW",
            preferredContactMethod: "email",
          },
          consents: {
            privacyAccepted: true,
            telehealthAccepted: true,
            treatmentAccepted: true,
          },
        },
      });
    expect([200, 201]).toContain(intakeSave.status);

    const meAfterIntake = await request(app.getHttpServer())
      .get("/api/auth/me")
      .set("Authorization", `Bearer ${register.body.accessToken as string}`);
    expect(meAfterIntake.status).toBe(200);
    expect(meAfterIntake.body.accountSetupComplete).toBe(false);

    const acceptConsent = await request(app.getHttpServer())
      .post("/api/auth/consents/accept")
      .set("Authorization", `Bearer ${register.body.accessToken as string}`)
      .send({ policyVersion: "2026-04" });
    expect([200, 201]).toContain(acceptConsent.status);

    const onboardingCompat = await request(app.getHttpServer())
      .post("/api/auth/onboarding-complete")
      .set("Authorization", `Bearer ${register.body.accessToken as string}`);
    expect([200, 201]).toContain(onboardingCompat.status);
    expect(onboardingCompat.body.accountSetupComplete).toBe(true);

    const welcomeList = await request(app.getHttpServer())
      .get("/api/notifications")
      .set("Authorization", `Bearer ${register.body.accessToken as string}`);
    expect(welcomeList.status).toBe(200);
    expect(
      (welcomeList.body as Array<{ type: string }>).some((item) => item.type === "account_welcome"),
    ).toBe(true);

    const login = await request(app.getHttpServer()).post("/api/auth/login").send({
      email,
      password,
    });
    expect([200, 201]).toContain(login.status);
    expect(login.body.user.email).toBe(email);
  });

  it("POST /api/auth/login fails with invalid credentials", async () => {
    const response = await request(app.getHttpServer()).post("/api/auth/login").send({
      email: "patient@clink.test",
      password: "Invalid999!",
    });

    expect(response.status).toBe(401);
  });

  it("GET /api/auth/me requires auth token", async () => {
    const response = await request(app.getHttpServer()).get("/api/auth/me");
    expect(response.status).toBe(401);
  });

  it("GET /api/patients/me/profile matches GET /api/auth/me for patient", async () => {
    const login = await request(app.getHttpServer()).post("/api/auth/login").send({
      email: "patient@clink.test",
      password: "Patient123!",
    });
    const token = login.body.accessToken as string;

    const me = await request(app.getHttpServer()).get("/api/auth/me").set("Authorization", `Bearer ${token}`);
    const alias = await request(app.getHttpServer())
      .get("/api/patients/me/profile")
      .set("Authorization", `Bearer ${token}`);
    expect(me.status).toBe(200);
    expect(alias.status).toBe(200);
    expect(alias.body.id).toBe(me.body.id);
    expect(alias.body.email).toBe(me.body.email);
    expect(alias.body.patientContactProfile).toEqual(me.body.patientContactProfile);
  });

  it("GET /api/auth/me returns user with valid token", async () => {
    const login = await request(app.getHttpServer()).post("/api/auth/login").send({
      email: "admin@clink.test",
      password: "Admin123!",
    });

    const response = await request(app.getHttpServer())
      .get("/api/auth/me")
      .set("Authorization", `Bearer ${login.body.accessToken}`);

    expect(response.status).toBe(200);
    expect(response.body.email).toBe("admin@clink.test");
    expect(response.body.role).toBe("admin");
  });

  it("POST /api/auth/logout returns contract response", async () => {
    const response = await request(app.getHttpServer()).post("/api/auth/logout");
    expect(response.status).toBe(201);
    expect(response.body).toEqual({
      message: "Logged out. Discard token client-side for Sprint 1.",
      revoked: false,
    });
  });

  it("PATCH /api/auth/profile updates display name", async () => {
    const login = await request(app.getHttpServer()).post("/api/auth/login").send({
      email: "patient@clink.test",
      password: "Patient123!",
    });
    const token = login.body.accessToken as string;

    const patch = await request(app.getHttpServer())
      .patch("/api/auth/profile")
      .set("Authorization", `Bearer ${token}`)
      .send({ displayName: "Patient E2E Display" });
    expect(patch.status).toBe(200);
    expect(patch.body.displayName).toBe("Patient E2E Display");

    const revert = await request(app.getHttpServer())
      .patch("/api/auth/profile")
      .set("Authorization", `Bearer ${token}`)
      .send({ displayName: "Patient Demo" });
    expect(revert.status).toBe(200);
    expect(revert.body.displayName).toBe("Patient Demo");
  });

  it("PATCH /api/auth/profile updates patient contact profile and GET /auth/me returns it", async () => {
    const login = await request(app.getHttpServer()).post("/api/auth/login").send({
      email: "patient@clink.test",
      password: "Patient123!",
    });
    const token = login.body.accessToken as string;

    const patch = await request(app.getHttpServer())
      .patch("/api/auth/profile")
      .set("Authorization", `Bearer ${token}`)
      .send({
        displayName: "Patient Demo",
        patientContactProfile: {
          phoneMobile: "+61 411 222 333",
          preferredContactMethod: "sms",
          accessibilityNotes: "Captions preferred.",
          emergencyContactName: "Alex Chen",
          emergencyContactPhone: "+61 411 222 334",
          emergencyContactRelationship: "Sibling",
        },
      });
    expect(patch.status).toBe(200);
    expect(patch.body.patientContactProfile.phoneMobile).toBe("+61 411 222 333");
    expect(patch.body.patientContactProfile.preferredContactMethod).toBe("sms");

    const me = await request(app.getHttpServer()).get("/api/auth/me").set("Authorization", `Bearer ${token}`);
    expect(me.status).toBe(200);
    expect(me.body.patientContactProfile.emergencyContactName).toBe("Alex Chen");

    const revert = await request(app.getHttpServer())
      .patch("/api/auth/profile")
      .set("Authorization", `Bearer ${token}`)
      .send({
        displayName: "Patient Demo",
        patientContactProfile: {
          phoneMobile: "+61 400 000 000",
          preferredContactMethod: "email",
          accessibilityNotes: "",
          emergencyContactName: "Jamie Chen",
          emergencyContactPhone: "+61 400 000 001",
          emergencyContactRelationship: "Partner",
        },
      });
    expect(revert.status).toBe(200);
  });

  it("PATCH /api/auth/profile rejects patient contact fields for non-patient", async () => {
    const login = await request(app.getHttpServer()).post("/api/auth/login").send({
      email: "admin@clink.test",
      password: "Admin123!",
    });
    const token = login.body.accessToken as string;

    const patch = await request(app.getHttpServer())
      .patch("/api/auth/profile")
      .set("Authorization", `Bearer ${token}`)
      .send({
        displayName: "Admin Demo",
        patientContactProfile: { phoneMobile: "+61 400 000 000" },
      });
    expect(patch.status).toBe(400);
  });

  it("POST /api/auth/change-password rejects wrong current password", async () => {
    const login = await request(app.getHttpServer()).post("/api/auth/login").send({
      email: "patient2@clink.test",
      password: "Patient234!",
    });
    const token = login.body.accessToken as string;

    const response = await request(app.getHttpServer())
      .post("/api/auth/change-password")
      .set("Authorization", `Bearer ${token}`)
      .send({ currentPassword: "WrongPassword!", newPassword: "Newpass999!" });
    expect(response.status).toBe(401);
  });

  it("POST /api/auth/change-password succeeds and new password works", async () => {
    const login = await request(app.getHttpServer()).post("/api/auth/login").send({
      email: "patient2@clink.test",
      password: "Patient234!",
    });
    const token = login.body.accessToken as string;

    const change = await request(app.getHttpServer())
      .post("/api/auth/change-password")
      .set("Authorization", `Bearer ${token}`)
      .send({ currentPassword: "Patient234!", newPassword: "Patient234New!" });
    expect([200, 201]).toContain(change.status);

    const loginNew = await request(app.getHttpServer()).post("/api/auth/login").send({
      email: "patient2@clink.test",
      password: "Patient234New!",
    });
    expect(loginNew.status).toBe(201);

    const revert = await request(app.getHttpServer())
      .post("/api/auth/change-password")
      .set("Authorization", `Bearer ${loginNew.body.accessToken}`)
      .send({ currentPassword: "Patient234New!", newPassword: "Patient234!" });
    expect([200, 201]).toContain(revert.status);

    const loginOld = await request(app.getHttpServer()).post("/api/auth/login").send({
      email: "patient2@clink.test",
      password: "Patient234!",
    });
    expect(loginOld.status).toBe(201);
  });

  it("POST intake commit merges identity and emergency contact into patient profile", async () => {
    const email = `intake.profile.${Date.now()}@example.com`;
    const password = "Patient888!";
    const register = await request(app.getHttpServer()).post("/api/auth/register").send({
      email,
      password,
      displayName: "Intake Profile Test",
    });
    expect([200, 201]).toContain(register.status);
    const token = register.body.accessToken as string;
    const patientId = register.body.user.id as string;

    const delta = await request(app.getHttpServer())
      .post(`/api/patients/${patientId}/intake-delta`)
      .set("Authorization", `Bearer ${token}`)
      .send({
        baseVersion: 0,
        delta: {
          patientIdentity: {
            fullName: "Legal From Intake",
            dateOfBirth: "1992-06-01",
            mobile: "+61 499 000 777",
            email,
            preferredContactMethod: "sms",
          },
          telehealthSafety: {
            emergencyContactName: "Rowan Lee",
            emergencyContactPhone: "+61 499 000 888",
            emergencyContactRelationship: "Friend",
          },
          consents: {
            privacyAccepted: true,
            telehealthAccepted: true,
            treatmentAccepted: true,
          },
        },
      });
    expect([200, 201]).toContain(delta.status);

    const commit = await request(app.getHttpServer())
      .post(`/api/patients/${patientId}/intake-draft/commit`)
      .set("Authorization", `Bearer ${token}`);
    expect([200, 201]).toContain(commit.status);

    const me = await request(app.getHttpServer()).get("/api/auth/me").set("Authorization", `Bearer ${token}`);
    expect(me.status).toBe(200);
    expect(me.body.displayName).toBe("Legal From Intake");
    expect(me.body.patientContactProfile.phoneMobile).toBe("+61 499 000 777");
    expect(me.body.patientContactProfile.preferredContactMethod).toBe("sms");
    expect(me.body.patientContactProfile.emergencyContactName).toBe("Rowan Lee");
  });

  it("GET /api/health returns readiness payload", async () => {
    const response = await request(app.getHttpServer()).get("/api/health");
    expect(response.status).toBe(200);
    expect(response.body.status).toEqual(expect.stringMatching(/^(ok|degraded)$/));
    expect(typeof response.body.timestamp).toBe("string");
    expect(response.body.database).toEqual(
      expect.objectContaining({
        mode: expect.stringMatching(/^(postgresql|in_memory_fallback)$/),
        connected: expect.any(Boolean),
        migrationsReady: expect.any(Boolean),
      }),
    );
    expect(response.body.prisma).toEqual(
      expect.objectContaining({
        enabled: expect.any(Boolean),
        queryOk: expect.any(Boolean),
      }),
    );
    expect(response.body.readinessReminders).toEqual(
      expect.objectContaining({
        enabled: expect.any(Boolean),
        cron: expect.any(String),
      }),
    );
  });

  it("supports consent accept/withdraw lifecycle and re-consent trigger state", async () => {
    const email = `consent.patient.${Date.now()}@example.com`;
    const password = "Patient321!";
    const register = await request(app.getHttpServer()).post("/api/auth/register").send({
      email,
      password,
      displayName: "Consent Patient",
    });
    expect([200, 201]).toContain(register.status);
    const token = register.body.accessToken as string;
    const patientId = register.body.user.id as string;

    const intakeSave = await request(app.getHttpServer())
      .post(`/api/patients/${patientId}/intake-delta`)
      .set("Authorization", `Bearer ${token}`)
      .send({
        baseVersion: 0,
        delta: {
          patientIdentity: {
            fullName: "Consent Patient",
            dateOfBirth: "1993-02-02",
            mobile: "0411111111",
            email,
          },
          consents: {
            privacyAccepted: true,
            telehealthAccepted: true,
            treatmentAccepted: true,
          },
        },
      });
    expect([200, 201]).toContain(intakeSave.status);

    const beforeAccept = await request(app.getHttpServer()).get("/api/auth/me").set("Authorization", `Bearer ${token}`);
    expect(beforeAccept.status).toBe(200);
    expect(beforeAccept.body.consentStatus.requiresReconsent).toBe(true);
    expect(beforeAccept.body.accountSetupComplete).toBe(false);

    const accept = await request(app.getHttpServer())
      .post("/api/auth/consents/accept")
      .set("Authorization", `Bearer ${token}`)
      .send({ policyVersion: "2026-04" });
    expect([200, 201]).toContain(accept.status);
    expect(accept.body.requiresReconsent).toBe(false);

    const afterAccept = await request(app.getHttpServer()).get("/api/auth/me").set("Authorization", `Bearer ${token}`);
    expect(afterAccept.status).toBe(200);
    expect(afterAccept.body.consentStatus.requiresReconsent).toBe(false);
    expect(afterAccept.body.accountSetupComplete).toBe(true);

    const withdraw = await request(app.getHttpServer())
      .post("/api/auth/consents/withdraw")
      .set("Authorization", `Bearer ${token}`)
      .send({ reason: "Patient asked to withdraw consent." });
    expect([200, 201]).toContain(withdraw.status);
    expect(withdraw.body.requiresReconsent).toBe(true);

    const afterWithdraw = await request(app.getHttpServer()).get("/api/auth/me").set("Authorization", `Bearer ${token}`);
    expect(afterWithdraw.status).toBe(200);
    expect(afterWithdraw.body.consentStatus.requiresReconsent).toBe(true);
    expect(afterWithdraw.body.accountSetupComplete).toBe(false);
  });
});
