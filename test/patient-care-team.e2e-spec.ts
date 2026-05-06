import { ValidationPipe } from "@nestjs/common";
import type { INestApplication } from "@nestjs/common";
import { Test, type TestingModule } from "@nestjs/testing";
import request from "supertest";

import { AppModule } from "../src/app.module";

async function loginAndGetToken(app: INestApplication, email: string, password: string): Promise<string> {
  const login = await request(app.getHttpServer()).post("/api/auth/login").send({ email, password });
  return login.body.accessToken as string;
}

describe("Patient care team (e2e)", () => {
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

  it("returns care team derived from patient appointments", async () => {
    const token = await loginAndGetToken(app, "patient@clink.test", "Patient123!");
    const res = await request(app.getHttpServer())
      .get("/api/patients/me/care-team")
      .set("Authorization", `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body.length).toBeGreaterThan(0);
    const first = res.body[0] as {
      clinicianId: string;
      psychologistUserId: string;
      displayName: string;
      specialties: string[];
    };
    expect(first).toEqual(
      expect.objectContaining({
        clinicianId: expect.any(String),
        psychologistUserId: expect.stringMatching(/user_psychologist_/),
        displayName: expect.any(String),
        specialties: expect.any(Array),
      }),
    );
  });

  it("rejects non-patient roles", async () => {
    const token = await loginAndGetToken(app, "psychologist@clink.test", "Psych123!");
    const res = await request(app.getHttpServer())
      .get("/api/patients/me/care-team")
      .set("Authorization", `Bearer ${token}`);

    expect(res.status).toBe(403);
  });
});
