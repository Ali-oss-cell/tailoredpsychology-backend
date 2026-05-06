import { ValidationPipe } from "@nestjs/common";
import type { INestApplication } from "@nestjs/common";
import { Test, type TestingModule } from "@nestjs/testing";
import request from "supertest";

import { AppModule } from "../src/app.module";

async function loginAndGetToken(app: INestApplication, email: string, password: string): Promise<string> {
  const login = await request(app.getHttpServer()).post("/api/auth/login").send({ email, password });
  return login.body.accessToken as string;
}

describe("Notifications (e2e)", () => {
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

  it("GET /api/notifications requires auth", async () => {
    const response = await request(app.getHttpServer()).get("/api/notifications");
    expect(response.status).toBe(401);
  });

  it("lists notifications and marks them as read", async () => {
    const patientToken = await loginAndGetToken(app, "patient@clink.test", "Patient123!");
    await request(app.getHttpServer())
      .post("/api/booking-requests")
      .set("Authorization", `Bearer ${patientToken}`)
      .send({
        clinicianId: "clinician_001",
        slotId: "clinician_001_2026-05-12_0900",
        appointmentDate: "2026-05-12",
        timezone: "Australia/Sydney",
        idempotencyKey: "notif-case-1",
      });

    const listResponse = await request(app.getHttpServer())
      .get("/api/notifications")
      .set("Authorization", `Bearer ${patientToken}`);
    expect(listResponse.status).toBe(200);
    expect(Array.isArray(listResponse.body)).toBe(true);
    expect(listResponse.body.length).toBeGreaterThan(0);

    const firstId = listResponse.body[0].notificationId as string;
    const markReadResponse = await request(app.getHttpServer())
      .patch(`/api/notifications/${firstId}/read`)
      .set("Authorization", `Bearer ${patientToken}`);
    expect(markReadResponse.status).toBe(200);
    expect(typeof markReadResponse.body.readAt).toBe("string");
  });

  it("reads and updates preferences", async () => {
    const patientToken = await loginAndGetToken(app, "patient@clink.test", "Patient123!");
    const getResponse = await request(app.getHttpServer())
      .get("/api/notifications/preferences")
      .set("Authorization", `Bearer ${patientToken}`);
    expect(getResponse.status).toBe(200);
    expect(getResponse.body.inAppEnabled).toBe(true);

    const updateResponse = await request(app.getHttpServer())
      .post("/api/notifications/preferences")
      .set("Authorization", `Bearer ${patientToken}`)
      .send({
        inAppEnabled: true,
        bookingSubmitted: false,
        bookingConfirmed: true,
        chatWindowOpen: true,
        sessionStartingSoon: true,
      });
    expect(updateResponse.status).toBe(201);
    expect(updateResponse.body.bookingSubmitted).toBe(false);
  });

  it("issues stream token for realtime notifications", async () => {
    const patientToken = await loginAndGetToken(app, "patient@clink.test", "Patient123!");
    const response = await request(app.getHttpServer())
      .get("/api/notifications/stream-token")
      .set("Authorization", `Bearer ${patientToken}`);
    expect(response.status).toBe(200);
    expect(typeof response.body.socketToken).toBe("string");
    expect(response.body.expiresInSeconds).toBe(300);
  });

  it("dispatches telehealth readiness reminders once per reminder window", async () => {
    const managerToken = await loginAndGetToken(app, "manager@clink.test", "Manager123!");
    const patientToken = await loginAndGetToken(app, "patient@clink.test", "Patient123!");

    const firstDispatch = await request(app.getHttpServer())
      .post("/api/ops/readiness-reminders/dispatch")
      .set("Authorization", `Bearer ${managerToken}`);
    expect(firstDispatch.status).toBe(201);
    expect(firstDispatch.body).toEqual(
      expect.objectContaining({
        scannedAppointments: expect.any(Number),
        dispatchedCount: expect.any(Number),
        escalatedCount: expect.any(Number),
      }),
    );

    const patientNotifications = await request(app.getHttpServer())
      .get("/api/notifications")
      .set("Authorization", `Bearer ${patientToken}`);
    expect(patientNotifications.status).toBe(200);
    const readinessReminderCount = patientNotifications.body.filter(
      (item: { type: string; metadata?: Record<string, string> }) =>
        item.type === "session_starting_soon" && item.metadata?.appointmentId === "appt_open_001",
    ).length;
    expect(readinessReminderCount).toBeGreaterThan(0);

    const secondDispatch = await request(app.getHttpServer())
      .post("/api/ops/readiness-reminders/dispatch")
      .set("Authorization", `Bearer ${managerToken}`);
    expect(secondDispatch.status).toBe(201);

    const patientNotificationsAfterSecond = await request(app.getHttpServer())
      .get("/api/notifications")
      .set("Authorization", `Bearer ${patientToken}`);
    const readinessReminderCountAfterSecond = patientNotificationsAfterSecond.body.filter(
      (item: { type: string; metadata?: Record<string, string> }) =>
        item.type === "session_starting_soon" && item.metadata?.appointmentId === "appt_open_001",
    ).length;
    expect(readinessReminderCountAfterSecond).toBe(readinessReminderCount);
  });
});
