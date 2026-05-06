import { ValidationPipe } from "@nestjs/common";
import { Test, TestingModule } from "@nestjs/testing";
import type { INestApplication } from "@nestjs/common";
import request from "supertest";

import { AppModule } from "../src/app.module";

async function loginAndGetToken(app: INestApplication, email: string, password: string): Promise<string> {
  const login = await request(app.getHttpServer()).post("/api/auth/login").send({ email, password });
  return login.body.accessToken as string;
}

describe("Pre-session chat window (e2e)", () => {
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

  it("GET /api/appointments/:id/chat-window requires auth", async () => {
    const response = await request(app.getHttpServer()).get("/api/appointments/appt_open_001/chat-window");
    expect(response.status).toBe(401);
  });

  it("GET /api/appointments/:id/chat-window blocks unauthorized patient", async () => {
    const token = await loginAndGetToken(app, "patient2@clink.test", "Patient234!");
    const response = await request(app.getHttpServer())
      .get("/api/appointments/appt_open_001/chat-window")
      .set("Authorization", `Bearer ${token}`);

    expect(response.status).toBe(403);
  });

  it("GET /api/appointments/:id/chat-window returns state", async () => {
    const token = await loginAndGetToken(app, "patient@clink.test", "Patient123!");
    const response = await request(app.getHttpServer())
      .get("/api/appointments/appt_open_001/chat-window")
      .set("Authorization", `Bearer ${token}`);

    expect(response.status).toBe(200);
    expect(response.body.status).toMatch(/locked|open|closed/);
    expect(typeof response.body.messageCount).toBe("number");
  });

  it("POST /api/appointments/:id/chat/messages rejects when window locked", async () => {
    const token = await loginAndGetToken(app, "patient@clink.test", "Patient123!");
    const response = await request(app.getHttpServer())
      .post("/api/appointments/appt_locked_001/chat/messages")
      .set("Authorization", `Bearer ${token}`)
      .send({ message: "Can we start early?" });

    expect(response.status).toBe(409);
  });

  it("POST /api/appointments/:id/chat/messages accepts when window open", async () => {
    const token = await loginAndGetToken(app, "patient@clink.test", "Patient123!");
    const response = await request(app.getHttpServer())
      .post("/api/appointments/appt_open_001/chat/messages")
      .set("Authorization", `Bearer ${token}`)
      .send({ message: "Hi, I am ready for the session." });

    expect(response.status).toBe(201);
    expect(response.body.appointmentId).toBe("appt_open_001");
    expect(response.body.messageId).toEqual(expect.stringMatching(/^msg_/));
  });

  it("POST /api/appointments/:id/chat/messages rejects when window closed", async () => {
    const token = await loginAndGetToken(app, "patient@clink.test", "Patient123!");
    const response = await request(app.getHttpServer())
      .post("/api/appointments/appt_closed_001/chat/messages")
      .set("Authorization", `Bearer ${token}`)
      .send({ message: "Following up after session." });

    expect(response.status).toBe(409);
  });
});
