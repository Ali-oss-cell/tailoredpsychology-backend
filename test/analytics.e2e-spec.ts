import { ValidationPipe } from "@nestjs/common";
import type { INestApplication } from "@nestjs/common";
import { Test, type TestingModule } from "@nestjs/testing";
import request from "supertest";

import { AppModule } from "../src/app.module";

async function loginAndGetToken(app: INestApplication, email: string, password: string): Promise<string> {
  const login = await request(app.getHttpServer()).post("/api/auth/login").send({ email, password });
  return login.body.accessToken as string;
}

describe("Analytics events (e2e)", () => {
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

  it("rejects invalid event schema", async () => {
    const token = await loginAndGetToken(app, "patient@clink.test", "Patient123!");
    const response = await request(app.getHttpServer())
      .post("/api/analytics/events")
      .set("Authorization", `Bearer ${token}`)
      .send({
        name: "unknown_event",
        targetId: "x1",
      });
    expect(response.status).toBe(400);
  });

  it("does not duplicate events with same idempotency key", async () => {
    const token = await loginAndGetToken(app, "patient@clink.test", "Patient123!");
    const payload = {
      name: "intake_started",
      targetId: "user_patient_001",
      idempotencyKey: "intake_started:user_patient_001",
    };

    const first = await request(app.getHttpServer())
      .post("/api/analytics/events")
      .set("Authorization", `Bearer ${token}`)
      .send(payload);
    const second = await request(app.getHttpServer())
      .post("/api/analytics/events")
      .set("Authorization", `Bearer ${token}`)
      .send(payload);

    expect(first.status).toBe(201);
    expect(second.status).toBe(201);
    expect(first.body.eventId).toBe(second.body.eventId);
  });

  it("records join funnel analytics events from join-attempt and join-session flows", async () => {
    const patientToken = await loginAndGetToken(app, "patient@clink.test", "Patient123!");
    const managerToken = await loginAndGetToken(app, "manager@clink.test", "Manager123!");

    const attemptResponse = await request(app.getHttpServer())
      .post("/api/appointments/appt_open_001/join-attempt")
      .set("Authorization", `Bearer ${patientToken}`)
      .send({ channel: "video" });
    expect(attemptResponse.status).toBe(201);

    const joinResponse = await request(app.getHttpServer())
      .post("/api/appointments/appt_open_001/join-session")
      .set("Authorization", `Bearer ${patientToken}`)
      .send({ channel: "video" });
    expect(joinResponse.status).toBe(201);

    const eventsResponse = await request(app.getHttpServer())
      .get("/api/analytics/events")
      .set("Authorization", `Bearer ${managerToken}`);
    expect(eventsResponse.status).toBe(200);
    const names = (eventsResponse.body as Array<{ name: string }>).map((event) => event.name);
    expect(names).toContain("join_attempted");
    expect(names).toContain("join_success");
  });
});
