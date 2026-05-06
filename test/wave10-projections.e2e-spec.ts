import { ValidationPipe } from "@nestjs/common";
import type { INestApplication } from "@nestjs/common";
import { Test, type TestingModule } from "@nestjs/testing";
import request from "supertest";

import { AppModule } from "../src/app.module";

async function loginAndGetToken(app: INestApplication, email: string, password: string): Promise<string> {
  const login = await request(app.getHttpServer()).post("/api/auth/login").send({ email, password });
  return login.body.accessToken as string;
}

describe("Wave 10 projections (e2e)", () => {
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

  it("returns patient journey timeline for owner patient", async () => {
    const patientToken = await loginAndGetToken(app, "patient@clink.test", "Patient123!");
    const response = await request(app.getHttpServer())
      .get("/api/patients/user_patient_001/journey-timeline")
      .set("Authorization", `Bearer ${patientToken}`);
    expect(response.status).toBe(200);
    expect(response.body.patientId).toBe("user_patient_001");
    expect(Array.isArray(response.body.steps)).toBe(true);
  });

  it("blocks patient from psychologist workspace endpoint", async () => {
    const patientToken = await loginAndGetToken(app, "patient@clink.test", "Patient123!");
    const response = await request(app.getHttpServer())
      .get("/api/psychologists/clinician_001/pre-session-workspace")
      .set("Authorization", `Bearer ${patientToken}`);
    expect(response.status).toBe(403);
  });

  it("returns psychologist pre-session workspace for admin", async () => {
    const adminToken = await loginAndGetToken(app, "admin@clink.test", "Admin123!");
    const response = await request(app.getHttpServer())
      .get("/api/psychologists/clinician_001/pre-session-workspace")
      .set("Authorization", `Bearer ${adminToken}`);
    expect(response.status).toBe(200);
    expect(response.body.psychologistId).toBe("clinician_001");
    expect(Array.isArray(response.body.items)).toBe(true);
    if (response.body.items[0]) {
      expect(response.body.items[0].readinessStatus).toEqual(expect.stringMatching(/ready|attention|unknown/));
      if (response.body.items[0].readinessUpdatedAt) {
        expect(typeof response.body.items[0].readinessUpdatedAt).toBe("string");
      }
    }
  });

  it("supports psychologist workspace readiness filters", async () => {
    const adminToken = await loginAndGetToken(app, "admin@clink.test", "Admin123!");
    const response = await request(app.getHttpServer())
      .get("/api/psychologists/clinician_002/pre-session-workspace?readinessStatus=unknown&sortBy=readinessStatus&sortOrder=asc")
      .set("Authorization", `Bearer ${adminToken}`);
    expect(response.status).toBe(200);
    expect(Array.isArray(response.body.items)).toBe(true);
    if (response.body.items[0]) {
      expect(response.body.items[0].readinessStatus).toBe("unknown");
    }
  });

  it("supports stale readiness filter in psychologist workspace", async () => {
    const adminToken = await loginAndGetToken(app, "admin@clink.test", "Admin123!");
    const response = await request(app.getHttpServer())
      .get("/api/psychologists/clinician_002/pre-session-workspace?staleMinutes=15")
      .set("Authorization", `Bearer ${adminToken}`);
    expect(response.status).toBe(200);
    expect(Array.isArray(response.body.items)).toBe(true);
    expect(response.body.items.length).toBeGreaterThan(0);
  });

  it("returns ops insights for practice manager", async () => {
    const managerToken = await loginAndGetToken(app, "manager@clink.test", "Manager123!");
    const response = await request(app.getHttpServer())
      .get("/api/ops/insights")
      .set("Authorization", `Bearer ${managerToken}`);
    expect(response.status).toBe(200);
    expect(response.body).toEqual(
      expect.objectContaining({
        queueTotal: expect.any(Number),
        urgentRiskCount: expect.any(Number),
        staleQueueCount: expect.any(Number),
        bookingRequestedCount: expect.any(Number),
        bookingConfirmedCount: expect.any(Number),
        sessionNoShowCount: expect.any(Number),
      }),
    );
  });

  it("forbids ops insights for patient role", async () => {
    const patientToken = await loginAndGetToken(app, "patient@clink.test", "Patient123!");
    const response = await request(app.getHttpServer())
      .get("/api/ops/insights")
      .set("Authorization", `Bearer ${patientToken}`);
    expect(response.status).toBe(403);
  });

  it("returns telehealth readiness checklist for appointment owner", async () => {
    const patientToken = await loginAndGetToken(app, "patient@clink.test", "Patient123!");
    const response = await request(app.getHttpServer())
      .get("/api/appointments/appt_open_001/readiness")
      .set("Authorization", `Bearer ${patientToken}`);
    expect(response.status).toBe(200);
    expect(response.body).toEqual(
      expect.objectContaining({
        appointmentId: "appt_open_001",
        overallStatus: expect.stringMatching(/ready|attention/),
        guidance: expect.any(String),
        checks: expect.arrayContaining([
          expect.objectContaining({
            key: expect.any(String),
            status: expect.stringMatching(/pass|review/),
            message: expect.any(String),
          }),
        ]),
      }),
    );
  });

  it("saves telehealth readiness for owner patient", async () => {
    const patientToken = await loginAndGetToken(app, "patient@clink.test", "Patient123!");
    const response = await request(app.getHttpServer())
      .post("/api/appointments/appt_open_001/readiness")
      .set("Authorization", `Bearer ${patientToken}`)
      .send({
        overallStatus: "attention",
        checks: [
          { key: "camera", status: "pass", message: "Camera access is available." },
          { key: "microphone", status: "review", message: "Microphone is blocked." },
          { key: "network", status: "pass", message: "Network stable." },
          { key: "session_window", status: "pass", message: "Session chat window is open and ready." },
        ],
      });
    expect(response.status).toBe(201);
    expect(response.body.overallStatus).toBe("attention");
    expect(Array.isArray(response.body.checks)).toBe(true);
    expect(typeof response.body.updatedAt).toBe("string");
  });

  it("forbids non-owner save of telehealth readiness", async () => {
    const adminToken = await loginAndGetToken(app, "admin@clink.test", "Admin123!");
    const response = await request(app.getHttpServer())
      .post("/api/appointments/appt_open_001/readiness")
      .set("Authorization", `Bearer ${adminToken}`)
      .send({
        overallStatus: "ready",
        checks: [{ key: "camera", status: "pass", message: "ok" }],
      });
    expect(response.status).toBe(403);
  });

  it("records join-attempt decision for appointment owner", async () => {
    const patientToken = await loginAndGetToken(app, "patient@clink.test", "Patient123!");
    const response = await request(app.getHttpServer())
      .post("/api/appointments/appt_open_001/join-attempt")
      .set("Authorization", `Bearer ${patientToken}`)
      .send({ channel: "video" });
    expect(response.status).toBe(201);
    expect(response.body).toEqual(
      expect.objectContaining({
        appointmentId: "appt_open_001",
        allowed: expect.any(Boolean),
        policyMode: "warn_allow",
        readinessStatus: expect.stringMatching(/ready|attention|unknown/),
        windowStatus: expect.stringMatching(/locked|open|closed/),
        reasons: expect.any(Array),
        recordedAt: expect.any(String),
      }),
    );
  });

  it("blocks non-owner patient join-attempt", async () => {
    const patientToken = await loginAndGetToken(app, "patient2@clink.test", "Patient234!");
    const response = await request(app.getHttpServer())
      .post("/api/appointments/appt_open_001/join-attempt")
      .set("Authorization", `Bearer ${patientToken}`)
      .send({ channel: "video" });
    expect(response.status).toBe(403);
  });

  it("creates join-session token for owner when window is open", async () => {
    const patientToken = await loginAndGetToken(app, "patient@clink.test", "Patient123!");
    const response = await request(app.getHttpServer())
      .post("/api/appointments/appt_open_001/join-session")
      .set("Authorization", `Bearer ${patientToken}`)
      .send({ channel: "video" });
    expect(response.status).toBe(201);
    expect(response.body).toEqual(
      expect.objectContaining({
        appointmentId: "appt_open_001",
        roomName: "clink_appt_open_001",
        participantIdentity: "user_patient_001",
        accessToken: expect.any(String),
        policyMode: "warn_allow",
        warnings: expect.any(Array),
      }),
    );
  });

  it("blocks join-session token when window is locked", async () => {
    const patientToken = await loginAndGetToken(app, "patient@clink.test", "Patient123!");
    const response = await request(app.getHttpServer())
      .post("/api/appointments/appt_locked_001/join-session")
      .set("Authorization", `Bearer ${patientToken}`)
      .send({ channel: "video" });
    expect(response.status).toBe(409);
  });

  it("returns appointment details for owner patient", async () => {
    const patientToken = await loginAndGetToken(app, "patient@clink.test", "Patient123!");
    const response = await request(app.getHttpServer())
      .get("/api/appointments/appt_manage_001")
      .set("Authorization", `Bearer ${patientToken}`);
    expect(response.status).toBe(200);
    expect(response.body).toEqual(
      expect.objectContaining({
        appointmentId: "appt_manage_001",
        patientId: "user_patient_001",
        clinicianId: "clinician_001",
        status: expect.stringMatching(/scheduled|in_progress|completed|cancelled|no_show/),
        chatWindowStatus: expect.stringMatching(/locked|open|closed/),
        canJoinNow: expect.any(Boolean),
        canManage: true,
      }),
    );
  });

  it("allows owner patient to reschedule appointment", async () => {
    const patientToken = await loginAndGetToken(app, "patient@clink.test", "Patient123!");
    const nextStart = new Date(Date.now() + 4 * 60 * 60 * 1000).toISOString();
    const response = await request(app.getHttpServer())
      .post("/api/appointments/appt_manage_001/manage")
      .set("Authorization", `Bearer ${patientToken}`)
      .send({ action: "reschedule", scheduledStartAt: nextStart });
    expect(response.status).toBe(201);
    expect(response.body.status).toBe("scheduled");
    expect(new Date(response.body.scheduledStartAt).getTime()).toBeGreaterThan(Date.now());
  });

  it("blocks patient reschedule when new start is under 1 hour away", async () => {
    const patientToken = await loginAndGetToken(app, "patient@clink.test", "Patient123!");
    const nextStart = new Date(Date.now() + 30 * 60 * 1000).toISOString();
    const response = await request(app.getHttpServer())
      .post("/api/appointments/appt_manage_001/manage")
      .set("Authorization", `Bearer ${patientToken}`)
      .send({ action: "reschedule", scheduledStartAt: nextStart });
    expect(response.status).toBe(400);
    expect(response.body.message).toContain("1 hour");
  });

  it("blocks patient reschedule within 2 hours of current session start", async () => {
    const patientToken = await loginAndGetToken(app, "patient@clink.test", "Patient123!");
    const nextStart = new Date(Date.now() + 4 * 60 * 60 * 1000).toISOString();
    const response = await request(app.getHttpServer())
      .post("/api/appointments/appt_open_001/manage")
      .set("Authorization", `Bearer ${patientToken}`)
      .send({ action: "reschedule", scheduledStartAt: nextStart });
    expect(response.status).toBe(400);
    expect(String(response.body.message)).toMatch(/2 hours|call the clinic/i);
  });

  it("blocks unrelated patient from managing appointment", async () => {
    const patientToken = await loginAndGetToken(app, "patient2@clink.test", "Patient234!");
    const response = await request(app.getHttpServer())
      .post("/api/appointments/appt_manage_001/manage")
      .set("Authorization", `Bearer ${patientToken}`)
      .send({ action: "cancel" });
    expect(response.status).toBe(403);
  });

  it("returns telehealth insights for practice manager", async () => {
    const managerToken = await loginAndGetToken(app, "manager@clink.test", "Manager123!");
    const response = await request(app.getHttpServer())
      .get("/api/ops/telehealth-insights")
      .set("Authorization", `Bearer ${managerToken}`);
    expect(response.status).toBe(200);
    expect(response.body).toEqual(
      expect.objectContaining({
        totalJoinAttempts: expect.any(Number),
        warnedJoinCount: expect.any(Number),
        warnedJoinRate: expect.any(Number),
        failedJoinCount: expect.any(Number),
        lateJoinCount: expect.any(Number),
        recoveryRate: expect.any(Number),
        last24h: expect.objectContaining({
          totalJoinAttempts: expect.any(Number),
          warnedJoinRate: expect.any(Number),
        }),
        last7d: expect.objectContaining({
          totalJoinAttempts: expect.any(Number),
          warnedJoinRate: expect.any(Number),
        }),
        clinicianBreakdown: expect.any(Array),
      }),
    );
  });

  it("blocks unrelated patient from telehealth readiness", async () => {
    const patientToken = await loginAndGetToken(app, "patient2@clink.test", "Patient234!");
    const response = await request(app.getHttpServer())
      .get("/api/appointments/appt_open_001/readiness")
      .set("Authorization", `Bearer ${patientToken}`);
    expect(response.status).toBe(403);
  });

  it("returns patient appointments list for owner", async () => {
    const patientToken = await loginAndGetToken(app, "patient@clink.test", "Patient123!");
    const response = await request(app.getHttpServer())
      .get("/api/patients/user_patient_001/appointments")
      .set("Authorization", `Bearer ${patientToken}`);
    expect(response.status).toBe(200);
    expect(Array.isArray(response.body.upcoming)).toBe(true);
    expect(Array.isArray(response.body.past)).toBe(true);
    if (response.body.upcoming[0]) {
      expect(response.body.upcoming[0]).toEqual(
        expect.objectContaining({
          appointmentId: expect.any(String),
          clinicianName: expect.any(String),
          sessionTypeLabel: expect.any(String),
          statusLabel: expect.any(String),
        }),
      );
    }
  });

  it("blocks unrelated patient from other patient appointments list", async () => {
    const patientToken = await loginAndGetToken(app, "patient2@clink.test", "Patient234!");
    const response = await request(app.getHttpServer())
      .get("/api/patients/user_patient_001/appointments")
      .set("Authorization", `Bearer ${patientToken}`);
    expect(response.status).toBe(403);
  });

  it("records and lists mood check-ins for owner patient", async () => {
    const patientToken = await loginAndGetToken(app, "patient@clink.test", "Patient123!");
    const postRes = await request(app.getHttpServer())
      .post("/api/patients/user_patient_001/mood-checkins")
      .set("Authorization", `Bearer ${patientToken}`)
      .send({ moodLabel: "Good" });
    expect(postRes.status).toBe(201);
    expect(postRes.body.moodLabel).toBe("Good");
    const getRes = await request(app.getHttpServer())
      .get("/api/patients/user_patient_001/mood-checkins?limit=5")
      .set("Authorization", `Bearer ${patientToken}`);
    expect(getRes.status).toBe(200);
    expect(getRes.body.items.length).toBeGreaterThanOrEqual(1);
    expect(getRes.body.items[0].moodLabel).toBe("Good");
  });

  it("returns psychologist workspace when psychologist uses auth user id", async () => {
    const psychToken = await loginAndGetToken(app, "psychologist@clink.test", "Psych123!");
    const response = await request(app.getHttpServer())
      .get("/api/psychologists/user_psychologist_001/pre-session-workspace?sortBy=startsAt&sortOrder=asc")
      .set("Authorization", `Bearer ${psychToken}`);
    expect(response.status).toBe(200);
    expect(response.body.psychologistId).toBe("user_psychologist_001");
    expect(Array.isArray(response.body.items)).toBe(true);
  });
});
