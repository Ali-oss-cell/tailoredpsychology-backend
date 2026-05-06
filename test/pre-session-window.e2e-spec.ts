import { ValidationPipe } from "@nestjs/common";
import { Test, TestingModule } from "@nestjs/testing";
import type { INestApplication } from "@nestjs/common";
import request from "supertest";

import { AppModule } from "../src/app.module";

async function loginAndGetToken(app: INestApplication, email: string, password: string): Promise<string> {
  const login = await request(app.getHttpServer()).post("/api/auth/login").send({ email, password });
  return login.body.accessToken as string;
}

describe("Pre-session window (e2e)", () => {
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

  it("GET /api/appointments/:id/pre-session-window requires auth", async () => {
    const response = await request(app.getHttpServer()).get("/api/appointments/appt_open_001/pre-session-window");
    expect(response.status).toBe(401);
  });

  it("GET /api/appointments/:id/pre-session-window returns 404 for unknown appointment", async () => {
    const token = await loginAndGetToken(app, "patient@clink.test", "Patient123!");
    const response = await request(app.getHttpServer())
      .get("/api/appointments/appt_missing_001/pre-session-window")
      .set("Authorization", `Bearer ${token}`);

    expect(response.status).toBe(404);
  });

  it("GET /api/appointments/:id/pre-session-window blocks unauthorized patient", async () => {
    const token = await loginAndGetToken(app, "patient2@clink.test", "Patient234!");
    const response = await request(app.getHttpServer())
      .get("/api/appointments/appt_open_001/pre-session-window")
      .set("Authorization", `Bearer ${token}`);

    expect(response.status).toBe(403);
  });

  it("GET /api/appointments/:id/pre-session-window returns locked state", async () => {
    const token = await loginAndGetToken(app, "patient@clink.test", "Patient123!");
    const response = await request(app.getHttpServer())
      .get("/api/appointments/appt_locked_001/pre-session-window")
      .set("Authorization", `Bearer ${token}`);

    expect(response.status).toBe(200);
    expect(response.body.status).toBe("locked");
  });

  it("GET /api/appointments/:id/pre-session-window returns open state", async () => {
    const token = await loginAndGetToken(app, "patient@clink.test", "Patient123!");
    const response = await request(app.getHttpServer())
      .get("/api/appointments/appt_open_001/pre-session-window")
      .set("Authorization", `Bearer ${token}`);

    expect(response.status).toBe(200);
    expect(response.body.status).toBe("open");
  });

  it("GET /api/appointments/:id/pre-session-window returns closed state", async () => {
    const token = await loginAndGetToken(app, "patient@clink.test", "Patient123!");
    const response = await request(app.getHttpServer())
      .get("/api/appointments/appt_closed_001/pre-session-window")
      .set("Authorization", `Bearer ${token}`);

    expect(response.status).toBe(200);
    expect(response.body.status).toBe("closed");
  });
});
