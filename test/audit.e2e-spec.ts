import { ValidationPipe } from "@nestjs/common";
import type { INestApplication } from "@nestjs/common";
import { Test, type TestingModule } from "@nestjs/testing";
import request from "supertest";

import { AppModule } from "../src/app.module";

async function loginAndGetToken(app: INestApplication, email: string, password: string): Promise<string> {
  const login = await request(app.getHttpServer()).post("/api/auth/login").send({ email, password });
  return login.body.accessToken as string;
}

describe("Audit events (e2e)", () => {
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

  it("GET /api/audit/events requires auth", async () => {
    const response = await request(app.getHttpServer()).get("/api/audit/events");
    expect(response.status).toBe(401);
  });

  it("GET /api/audit/events forbids patient role", async () => {
    const token = await loginAndGetToken(app, "patient@clink.test", "Patient123!");
    const response = await request(app.getHttpServer())
      .get("/api/audit/events")
      .set("Authorization", `Bearer ${token}`);
    expect(response.status).toBe(403);
  });

  it("persists referral upload audit event and supports action filter", async () => {
    const patientToken = await loginAndGetToken(app, "patient@clink.test", "Patient123!");
    const pdfBuffer = Buffer.from("%PDF-1.4\n%mock\n");
    const uploadResponse = await request(app.getHttpServer())
      .post("/api/documents/referrals")
      .set("Authorization", `Bearer ${patientToken}`)
      .field("sourceType", "gp_referral")
      .attach("file", pdfBuffer, { filename: "referral.pdf", contentType: "application/pdf" });
    expect(uploadResponse.status).toBe(201);

    const adminToken = await loginAndGetToken(app, "admin@clink.test", "Admin123!");
    const listResponse = await request(app.getHttpServer())
      .get("/api/audit/events")
      .query({ action: "referral_uploaded", actorUserId: "user_patient_001" })
      .set("Authorization", `Bearer ${adminToken}`);

    expect(listResponse.status).toBe(200);
    expect(Array.isArray(listResponse.body)).toBe(true);
    expect(listResponse.body.length).toBeGreaterThan(0);
    const event = listResponse.body[0] as {
      action: string;
      actorUserId: string;
      targetType: string;
      targetId: string;
      occurredAt: string;
    };
    expect(event.action).toBe("referral_uploaded");
    expect(event.actorUserId).toBe("user_patient_001");
    expect(event.targetType).toBe("referral_document");
    expect(event.targetId).toMatch(/^ref_/);
    expect(typeof event.occurredAt).toBe("string");
  });

  it("persists join-attempt audit event", async () => {
    const patientToken = await loginAndGetToken(app, "patient@clink.test", "Patient123!");
    const joinAttempt = await request(app.getHttpServer())
      .post("/api/appointments/appt_open_001/join-attempt")
      .set("Authorization", `Bearer ${patientToken}`)
      .send({ channel: "video", acknowledgementNote: "checked warning" });
    expect(joinAttempt.status).toBe(201);

    const adminToken = await loginAndGetToken(app, "admin@clink.test", "Admin123!");
    const listResponse = await request(app.getHttpServer())
      .get("/api/audit/events")
      .query({ targetType: "appointment", targetId: "appt_open_001", actorUserId: "user_patient_001" })
      .set("Authorization", `Bearer ${adminToken}`);
    expect(listResponse.status).toBe(200);
    const matched = (listResponse.body as Array<{ action: string; metadata?: Record<string, unknown> }>).find(
      (event) => event.action === "join_attempt_warned" || event.action === "join_attempt_allowed",
    );
    expect(matched).toBeDefined();
  });

  it("persists session_join_granted audit event with override reason", async () => {
    const clinicianToken = await loginAndGetToken(app, "psychologist@clink.test", "Psych123!");
    const joinResponse = await request(app.getHttpServer())
      .post("/api/appointments/appt_open_001/join-session")
      .set("Authorization", `Bearer ${clinicianToken}`)
      .send({ channel: "video", overrideReason: "patient requested quick start" });
    expect(joinResponse.status).toBe(201);

    const adminToken = await loginAndGetToken(app, "admin@clink.test", "Admin123!");
    const auditResponse = await request(app.getHttpServer())
      .get("/api/audit/events")
      .query({ action: "session_join_granted", targetType: "appointment", targetId: "appt_open_001" })
      .set("Authorization", `Bearer ${adminToken}`);
    expect(auditResponse.status).toBe(200);
    const joinedEvent = (auditResponse.body as Array<{ metadata?: Record<string, unknown> }>)[0];
    expect(joinedEvent).toBeDefined();
    expect(joinedEvent.metadata?.overrideReason).toBe("patient requested quick start");
  });
});
